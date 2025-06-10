// frontend/src/pages/ProfilePage.js - UPDATED with Supabase Profile Picture Handling
import React, { useState, useEffect, useRef } from 'react';
import { Button, Avatar, TextInput, Textarea, Modal } from 'flowbite-react';
import {
  HiOutlinePencilAlt,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineClipboardList,
  HiArrowRight
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import NavbarComponent from '../components/NavbarComponent';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslate } from '../utils/languageUtils';
import Footer from '../components/Footer';
import { getApiUrl, getImageUrl, getAuthHeaders } from '../config/api';

function ProfilePage() {
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

  // Language hooks
  const { language } = useLanguage();
  const translate = useTranslate(language);

  // State for change password modal
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // UPDATED: State for profile picture with better handling
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  // State for order stats
  const [orderStats, setOrderStats] = useState(null);

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

      console.log('Sending data:', {
        full_name: userData.full_name,
        username: userData.username,
        phone: userData.phone,
        address: userData.address,
        bio: userData.bio
      });

      const res = await axios.put(
        getApiUrl('api/users/profile'),
        {
          full_name: userData.full_name,
          username: userData.username,
          phone: userData.phone,
          address: userData.address,
          bio: userData.bio
        },
        {
          headers: getAuthHeaders(),
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
      alert('Profil berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error.message);
      alert('Gagal memperbarui profil: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handler for changing password
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword) {
      setPasswordError(translate('passwordChange.currentRequired'));
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordError(translate('passwordChange.newRequired'));
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(translate('passwordChange.noMatch'));
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError(translate('passwordChange.minLength'));
      return;
    }

    try {
      await axios.post(
        getApiUrl('api/users/change-password'),
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: getAuthHeaders()
        }
      );

      setPasswordSuccess(translate('passwordChange.success'));

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
      }, 2000);

    } catch (error) {
      console.error('Error changing password:', error.response?.data || error.message);
      setPasswordError(error.response?.data?.message || translate('passwordChange.failed'));
    }
  };

  // UPDATED: Handler for profile picture selection with better validation
  const handleProfilePictureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Reset previous states
      setUploadError('');
      setUploadSuccess('');

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Hanya file gambar yang diperbolehkan (JPG, PNG, GIF)');
        e.target.value = ''; // Reset file input
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Ukuran file maksimal 5MB');
        e.target.value = ''; // Reset file input
        return;
      }

      console.log('📷 Profile picture selected:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
      });

      setProfileImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setPreviewImage(reader.result.toString());
          console.log('✅ Preview image created');
        }
      };
      reader.onerror = () => {
        setUploadError('Gagal membaca file gambar');
        setProfileImage(null);
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  // UPDATED: Handler for profile picture upload with Supabase
  const handleUploadProfilePicture = async () => {
    if (!profileImage) {
      setUploadError('Pilih gambar terlebih dahulu');
      return;
    }

    setUploadingImage(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      console.log('📤 Uploading profile picture to Supabase...');

      const formData = new FormData();
      formData.append('profilePicture', profileImage);

      // Log FormData contents
      console.log('📦 FormData contents:', {
        fileName: profileImage.name,
        fileSize: profileImage.size,
        fileType: profileImage.type
      });

      const res = await axios.post(
        getApiUrl('api/users/profile-picture'),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          },
          timeout: 30000, // 30 second timeout for upload
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📊 Upload progress: ${percentCompleted}%`);
          }
        }
      );

      console.log('✅ Profile picture upload response:', res.data);

      if (res.data.success && res.data.profilePicture) {
        // Update user data with new profile picture URL
        setUserData(prev => ({
          ...prev,
          profilePicture: res.data.profilePicture
        }));

        // Reset states
        setProfileImage(null);
        setPreviewImage(null);
        setUploadSuccess('Foto profil berhasil diperbarui!');

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setUploadSuccess('');
        }, 3000);

      } else {
        throw new Error(res.data.message || 'Upload failed');
      }

    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);

      let errorMessage = 'Gagal mengupload foto profil';

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Coba lagi dengan file yang lebih kecil.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'File tidak valid';
      } else if (error.response?.status === 413) {
        errorMessage = 'File terlalu besar. Maksimal 5MB.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setUploadError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => {
        setUploadError('');
      }, 5000);

    } finally {
      setUploadingImage(false);
    }
  };

  // UPDATED: Cancel profile picture selection
  const handleCancelProfilePicture = () => {
    setProfileImage(null);
    setPreviewImage(null);
    setUploadError('');
    setUploadSuccess('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch order stats
  const fetchOrderStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(getApiUrl('api/orders/stats'), {
        headers: getAuthHeaders()
      });

      setOrderStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching order stats:', error);
      // Don't show error to user, just fail silently
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Silakan login terlebih dahulu.');
          return;
        }
        const res = await axios.get(getApiUrl('api/users/profile'), {
          headers: getAuthHeaders(),
        });
        console.log('Profile response:', res.data);
        setUserData(res.data);

        // Fetch order stats
        fetchOrderStats();
      } catch (error) {
        console.error('Error fetching profile:', error.response?.data || error.message);
        alert(error.response?.data?.message || 'Gagal memuat data profil.');
      }
    };
    fetchProfile();
  }, []);

  // UPDATED: Enhanced profile picture URL handling
  const getProfilePictureUrl = () => {
    // Priority order: preview (when selecting new image) > current profile picture > default
    if (previewImage) {
      return previewImage;
    }

    if (userData.profilePicture) {
      // Check if it's already a full URL (Supabase URL)
      if (userData.profilePicture.startsWith('http')) {
        return userData.profilePicture;
      }
      // If it's a relative path, construct full URL
      return getImageUrl(userData.profilePicture);
    }

    // Default avatar
    return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80';
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <NavbarComponent />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{translate('profile.profile')}</h1>
          <Link to="/" className="text-blue-600 hover:underline">
            {translate('profile.backToHome')}
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-white p-6 text-black">
            <div className="flex flex-col md:flex-row items-center">
              <div className="relative mb-4 md:mb-0 md:mr-6">
                <Avatar
                  img={getProfilePictureUrl()}
                  rounded
                  size="xl"
                />
                {isEditing && (
                  <button
                    className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    disabled={uploadingImage}
                  >
                    <HiOutlinePencilAlt className="h-5 w-5 text-amber-600" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      accept="image/*"
                      disabled={uploadingImage}
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
                    placeholder={translate('auth.fullName')}
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{userData.full_name || userData.username}</h2>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {translate('profile.joinedSince')}{' '}
                  {userData.joinedAt &&
                    new Date(userData.joinedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                </p>

                {/* UPDATED: Profile picture upload controls */}
                {isEditing && (
                  <div className="mt-3">
                    {/* Upload success message */}
                    {uploadSuccess && (
                      <div className="mb-2 p-2 bg-green-50 text-green-600 rounded text-sm">
                        {uploadSuccess}
                      </div>
                    )}

                    {/* Upload error message */}
                    {uploadError && (
                      <div className="mb-2 p-2 bg-red-50 text-red-600 rounded text-sm">
                        {uploadError}
                      </div>
                    )}

                    {/* Upload controls */}
                    {profileImage && (
                      <div className="flex space-x-2">
                        <Button
                          color="success"
                          size="sm"
                          onClick={handleUploadProfilePicture}
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? (
                            <>
                              <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Uploading...
                            </>
                          ) : (
                            'Upload Foto'
                          )}
                        </Button>
                        <Button
                          color="gray"
                          size="sm"
                          onClick={handleCancelProfilePicture}
                          disabled={uploadingImage}
                        >
                          Batal
                        </Button>
                      </div>
                    )}

                    {/* File size info */}
                    <p className="text-xs text-gray-500 mt-1">
                      Maksimal 5MB • Format: JPG, PNG, GIF
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Links - Updated dengan Order History */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-t border-b border-gray-100">
            <Link
              to="/my-products"
              className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <div className="p-2 bg-amber-100 rounded-lg">
                <HiOutlineShoppingBag className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="font-medium">{language === 'id' ? 'Produk Saya' : 'My Products'}</div>
                <p className="text-sm text-gray-500">{language === 'id' ? 'Kelola produk Anda' : 'Manage your products'}</p>
              </div>
              <HiArrowRight className="ml-auto text-amber-500" />
            </Link>

            <Link
              to="/wishlist"
              className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
            >
              <div className="p-2 bg-pink-100 rounded-lg">
                <HiOutlineHeart className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <div className="font-medium">{translate('common.myWishlist')}</div>
                <p className="text-sm text-gray-500">{language === 'id' ? 'Lihat wishlist Anda' : 'View your wishlist'}</p>
              </div>
              <HiArrowRight className="ml-auto text-pink-500" />
            </Link>

            <Link
              to="/order-history"
              className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <HiOutlineClipboardList className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="font-medium">{language === 'id' ? 'Riwayat Pesanan' : 'Order History'}</div>
                <p className="text-sm text-gray-500">
                  {orderStats ?
                    `${orderStats.totalOrders} ${language === 'id' ? 'pesanan' : 'orders'}` :
                    (language === 'id' ? 'Lihat pesanan Anda' : 'View your orders')
                  }
                </p>
              </div>
              <HiArrowRight className="ml-auto text-green-500" />
            </Link>

            <button
              onClick={() => setPasswordModalOpen(true)}
              className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <HiOutlineLockClosed className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">{translate('profile.changePassword')}</div>
                <p className="text-sm text-gray-500">{language === 'id' ? 'Perbarui password Anda' : 'Update your password'}</p>
              </div>
              <HiArrowRight className="ml-auto text-blue-500" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start">
                <HiOutlineMail className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{translate('auth.email')}</h4>
                  <p className="text-gray-800">{userData.email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <HiOutlinePhone className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{translate('profile.phone')}</h4>
                  {isEditing ? (
                    <TextInput
                      name="phone"
                      value={userData.phone || ''}
                      onChange={handleInputChange}
                      className="bg-white/90 rounded"
                      placeholder={translate('auth.phone')}
                    />
                  ) : (
                    <p className="text-gray-800">{userData.phone || '-'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <HiOutlineLocationMarker className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{translate('profile.address')}</h4>
                  {isEditing ? (
                    <TextInput
                      name="address"
                      value={userData.address || ''}
                      onChange={handleInputChange}
                      className="bg-white/90 rounded"
                      placeholder={translate('auth.address')}
                    />
                  ) : (
                    <p className="text-gray-800">{userData.address || '-'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start col-span-1 md:col-span-2">
                <HiOutlineDocumentText className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                <div className="w-full">
                  <h4 className="text-sm font-medium text-gray-500">{translate('profile.bio')}</h4>
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
                    <p className="text-gray-800">{userData.bio || translate('profile.noBio')}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {isEditing ? (
                <>
                  <Button gradientDuoTone="amberToOrange" onClick={handleSave}>
                    {translate('profile.saveChanges')}
                  </Button>
                  <Button color="light" onClick={() => setIsEditing(false)}>
                    {translate('profile.cancel')}
                  </Button>
                </>
              ) : (
                <>
                  <Button gradientDuoTone="amberToOrange" onClick={() => setIsEditing(true)}>
                    <HiOutlinePencilAlt className="mr-2 h-5 w-5" />
                    {translate('profile.editProfile')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Change Password */}
      <Modal
        show={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      >
        <Modal.Header>
          {translate('profile.changePassword')}
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
                {translate('profile.currentPassword')}
              </label>
              <TextInput
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder={translate('profile.enterCurrentPassword')}
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {translate('profile.newPassword')}
              </label>
              <TextInput
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder={translate('profile.enterNewPassword')}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {translate('profile.confirmNewPassword')}
              </label>
              <TextInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder={translate('profile.confirmNewPasswordPlaceholder')}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            gradientDuoTone="amberToOrange"
            onClick={handleChangePassword}
          >
            {translate('profile.changePassword')}
          </Button>
          <Button
            color="gray"
            onClick={() => setPasswordModalOpen(false)}
          >
            {translate('profile.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </div>
  );
}

export default ProfilePage;