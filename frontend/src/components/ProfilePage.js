import React, { useState } from 'react';
import { Button, Avatar, TextInput, Textarea } from 'flowbite-react';
import { HiOutlinePencilAlt, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineCalendar } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import NavbarComponent from './NavbarComponent';

function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+62 812 3456 7890',
        address: 'Jl. Contoh No. 123, Jakarta, Indonesia',
        birthDate: '15 Januari 1990',
        bio: 'Saya adalah pengguna setia ZeroWasteMarket yang suka berbelanja produk berkualitas dengan harga terbaik.'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setIsEditing(false);
        // Tambahkan logika untuk menyimpan data ke backend di sini
    };

    return (
        <div className="min-h-screen bg-amber-50">
        <NavbarComponent />
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                    <Link to="/" className="text-blue-600 hover:underline">Kembali ke Beranda</Link>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-white p-6 text-black">
                        <div className="flex flex-col md:flex-row items-center">
                            <div className="relative mb-4 md:mb-0 md:mr-6">
                                <Avatar
                                    img="https://randomuser.me/api/portraits/men/32.jpg"
                                    rounded
                                    size="xl"
                                />
                                {isEditing && (
                                    <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md">
                                        <HiOutlinePencilAlt className="h-5 w-5 text-amber-600" />
                                    </button>
                                )}
                            </div>
                            <div>
                                {isEditing ? (
                                    <TextInput
                                        name="name"
                                        value={userData.name}
                                        onChange={handleInputChange}
                                        className="text-2xl font-bold mb-1 bg-white/90 rounded"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold">{userData.name}</h2>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="p-6">
                        {/* Bio Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-2 text-gray-800">Tentang Saya</h3>
                            {isEditing ? (
                                <Textarea
                                    name="bio"
                                    value={userData.bio}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full"
                                />
                            ) : (
                                <p className="text-gray-600">{userData.bio}</p>
                            )}
                        </div>

                        {/* Personal Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="flex items-start">
                                <HiOutlineMail className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                                    {isEditing ? (
                                        <TextInput
                                            name="email"
                                            value={userData.email}
                                            onChange={handleInputChange}
                                            className="w-full"
                                        />
                                    ) : (
                                        <p className="text-gray-800">{userData.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start">
                                <HiOutlinePhone className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Telepon</h4>
                                    {isEditing ? (
                                        <TextInput
                                            name="phone"
                                            value={userData.phone}
                                            onChange={handleInputChange}
                                            className="w-full"
                                        />
                                    ) : (
                                        <p className="text-gray-800">{userData.phone}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start">
                                <HiOutlineLocationMarker className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Alamat</h4>
                                    {isEditing ? (
                                        <TextInput
                                            name="address"
                                            value={userData.address}
                                            onChange={handleInputChange}
                                            className="w-full"
                                        />
                                    ) : (
                                        <p className="text-gray-800">{userData.address}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start">
                                <HiOutlineCalendar className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Tanggal Lahir</h4>
                                    {isEditing ? (
                                        <TextInput
                                            name="birthDate"
                                            value={userData.birthDate}
                                            onChange={handleInputChange}
                                            className="w-full"
                                        />
                                    ) : (
                                        <p className="text-gray-800">{userData.birthDate}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4">
                            {isEditing ? (
                                <>
                                    <Button gradientDuoTone="amberToOrange" onClick={handleSave}>
                                        Simpan Perubahan
                                    </Button>
                                    <Button color="light" onClick={() => setIsEditing(false)}>
                                        Batal
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button gradientDuoTone="amberToOrange" onClick={() => setIsEditing(true)}>
                                        <HiOutlinePencilAlt className="mr-2 h-5 w-5" />
                                        Edit Profil
                                    </Button>
                                    <Button color="blue">
                                        Ganti Password
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Additional Sections */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order History */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Riwayat Pesanan</h3>
                        <div className="space-y-4">
                            <div className="border-b pb-4">
                                <p className="font-medium">Order #12345 - 15 Juni 2023</p>
                                <p className="text-gray-600">2 items • Rp 1.250.000</p>
                                <p className="text-amber-600 font-medium">Selesai</p>
                            </div>
                            <div className="border-b pb-4">
                                <p className="font-medium">Order #12344 - 10 Juni 2023</p>
                                <p className="text-gray-600">3 items • Rp 2.750.000</p>
                                <p className="text-amber-600 font-medium">Selesai</p>
                            </div>
                            <Link to="/orders" className="text-amber-600 hover:underline inline-block mt-2">
                                Lihat semua pesanan →
                            </Link>
                        </div>
                    </div>

                    {/* Wishlist */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Wishlist</h3>
                        <div className="space-y-4">
                            <div className="flex items-center border-b pb-4">
                                <img
                                    src="https://images.unsplash.com/photo-1546868871-7041f2a55e12"
                                    alt="Product"
                                    className="w-16 h-16 object-cover rounded mr-4"
                                />
                                <div>
                                    <p className="font-medium">iPhone 14 Pro</p>
                                    <p className="text-gray-600">Rp 18.999.000</p>
                                </div>
                            </div>
                            <div className="flex items-center border-b pb-4">
                                <img
                                    src="https://images.unsplash.com/photo-1594035910387-fea47794261f"
                                    alt="Product"
                                    className="w-16 h-16 object-cover rounded mr-4"
                                />
                                <div>
                                    <p className="font-medium">Nike Air Jordan</p>
                                    <p className="text-gray-600">Rp 2.750.000</p>
                                </div>
                            </div>
                            <Link to="/wishlist" className="text-amber-600 hover:underline inline-block mt-2">
                                Lihat wishlist lengkap →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;