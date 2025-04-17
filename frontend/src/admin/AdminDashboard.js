import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HiShoppingBag, HiUsers, HiCash,
    HiOutlineViewGrid, HiOutlineCube, HiOutlineUserGroup,
    HiOutlineCog, HiOutlineLogout, HiMenu, HiX
} from 'react-icons/hi';

function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');

    // Data dummy untuk statistik
    const stats = [
        { title: "Total Pendapatan", value: "Rp 25.450.000", change: "+12%", icon: <HiCash className="h-6 w-6" />, color: "bg-green-100 text-green-600" },
        { title: "Total Pesanan", value: "1.245", change: "+8%", icon: <HiShoppingBag className="h-6 w-6" />, color: "bg-blue-100 text-blue-600" },
        { title: "Pelanggan", value: "845", change: "+5%", icon: <HiUsers className="h-6 w-6" />, color: "bg-purple-100 text-purple-600" },
        { title: "Produk", value: "156", change: "+3%", icon: <HiOutlineCube className="h-6 w-6" />, color: "bg-amber-100 text-amber-600" }
    ];

    // Data dummy untuk pesanan terbaru
    const recentOrders = [
        { id: "#ORD-001", customer: "John Doe", date: "15 Jun 2023", amount: "Rp 1.250.000", status: "Selesai" },
        { id: "#ORD-002", customer: "Jane Smith", date: "14 Jun 2023", amount: "Rp 2.750.000", status: "Diproses" },
        { id: "#ORD-003", customer: "Robert Johnson", date: "13 Jun 2023", amount: "Rp 850.000", status: "Dikirim" },
        { id: "#ORD-004", customer: "Emily Davis", date: "12 Jun 2023", amount: "Rp 3.500.000", status: "Selesai" }
    ];

    // Data dummy untuk produk terlaris
    const topProducts = [
        { name: "iPhone 14 Pro", sales: 45, revenue: "Rp 85.500.000" },
        { name: "Nike Air Jordan", sales: 32, revenue: "Rp 88.000.000" },
        { name: "Samsung Galaxy S23", sales: 28, revenue: "Rp 56.000.000" },
        { name: "Apple Watch Series 8", sales: 25, revenue: "Rp 37.500.000" }
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
                            text="Produk"
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
                        <SidebarLink
                            icon={<HiOutlineCog className="h-5 w-5" />}
                            text="Pengaturan"
                            active={currentView === 'settings'}
                            onClick={() => setCurrentView('settings')}
                        />
                    </nav>
                    <div className="px-4 py-4 border-t">
                        <button className="flex items-center space-x-3 text-red-500">
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
                            text="Produk"
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
                        <button className="flex items-center space-x-3 text-red-500">
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

                            {/* Recent Orders */}
                            <div className="bg-white rounded-lg shadow mb-8">
                                <div className="p-4 border-b flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Pesanan Terbaru</h3>
                                    <Link to="/admin/orders" className="text-sm text-amber-600 hover:underline">
                                        Lihat Semua
                                    </Link>
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
                                                        <Link to={`/admin/orders/${order.id}`} className="text-amber-600 hover:text-amber-900">
                                                            Detail
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="p-4 border-b flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Produk Terlaris</h3>
                                    <Link to="/admin/products" className="text-sm text-amber-600 hover:underline">
                                        Lihat Semua
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penjualan</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendapatan</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {topProducts.map((product, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sales} items</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.revenue}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <Link to={`/admin/products/edit/${product.name}`} className="text-amber-600 hover:text-amber-900">
                                                            Kelola
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {currentView === 'products' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Manajemen Produk</h2>
                            {/* Product management content would go here */}
                        </div>
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