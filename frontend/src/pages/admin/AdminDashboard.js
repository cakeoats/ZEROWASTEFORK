import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    HiShoppingBag, HiUsers, HiCash,
    HiOutlineViewGrid, HiOutlineCube, HiOutlineUserGroup,
    HiOutlineCog, HiOutlineLogout, HiMenu, HiX
} from 'react-icons/hi';
import { getApiUrl, getImageUrl, getAuthHeaders } from '../../config/api';

function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');
    const navigate = useNavigate();

    // State for data
    const [dashboardData, setDashboardData] = useState({
        productCount: 0,
        userCount: 0,
        recentProducts: [],
        loading: true,
        error: null
    });

    // Check if admin is logged in
    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        const adminId = localStorage.getItem('adminId');

        if (!adminToken || !adminId) {
            // If not logged in, redirect to admin login page
            navigate('/admin/login');
        } else {
            // Fetch dashboard data
            fetchDashboardData(adminToken);
        }
    }, [navigate]);

    // Fetch dashboard data
    const fetchDashboardData = async (token) => {
        try {
            // Fetch product count and recent products
            const productsResponse = await axios.get(getApiUrl('api/admin/products'), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Fetch user count
            const usersResponse = await axios.get(getApiUrl('api/admin/users/count'), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setDashboardData({
                productCount: productsResponse.data.totalProducts || 0,
                userCount: usersResponse.data.totalUsers || 0,
                recentProducts: productsResponse.data.recentProducts || [],
                loading: false,
                error: null
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setDashboardData(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to load dashboard data'
            }));
        }
    };

    // Handle logout
    const handleLogout = () => {
        // Remove admin data from localStorage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminId');

        // Redirect to login page
        navigate('/admin/login');
    };

    // Data dummy untuk statistik (akan diganti dengan data real)
    const stats = [
        {
            title: "Total Produk",
            value: dashboardData.loading ? "Loading..." : dashboardData.productCount.toString(),
            change: "+3%",
            icon: <HiOutlineCube className="h-6 w-6" />,
            color: "bg-amber-100 text-amber-600"
        },
        {
            title: "Total Pengguna",
            value: dashboardData.loading ? "Loading..." : dashboardData.userCount.toString(),
            change: "+5%",
            icon: <HiUsers className="h-6 w-6" />,
            color: "bg-purple-100 text-purple-600"
        },
        {
            title: "Total Pendapatan",
            value: "Rp 25.450.000",
            change: "+12%",
            icon: <HiCash className="h-6 w-6" />,
            color: "bg-green-100 text-green-600"
        },
        {
            title: "Total Pesanan",
            value: "1.245",
            change: "+8%",
            icon: <HiShoppingBag className="h-6 w-6" />,
            color: "bg-blue-100 text-blue-600"
        }
    ];

    // Data dummy untuk pesanan terbaru (akan diganti dengan data real di tahap selanjutnya)
    const recentOrders = [
        { id: "#ORD-001", customer: "John Doe", date: "15 Jun 2023", amount: "Rp 1.250.000", status: "Selesai" },
        { id: "#ORD-002", customer: "Jane Smith", date: "14 Jun 2023", amount: "Rp 2.750.000", status: "Diproses" },
        { id: "#ORD-003", customer: "Robert Johnson", date: "13 Jun 2023", amount: "Rp 850.000", status: "Dikirim" },
        { id: "#ORD-004", customer: "Emily Davis", date: "12 Jun 2023", amount: "Rp 3.500.000", status: "Selesai" }
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
                <div className="relative flex flex-col w-72 max-w-xs h-full bg-white">
                    <div className="flex items-center justify-between px-4 py-4 border-b">
                        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                        <button onClick={() => setSidebarOpen(false)} className="text-gray-500">
                            <HiX className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="flex-1 px-4 py-4 space-y-1">
                        <SidebarLink
                            icon={<HiOutlineViewGrid className="h-5 w-5" />}
                            text="Dashboard"
                            active={currentView === 'dashboard'}
                            onClick={() => setCurrentView('dashboard')}
                        />
                        <SidebarLink
                            icon={<HiOutlineCube className="h-5 w-5" />}
                            text="Manajemen Produk"
                            active={currentView === 'products'}
                            onClick={() => setCurrentView('products')}
                        />
                        <SidebarLink
                            icon={<HiShoppingBag className="h-5 w-5" />}
                            text="Pesanan"
                            active={currentView === 'orders'}
                            onClick={() => setCurrentView('orders')}
                        />
                        <SidebarLink
                            icon={<HiOutlineUserGroup className="h-5 w-5" />}
                            text="Pelanggan"
                            active={currentView === 'customers'}
                            onClick={() => setCurrentView('customers')}
                        />
                    </nav>
                    <div className="px-4 py-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 text-red-500 hover:text-red-600 transition-colors"
                        >
                            <HiOutlineLogout className="h-5 w-5" />
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:flex-shrink-0">
                <div className="flex flex-col w-72 border-r border-gray-200 bg-white">
                    <div className="flex items-center justify-between px-4 py-4 border-b">
                        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                    </div>
                    <nav className="flex-1 px-4 py-4 space-y-1">
                        <SidebarLink
                            icon={<HiOutlineViewGrid className="h-5 w-5" />}
                            text="Dashboard"
                            active={currentView === 'dashboard'}
                            onClick={() => setCurrentView('dashboard')}
                        />
                        <SidebarLink
                            icon={<HiOutlineCube className="h-5 w-5" />}
                            text="Manajemen Produk"
                            active={currentView === 'products'}
                            onClick={() => setCurrentView('products')}
                        />
                        <SidebarLink
                            icon={<HiShoppingBag className="h-5 w-5" />}
                            text="Pesanan"
                            active={currentView === 'orders'}
                            onClick={() => setCurrentView('orders')}
                        />
                        <SidebarLink
                            icon={<HiOutlineUserGroup className="h-5 w-5" />}
                            text="Pelanggan"
                            active={currentView === 'customers'}
                            onClick={() => setCurrentView('customers')}
                        />
                    </nav>
                    <div className="px-4 py-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 text-red-500 hover:text-red-600 transition-colors"
                        >
                            <HiOutlineLogout className="h-5 w-5" />
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navigation */}
                <header className="bg-white shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden text-gray-500 focus:outline-none"
                        >
                            <HiMenu className="h-6 w-6" />
                        </button>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari..."
                                    className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                <div className="absolute left-3 top-2.5 text-gray-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <img
                                    src="https://randomuser.me/api/portraits/men/32.jpg"
                                    alt="Admin"
                                    className="h-8 w-8 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {/* Dashboard View */}
                    {currentView === 'dashboard' && (
                        <>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {stats.map((stat, index) => (
                                    <div key={index} className="bg-white rounded-lg shadow p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                                <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                                            </div>
                                            <div className={`rounded-full p-3 ${stat.color}`}>
                                                {stat.icon}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Products */}
                            <div className="bg-white rounded-lg shadow mb-8">
                                <div className="p-4 border-b flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Produk Terbaru</h3>
                                    <button
                                        onClick={() => setCurrentView('products')}
                                        className="text-sm text-amber-600 hover:underline"
                                    >
                                        Lihat Semua
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    {dashboardData.loading ? (
                                        <div className="text-center py-4">Loading...</div>
                                    ) : dashboardData.error ? (
                                        <div className="text-center py-4 text-red-500">{dashboardData.error}</div>
                                    ) : dashboardData.recentProducts.length === 0 ? (
                                        <div className="text-center py-4">Belum ada produk.</div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penjual</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {dashboardData.recentProducts.map((product) => (
                                                    <tr key={product._id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10">
                                                                    <img
                                                                        className="h-10 w-10 rounded-full object-cover"
                                                                        src={getImageUrl(product.imageUrl || product.images?.[0]) || "https://via.placeholder.com/100"}
                                                                        alt={product.name}
                                                                    />
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                                    <div className="text-sm text-gray-500">{new Date(product.createdAt).toLocaleDateString()}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{product.seller_id?.username || 'Unknown'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                {product.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            Rp {product.price?.toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <a href={`/products/${product._id}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-900 mx-2">
                                                                View
                                                            </a>
                                                            <button onClick={() => setCurrentView('products')} className="text-amber-600 hover:text-amber-900 mx-2">
                                                                Manage
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            {/* Recent Orders */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="p-4 border-b flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Pesanan Terbaru</h3>
                                    <button
                                        onClick={() => setCurrentView('orders')}
                                        className="text-sm text-amber-600 hover:underline"
                                    >
                                        Lihat Semua
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pesanan</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggan</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentOrders.map((order, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.amount}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${order.status === 'Selesai' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'Diproses' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-blue-100 text-blue-800'}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <button onClick={() => setCurrentView('orders')} className="text-amber-600 hover:text-amber-900">
                                                            Detail
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Products Management View */}
                    {currentView === 'products' && (
                        <ProductManagement />
                    )}

                    {currentView === 'orders' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Manajemen Pesanan</h2>
                            {/* Order management content would go here */}
                        </div>
                    )}

                    {currentView === 'customers' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Manajemen Pelanggan</h2>
                            {/* Customer management content would go here */}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// Komponen Product Management
function ProductManagement() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');
    const [actionError, setActionError] = useState('');

    // Fetch products on component mount
    useEffect(() => {
        fetchProducts();
    }, []);

    // Function to fetch products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');

            const response = await axios.get(getApiUrl('api/admin/products'), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setProducts(response.data.products || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to load products');
            setLoading(false);
        }
    };

    // Function to handle product deletion
    const handleDeleteProduct = async () => {
        if (!productToDelete || !deleteReason.trim()) {
            setActionError('Alasan penghapusan harus diisi');
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');

            await axios.delete(getApiUrl(`api/admin/products/${productToDelete._id}`), {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                data: {
                    reason: deleteReason
                }
            });

            // Update local state to remove the deleted product
            setProducts(products.filter(p => p._id !== productToDelete._id));

            // Show success message and close modal
            setActionSuccess(`Produk "${productToDelete.name}" berhasil dihapus`);
            setShowDeleteModal(false);
            setProductToDelete(null);
            setDeleteReason('');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setActionSuccess('');
            }, 3000);

        } catch (error) {
            console.error('Error deleting product:', error);
            setActionError(error.response?.data?.message || 'Gagal menghapus produk');

            // Clear error message after 3 seconds
            setTimeout(() => {
                setActionError('');
            }, 3000);
        }
    };

    // Filter products based on search and category
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = categoryFilter === '' || product.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    // Get unique categories from products
    const categories = [...new Set(products.map(product => product.category))];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manajemen Produk</h2>
                <div className="flex space-x-2">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {actionSuccess && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">{actionSuccess}</p>
                        </div>
                    </div>
                </div>
            )}

            {actionError && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{actionError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Products List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                        <p className="mt-2 text-gray-500">Loading products...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-red-500">{error}</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="flex justify-center">
                            <HiOutlineCube className="w-16 h-16 text-gray-300" />
                        </div>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">Tidak ada produk ditemukan</h3>
                        <p className="mt-1 text-gray-500">Tidak ada produk yang sesuai dengan filter Anda.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penjual</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Upload</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.map((product) => (
                                    <tr key={product._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={getImageUrl(product.imageUrl || product.images?.[0]) || "https://via.placeholder.com/100"}
                                                        alt={product.name}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://via.placeholder.com/100?text=No+Image"
                                                        }}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{product.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{product.seller_id?.username || product.seller_id?.full_name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{product.seller_id?.email || ''}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            Rp {product.price?.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${product.tipe === 'Sell' ? 'bg-green-100 text-green-800' :
                                                    product.tipe === 'Donation' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-amber-100 text-amber-800'}`}>
                                                {product.tipe === 'Sell' ? 'Jual' :
                                                    product.tipe === 'Donation' ? 'Donasi' :
                                                        product.tipe === 'Swap' ? 'Tukar' : product.tipe}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(product.createdAt).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <a
                                                href={`/products/${product._id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Lihat
                                            </a>
                                            <button
                                                onClick={() => {
                                                    setProductToDelete(product);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Hapus Produk</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500 mb-4">
                                    Apakah Anda yakin ingin menghapus produk "<span className="font-medium">{productToDelete?.name}</span>"?
                                </p>
                                <div className="mb-4">
                                    <label htmlFor="delete-reason" className="block text-sm font-medium text-left text-gray-700 mb-1">
                                        Alasan Penghapusan <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="delete-reason"
                                        value={deleteReason}
                                        onChange={(e) => setDeleteReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                        rows="3"
                                        placeholder="Jelaskan alasan penghapusan produk ini"
                                    ></textarea>
                                    <p className="text-xs text-gray-500 text-left mt-1">
                                        Alasan ini akan dikirimkan kepada pemilik produk sebagai notifikasi.
                                    </p>
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setProductToDelete(null);
                                            setDeleteReason('');
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleDeleteProduct}
                                        className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Komponen Sidebar Link
function SidebarLink({ icon, text, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left transition-colors
        ${active ? 'bg-amber-50 text-amber-600' : 'text-gray-700 hover:bg-gray-100'}`}
        >
            <span className={`${active ? 'text-amber-600' : 'text-gray-500'}`}>
                {icon}
            </span>
            <span className="font-medium">{text}</span>
        </button>
    );
}

export default AdminDashboard;