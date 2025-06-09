// backend/controller/orderController.js
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/User');

// Get user's order history
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 10, sort = 'newest' } = req.query;

        console.log(`📋 Fetching orders for user: ${userId}`);

        // Build filter
        let filter = { buyer: userId };

        if (status && status !== 'all') {
            filter.status = status;
        }

        // Sort options
        let sortOption = {};
        switch (sort) {
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'amount-high':
                sortOption = { totalAmount: -1 };
                break;
            case 'amount-low':
                sortOption = { totalAmount: 1 };
                break;
            case 'newest':
            default:
                sortOption = { createdAt: -1 };
                break;
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Get orders with pagination
        const orders = await Order.find(filter)
            .populate({
                path: 'product',
                select: 'name price images category condition tipe'
            })
            .populate({
                path: 'products.product',
                select: 'name price images category condition tipe'
            })
            .populate({
                path: 'seller',
                select: 'username full_name email'
            })
            .sort(sortOption)
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        // Get total count for pagination
        const totalOrders = await Order.countDocuments(filter);

        // Process orders to ensure consistent image URLs
        const processedOrders = orders.map(order => {
            // Handle single product orders
            if (order.product && order.product.images) {
                order.product.imageUrl = order.product.images[0];
                order.product.imageUrls = order.product.images;
            }

            // Handle cart orders (multiple products)
            if (order.products && order.products.length > 0) {
                order.products = order.products.map(item => {
                    if (item.product && item.product.images) {
                        item.product.imageUrl = item.product.images[0];
                        item.product.imageUrls = item.product.images;
                    }
                    return item;
                });
            }

            return order;
        });

        // Calculate pagination info
        const totalPages = Math.ceil(totalOrders / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        console.log(`✅ Found ${processedOrders.length} orders out of ${totalOrders} total`);

        res.json({
            success: true,
            orders: processedOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalOrders,
                hasNextPage,
                hasPrevPage,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('❌ Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order history',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get single order details
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        console.log(`🔍 Fetching order details: ${orderId} for user: ${userId}`);

        const order = await Order.findOne({
            _id: orderId,
            buyer: userId
        })
            .populate({
                path: 'product',
                select: 'name price images category condition tipe description'
            })
            .populate({
                path: 'products.product',
                select: 'name price images category condition tipe description'
            })
            .populate({
                path: 'seller',
                select: 'username full_name email phone'
            })
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Process images
        if (order.product && order.product.images) {
            order.product.imageUrl = order.product.images[0];
            order.product.imageUrls = order.product.images;
        }

        if (order.products && order.products.length > 0) {
            order.products = order.products.map(item => {
                if (item.product && item.product.images) {
                    item.product.imageUrl = item.product.images[0];
                    item.product.imageUrls = item.product.images;
                }
                return item;
            });
        }

        console.log(`✅ Order details fetched successfully`);

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error('❌ Error fetching order details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order details',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get order statistics for user
const getOrderStats = async (req, res) => {
    try {
        const userId = req.user._id;

        console.log(`📊 Calculating order statistics for user: ${userId}`);

        const stats = await Order.aggregate([
            { $match: { buyer: userId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Calculate overall stats
        const totalOrders = await Order.countDocuments({ buyer: userId });
        const totalSpent = await Order.aggregate([
            { $match: { buyer: userId, status: { $in: ['paid', 'completed'] } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const processedStats = {
            totalOrders,
            totalSpent: totalSpent[0]?.total || 0,
            byStatus: {
                pending: 0,
                paid: 0,
                cancelled: 0,
                completed: 0
            }
        };

        // Process status stats
        stats.forEach(stat => {
            if (processedStats.byStatus.hasOwnProperty(stat._id)) {
                processedStats.byStatus[stat._id] = stat.count;
            }
        });

        console.log(`✅ Order statistics calculated:`, processedStats);

        res.json({
            success: true,
            stats: processedStats
        });

    } catch (error) {
        console.error('❌ Error calculating order statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate order statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Cancel order (only for pending orders)
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;
        const { reason } = req.body;

        console.log(`❌ Cancelling order: ${orderId} for user: ${userId}`);

        const order = await Order.findOne({
            _id: orderId,
            buyer: userId,
            status: 'pending'
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or cannot be cancelled'
            });
        }

        // Update order status
        order.status = 'cancelled';
        order.cancelReason = reason || 'Cancelled by user';
        order.cancelledAt = new Date();

        await order.save();

        console.log(`✅ Order cancelled successfully`);

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order
        });

    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    getUserOrders,
    getOrderDetails,
    getOrderStats,
    cancelOrder
};