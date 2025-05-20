import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, TextInput, Textarea, Select, Spinner, Alert } from 'flowbite-react';
import {
    HiOutlinePencilAlt,
    HiOutlineTrash,
    HiOutlineExclamationCircle,
    HiOutlineEye
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

const UserProductsTab = () => {
    // State for products
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const productsPerPage = 6;

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Filter state
    const [filterStatus, setFilterStatus] = useState('all');

    // Edit form state
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: '',
        condition: 'new',
        tipe: 'Sell'
    });

    // Categories for dropdown
    const categories = [
        'Men Fashion', 'Women Fashion', 'Automotive', 'Gadget',
        'Decoration', 'Sports', 'Health and Beauty'
    ];

    // Fetch user's products
    useEffect(() => {
        const fetchUserProducts = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No token found');

                const response = await axios.get(`${API_URL}/api/users/products`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setProducts(response.data);
                setTotalPages(Math.ceil(response.data.length / productsPerPage));
            } catch (err) {
                console.error('Error fetching user products:', err);
                setError('Failed to load your products. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProducts();
    }, []);

    // Handle edit product
    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: product.price.toString(),
            description: product.description || '',
            category: product.category || '',
            condition: product.condition || 'new',
            tipe: product.tipe || 'Sell'
        });
        setShowEditModal(true);
    };

    // Handle delete product
    const handleDelete = (product) => {
        setProductToDelete(product);
        setDeleteReason('');
        setShowDeleteModal(true);
    };

    // Handle form change
    const handleChange = (e) => {
        const { name, value } = e.target;

        // For price input, only allow numbers
        if (name === 'price' && value !== '' && !/^\d+$/.test(value)) return;

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Submit edit form
    const handleEditSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No token found');

            const response = await axios.put(
                `${API_URL}/api/products/${editingProduct._id}`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Update the product in the local state
            setProducts(products.map(p =>
                p._id === editingProduct._id ? { ...p, ...response.data.product } : p
            ));

            setSuccess('Product updated successfully!');
            setShowEditModal(false);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error updating product:', err);
            setError(err.response?.data?.message || 'Failed to update product');

            // Clear error message after 3 seconds
            setTimeout(() => setError(null), 3000);
        }
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!deleteReason.trim()) {
            setError('Please provide a reason for deletion');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No token found');

            await axios.delete(`${API_URL}/api/products/${productToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { reason: deleteReason }
            });

            // Remove the deleted product from the local state
            setProducts(products.filter(p => p._id !== productToDelete._id));

            setSuccess('Product deleted successfully!');
            setShowDeleteModal(false);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error deleting product:', err);
            setError(err.response?.data?.message || 'Failed to delete product');

            // Clear error message after 3 seconds
            setTimeout(() => setError(null), 3000);
        }
    };

    // Filter products
    const filteredProducts = products.filter(product => {
        if (filterStatus === 'all') return true;
        return product.tipe === filterStatus;
    });

    // Paginate products
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Get image URL
    const getImageUrl = (product) => {
        if (product.imageUrl) {
            return product.imageUrl;
        }

        if (product.images && product.images.length > 0) {
            if (product.images[0].startsWith('http')) {
                return product.images[0];
            }
            return `${API_URL}/${product.images[0]}`;
        }

        return 'https://via.placeholder.com/300';
    };

    // Format price
    const formatPrice = (price) => {
        return `Rp ${Number(price).toLocaleString('id-ID')}`;
    };

    // Get badge color based on product type
    const getBadgeColor = (tipe) => {
        switch (tipe) {
            case 'Sell': return 'bg-green-100 text-green-800';
            case 'Donation': return 'bg-purple-100 text-purple-800';
            case 'Swap': return 'bg-amber-100 text-amber-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get type label
    const getTypeLabel = (tipe) => {
        switch (tipe) {
            case 'Sell': return 'Jual';
            case 'Donation': return 'Donasi';
            case 'Swap': return 'Tukar';
            default: return tipe;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-3 md:mb-0">My Products</h2>

                    <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
                        {/* Filter */}
                        <Select
                            id="filterStatus"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full md:w-48"
                        >
                            <option value="all">All Types</option>
                            <option value="Sell">For Sale</option>
                            <option value="Donation">Donation</option>
                            <option value="Swap">Swap</option>
                        </Select>

                        {/* Upload New Product */}
                        <Link to="/upload-product">
                            <Button color="success" className="w-full">
                                Upload New Product
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <Alert color="failure" className="mb-4">
                        <span className="font-medium">Error!</span> {error}
                    </Alert>
                )}

                {success && (
                    <Alert color="success" className="mb-4">
                        <span className="font-medium">Success!</span> {success}
                    </Alert>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Spinner size="xl" color="warning" />
                        <span className="ml-2 text-gray-500">Loading your products...</span>
                    </div>
                ) : products.length === 0 ? (
                    // Empty State
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="inline-flex justify-center items-center w-24 h-24 bg-gray-100 rounded-full mb-4">
                            <HiOutlineExclamationCircle className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Found</h3>
                        <p className="text-gray-500 mb-6">You haven't uploaded any products yet.</p>
                    </div>
                ) : (
                    // Product Grid
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            {currentProducts.map((product) => (
                                <Card key={product._id} className="transform transition-transform hover:scale-105">
                                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                                        <img
                                            src={getImageUrl(product)}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                                            }}
                                        />
                                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(product.tipe)}`}>
                                            {getTypeLabel(product.tipe)}
                                        </div>
                                    </div>

                                    <h5 className="text-lg font-bold tracking-tight text-gray-900 truncate">
                                        {product.name}
                                    </h5>

                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg text-amber-600">
                                            {formatPrice(product.price)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(product.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <p className="font-normal text-gray-700 line-clamp-2">
                                        {product.description || 'No description provided.'}
                                    </p>

                                    <div className="flex justify-between gap-2 mt-2">
                                        <Link to={`/products/${product._id}`} className="inline-flex items-center px-3 py-2 text-center text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:ring-4 focus:outline-none focus:ring-blue-300 flex-1">
                                            <HiOutlineEye className="mr-1" />
                                            View
                                        </Link>

                                        <Button
                                            color="light"
                                            onClick={() => handleEdit(product)}
                                            className="flex-1"
                                        >
                                            <HiOutlinePencilAlt className="mr-1" />
                                            Edit
                                        </Button>

                                        <Button
                                            color="failure"
                                            onClick={() => handleDelete(product)}
                                            className="flex-1"
                                        >
                                            <HiOutlineTrash className="mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-6">
                                <nav aria-label="Page navigation">
                                    <ul className="inline-flex items-center -space-x-px">
                                        <li>
                                            <button
                                                onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                                                disabled={currentPage === 1}
                                                className={`block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 hover:text-gray-700'
                                                    }`}
                                            >
                                                <span className="sr-only">Previous</span>
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                                </svg>
                                            </button>
                                        </li>

                                        {[...Array(totalPages).keys()].map(number => (
                                            <li key={number + 1}>
                                                <button
                                                    onClick={() => paginate(number + 1)}
                                                    className={`px-3 py-2 leading-tight border border-gray-300 ${currentPage === number + 1
                                                            ? 'text-blue-600 bg-blue-50 border-blue-300'
                                                            : 'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700'
                                                        }`}
                                                >
                                                    {number + 1}
                                                </button>
                                            </li>
                                        ))}

                                        <li>
                                            <button
                                                onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                                disabled={currentPage === totalPages}
                                                className={`block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 hover:text-gray-700'
                                                    }`}
                                            >
                                                <span className="sr-only">Next</span>
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                                </svg>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Product Modal */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
                <Modal.Header>Edit Product</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Product Name <span className="text-red-500">*</span>
                            </label>
                            <TextInput
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Product Name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                Price (Rp) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <span className="text-gray-500">Rp</span>
                                </div>
                                <TextInput
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="pl-9"
                                    placeholder="50000"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>Select category</option>
                                    {categories.map((category) => (
                                        <option key={category} value={category.toLowerCase()}>
                                            {category}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <label htmlFor="tipe" className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Type <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    id="tipe"
                                    name="tipe"
                                    value={formData.tipe}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Sell">For Sale</option>
                                    <option value="Donation">Donation</option>
                                    <option value="Swap">Swap</option>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Condition <span className="text-red-500">*</span>
                            </label>
                            <div className="flex space-x-4">
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="new"
                                        name="condition"
                                        value="new"
                                        checked={formData.condition === 'new'}
                                        onChange={handleChange}
                                        className="w-4 h-4"
                                    />
                                    <label htmlFor="new" className="ml-2 text-sm font-medium text-gray-700">
                                        New
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="used"
                                        name="condition"
                                        value="used"
                                        checked={formData.condition === 'used'}
                                        onChange={handleChange}
                                        className="w-4 h-4"
                                    />
                                    <label htmlFor="used" className="ml-2 text-sm font-medium text-gray-700">
                                        Used
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your product in detail"
                                rows={4}
                                required
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="gray" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button color="success" onClick={handleEditSubmit}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <Modal.Header>Delete Product</Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
                        <h3 className="mb-5 text-lg font-medium text-gray-900">
                            Are you sure you want to delete this product?
                        </h3>
                        <p className="text-sm text-gray-700 mb-4">
                            This action cannot be undone. The product "{productToDelete?.name}" will be permanently removed.
                        </p>
                        <div className="mb-4">
                            <label htmlFor="deleteReason" className="block text-sm font-medium text-left text-gray-700 mb-1">
                                Reason for deletion <span className="text-red-500">*</span>
                            </label>
                            <Textarea
                                id="deleteReason"
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                rows={3}
                                placeholder="Please provide a reason for deleting this product"
                                required
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="gray" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button color="failure" onClick={confirmDelete}>
                        Yes, Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UserProductsTab;