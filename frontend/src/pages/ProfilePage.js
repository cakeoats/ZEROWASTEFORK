import React, { useState, useEffect, useRef } from 'react';
import { Button, Avatar, TextInput, Textarea, Modal, Tabs, Toast } from 'flowbite-react';
import {
  HiOutlinePencilAlt, HiOutlineMail, HiOutlinePhone,
  HiOutlineLocationMarker, HiOutlineDocumentText, HiOutlineLockClosed,
  HiOutlineUser, HiOutlineShoppingBag, HiCheck, HiX
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import NavbarComponent from '../components/NavbarComponent';
import UserProductsTab from './product/UserProductsTab'; // Import the new component
import axios from 'axios';

function ProfilePage() {
  // State for active tab
  const [activeTab, setActiveTab] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    joinedAt: '',
    profilePicture: '',
  });

  // State for success/error alerts
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // State for change password modal
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // State for profile picture
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const API_URL = 'http://localhost:5000';

  // Helper to show success toast
  const showSuccess = (message) => {
    setToastMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Helper to show error toast
  const showError = (message) => {
    setToastMessage(message);
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      // Log what we're sending to help with debugging
      console.log('Sending data:', {
        full_name: userData.full_name,
        username: userData.username,
        phone: userData.phone,
        address: userData.address,
        bio: userData.bio
      });

      const res = await axios.put(
        `${API_URL}/api/users/profile`,
        {
          full_name: userData.full_name,
          username: userData.username,
          phone: userData.phone,
          address: userData.address,
          bio: userData.bio
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Response:', res.data);

      setUserData((prev) => ({
        ...prev,
        full_name: res.data.user.full_name,
        username: res.data.user.username,
        phone: res.data.user.phone,
        address: res.data.user.address,
        bio: res.data.user.bio,
        joinedAt: res.data.user.joinedAt,
      }));

      setIsEditing(false);
      // Show success toast instead of alert
      showSuccess('Profil berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error.message);
      // Show error toast instead of alert
      showError(error.response?.data?.message || 'Gagal memperbarui profil');
    }
  };

  // Handler untuk mengubah password
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validasi
    if (!passwordData.currentPassword) {
      setPasswordError('Password saat ini wajib diisi');
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordError('Password baru wajib diisi');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Konfirmasi password tidak sesuai');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password baru harus minimal 6 karakter');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      await axios.post(
        `${API_URL}/api/users/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPasswordSuccess('Password berhasil diubah!');

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPasswordSuccess('');
        showSuccess('Password berhasil diubah!');
      }, 2000);

    } catch (error) {
      console.error('Error changing password:', error.response?.data || error.message);
      setPasswordError(error.response?.data?.message || 'Gagal mengubah password');
    }
  };

  // Handler untuk foto profil
  const handleProfilePictureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);

      // Preview image
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!profileImage) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const formData = new FormData();
      formData.append('profilePicture', profileImage);

      const res = await axios.post(
        `${API_URL}/api/users/profile-picture`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUserData(prev => ({
        ...prev,
        profilePicture: res.data.profilePicture
      }));

      // Reset file input
      setProfileImage(null);
      showSuccess('Foto profil berhasil diperbarui!');
    } catch (error) {
      console.error('Error uploading profile picture:', error.response?.data || error.message);
      showError(error.response?.data?.message || 'Gagal mengupload foto profil');
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showError('Silakan login terlebih dahulu.');
          return;
        }
        const res = await axios.get(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Profile response:', res.data);
        setUserData(res.data);
      } catch (error) {
        console.error('Error fetching profile:', error.response?.data || error.message);
        showError(error.response?.data?.message || 'Gagal memuat data profil.');
      }
    };
    fetchProfile();
  }, []);

  // Conditional render profile picture URL
  const profilePictureUrl = previewImage ||
    (userData.profilePicture ? `${API_URL}/${userData.profilePicture}` :
      'https://randomuser.me/api/portraits/men/32.jpg');

  return (
    <div className="min-h-screen bg-amber-50">
      <NavbarComponent />
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <Link to="/" className="text-blue-600 hover:underline">
            Kembali ke Beranda
          </Link>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-20 right-4 z-50">
            <Toast>
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
                <HiCheck className="h-5 w-5" />
              </div>
              <div className="ml-3 text-sm font-normal">{toastMessage}</div>
              <Toast.Toggle onDismiss={() => setShowSuccessToast(false)} />
            </Toast>
          </div>
        )}

        {/* Error Toast */}
        {showErrorToast && (
          <div className="fixed top-20 right-4 z-50">
            <Toast>
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
                <HiX className="h-5 w-5" />
              </div>
              <div className="ml-3 text-sm font-normal">{toastMessage}</div>
              <Toast.Toggle onDismiss={() => setShowErrorToast(false)} />
            </Toast>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="bg-white p-6 text-black">
            <div className="flex flex-col md:flex-row items-center">
              <div className="relative mb-4 md:mb-0 md:mr-6">
                <Avatar
                  img={profilePictureUrl}
                  rounded
                  size="xl"
                />
                {isEditing && (
                  <button
                    className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <HiOutlinePencilAlt className="h-5 w-5 text-amber-600" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </button>
                )}
              </div>
              <div>
                {isEditing ? (
                  <TextInput
                    name="full_name"
                    value={userData.full_name || ''}
                    onChange={handleInputChange}
                    className="text-2xl font-bold mb-1 bg-white/90 rounded"
                    placeholder="Full Name"
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{userData.full_name || userData.username}</h2>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Bergabung sejak:{' '}
                  {userData.joinedAt &&
                    new Date(userData.joinedAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                </p>

                {/* Show upload button if image is selected and in edit mode */}
                {profileImage && isEditing && (
                  <Button
                    color="success"
                    size="sm"
                    className="mt-2"
                    onClick={handleUploadProfilePicture}
                  >
                    Upload Foto
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - Fixed the style prop issue here */}
        <Tabs aria-label="Profile tabs">
          {/* Profile Tab */}
          <Tabs.Item
            active={activeTab === 0}
            title="Profile Info"
            icon={HiOutlineUser}
            onClick={() => setActiveTab(0)}
          >
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start">
                  <HiOutlineMail className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p className="text-gray-800">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <HiOutlinePhone className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Telepon</h4>
                    {isEditing ? (
                      <TextInput
                        name="phone"
                        value={userData.phone || ''}
                        onChange={handleInputChange}
                        className="bg-white/90 rounded"
                        placeholder="Nomor Telepon"
                      />
                    ) : (
                      <p className="text-gray-800">{userData.phone || '-'}</p>
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
                        value={userData.address || ''}
                        onChange={handleInputChange}
                        className="bg-white/90 rounded"
                        placeholder="Alamat"
                      />
                    ) : (
                      <p className="text-gray-800">{userData.address || '-'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start col-span-1 md:col-span-2">
                  <HiOutlineDocumentText className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                  <div className="w-full">
                    <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                    {isEditing ? (
                      <Textarea
                        name="bio"
                        value={userData.bio || ''}
                        onChange={handleInputChange}
                        className="bg-white/90 rounded w-full"
                        placeholder="Ceritakan tentang diri Anda"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-800">{userData.bio || 'Belum ada bio'}</p>
                    )}
                  </div>
                </div>
              </div>

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
                    <Button
                      color="blue"
                      onClick={() => setPasswordModalOpen(true)}
                    >
                      <HiOutlineLockClosed className="mr-2 h-5 w-5" />
                      Ganti Password
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Tabs.Item>

          {/* My Products Tab */}
          <Tabs.Item
            active={activeTab === 1}
            title="My Products"
            icon={HiOutlineShoppingBag}
            onClick={() => setActiveTab(1)}
          >
            <UserProductsTab />
          </Tabs.Item>
        </Tabs>
      </div>

      {/* Modal Change Password */}
      <Modal
        show={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      >
        <Modal.Header>
          Ganti Password
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            {passwordError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                {passwordSuccess}
              </div>
            )}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Password Saat Ini
              </label>
              <TextInput
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Masukkan password saat ini"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Password Baru
              </label>
              <TextInput
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Masukkan password baru"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password Baru
              </label>
              <TextInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Konfirmasi password baru"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            gradientDuoTone="amberToOrange"
            onClick={handleChangePassword}
          >
            Ubah Password
          </Button>
          <Button
            color="gray"
            onClick={() => setPasswordModalOpen(false)}
          >
            Batal
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ProfilePage;