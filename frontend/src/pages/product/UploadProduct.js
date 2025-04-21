import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavbarComponent from '../../components/NavbarComponent';

export default function ProductUpload() {
  // Hooks
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [formProgress, setFormProgress] = useState(0);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    condition: 'new',
    tipe: '',
    description: '',
    images: []
  });

  // Categories untuk dropdown
  const categories = [
    'Men Fashion', 'Women Fashion', 'Automotive', 'Gadget',
    'Decoration', 'Sports', 'Health and Beauty', ''
  ];

  // Calculate form progress
  useEffect(() => {
    const requiredFields = ['name', 'price', 'category', 'tipe', 'description'];
    const filledFields = requiredFields.filter(field => formData[field] !== '');
    const imageProgress = formData.images.length > 0 ? 1 : 0;
    const progress = Math.round(((filledFields.length + imageProgress) / (requiredFields.length + 1)) * 100);
    setFormProgress(progress);
  }, [formData]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'price' && value !== '' && !/^\d+$/.test(value)) return;

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 5) {
      setError('Maksimum 5 gambar yang diperbolehkan');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newImagePreviews = [...imagePreviews];
    const newImages = [...formData.images];

    files.forEach(file => {
      if (!file.type.match('image.*')) {
        setError('Harap upload file gambar saja (JPG, PNG, atau GIF)');
        setTimeout(() => setError(null), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          newImagePreviews.push(e.target.result.toString());
          setImagePreviews([...newImagePreviews]);
        }
      };
      reader.readAsDataURL(file);
      newImages.push(file);
    });

    setFormData(prev => ({ ...prev, images: newImages }));
    if (e.target) e.target.value = '';
  };

  const removeImage = (index) => {
    if (index < 0 || index >= imagePreviews.length) return;

    const newImagePreviews = [...imagePreviews];
    newImagePreviews.splice(index, 1);

    const newImages = [...formData.images];
    newImages.splice(index, 1);

    setImagePreviews(newImagePreviews);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const reorderImages = (fromIndex, toIndex) => {
    if (fromIndex < 0 || fromIndex >= imagePreviews.length ||
      toIndex < 0 || toIndex >= imagePreviews.length) return;

    const newImagePreviews = [...imagePreviews];
    const [movedPreview] = newImagePreviews.splice(fromIndex, 1);
    newImagePreviews.splice(toIndex, 0, movedPreview);
    setImagePreviews(newImagePreviews);

    const newImages = [...formData.images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const moveImageLeft = index => (index > 0) && reorderImages(index, index - 1);
  const moveImageRight = index => (index < imagePreviews.length - 1) && reorderImages(index, index + 1);

  // Drag & Drop handlers
  const handleDragStart = (e, index) => {
    if (e.dataTransfer) {
      setDraggedImageIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      const dragGhost = document.createElement('div');
      dragGhost.style.position = 'absolute';
      dragGhost.style.top = '-1000px';
      document.body.appendChild(dragGhost);
      e.dataTransfer.setDragImage(dragGhost, 0, 0);
      setTimeout(() => dragGhost.parentNode && dragGhost.parentNode.removeChild(dragGhost), 0);
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === index) return;
    e.currentTarget?.classList.add('bg-amber-50', 'border-amber-300');
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.currentTarget?.classList.remove('bg-amber-50', 'border-amber-300');
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    e.currentTarget?.classList.remove('bg-amber-50', 'border-amber-300');
    if (draggedImageIndex !== null && draggedImageIndex !== index) {
      reorderImages(draggedImageIndex, index);
      setDraggedImageIndex(null);
    }
  };

  // Form validation and navigation
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nama produk harus diisi'); return false;
    }
    if (!formData.price) {
      setError('Harga produk harus diisi'); return false;
    }
    if (!formData.category) {
      setError('Kategori produk harus dipilih'); return false;
    }
    if (!formData.tipe) {
      setError('Tipe produk harus diisi'); return false;
    }
    if (!formData.description.trim()) {
      setError('Deskripsi produk harus diisi'); return false;
    }
    if (formData.images.length === 0) {
      setError('Upload minimal 1 gambar produk'); return false;
    }
    return true;
  };

  const nextStep = () => {
    if (activeStep === 1 && formData.images.length === 0) {
      setError('Upload minimal 1 gambar produk');
      setTimeout(() => setError(null), 3000);
      return;
    } else if (activeStep === 2 && (!formData.name || !formData.price || !formData.category || !formData.tipe)) {
      setError('Mohon lengkapi semua field yang wajib diisi');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Submit form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('name', formData.name);
      uploadData.append('price', formData.price);
      uploadData.append('category', formData.category);
      uploadData.append('condition', formData.condition);
      uploadData.append('tipe', formData.tipe);
      uploadData.append('description', formData.description);

      formData.images.forEach(image => uploadData.append('images', image));

      const response = await axios.post('http://localhost:5000/api/products', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
      setTimeout(() => navigate(`/product/${response.data._id}`), 2000);

    } catch (err) {
      console.error('Error uploading product:', err);
      setError(err.response?.data?.message || 'Gagal mengunggah produk. Silakan coba lagi.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Helper function untuk kondisional rendering
  const showField = step => activeStep === step ? 'block' : 'hidden';

  return (
    <div className="min-h-screen bg-white text-gray-800 relative">
      <NavbarComponent />
      <div className="bg-[#FFF5E4] min-h-screen pt-6 pb-12 px-4 sm:px-6">
        <div className="w-full max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Upload Progress: {formProgress}%</p>
              <span className="text-xs text-amber-600 font-medium">{formProgress === 100 ? 'Lengkap' : 'Belum Lengkap'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${formProgress}%` }}></div>
            </div>
          </div>

          {/* Navigation Steps */}
          <div className="flex items-center justify-between mb-6 bg-white p-1 rounded-xl shadow-md">
            <button
              onClick={() => setActiveStep(1)}
              className={`flex-1 py-3 text-center rounded-lg transition-all ${activeStep === 1 ? 'bg-amber-500 text-white font-medium' : 'text-amber-500 hover:bg-amber-50'}`}
              type="button"
            >
              <span className="hidden sm:inline">1. Foto</span>
              <span className="sm:hidden">1. Foto</span>
            </button>
            <button
              onClick={() => formData.images.length > 0 ? setActiveStep(2) : null}
              disabled={formData.images.length === 0}
              className={`flex-1 py-3 text-center rounded-lg transition-all ${activeStep === 2 ? 'bg-amber-500 text-white font-medium' : 'text-amber-500 hover:bg-amber-50'}`}
              type="button"
            >
              <span className="hidden sm:inline">2. Detail</span>
              <span className="sm:hidden">2. Detail</span>
            </button>
            <button
              onClick={() => {
                if (formData.images.length > 0 && formData.name && formData.price) setActiveStep(3);
              }}
              disabled={!(formData.images.length > 0 && formData.name && formData.price)}
              className={`flex-1 py-3 text-center rounded-lg transition-all ${activeStep === 3 ? 'bg-amber-500 text-white font-medium' : 'text-amber-500 hover:bg-amber-50'}`}
              type="button"
            >
              <span className="hidden sm:inline">3. Submit</span>
              <span className="sm:hidden">3. Submit</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Success message */}
            {success && (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Produk Berhasil Diunggah!</h2>
                <p className="text-gray-600 mb-6">Terima kasih telah berkontribusi pada gaya hidup zero waste.</p>
                <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5 mb-6">
                  <div className="bg-amber-500 h-1.5 rounded-full animate-pulse"></div>
                </div>
                <button onClick={() => navigate('/product-list')} className="text-amber-500 hover:text-amber-600 font-medium" type="button">
                  Lihat Daftar Produk
                </button>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                {/* Error message - floating notification */}
                {error && (
                  <div className="fixed top-24 right-4 z-50 max-w-md bg-white border-l-4 border-red-500 shadow-lg rounded-lg overflow-hidden animate-pulse">
                    <div className="p-4 flex">
                      <div className="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                      </div>
                      <button onClick={() => setError(null)} className="ml-auto text-gray-400 hover:text-gray-500" type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 1: Image Upload */}
                <div className={showField(1)}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Upload Foto Produk</h2>
                    <p className="text-gray-600">Foto yang bagus sangat mempengaruhi ketertarikan pembeli.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-amber-200 rounded-lg p-6 bg-amber-50">
                      {!imagePreviews.length ? (
                        <div
                          className="cursor-pointer flex flex-col items-center py-8"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        >
                          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-700 mb-2">Unggah foto produk Anda</h3>
                          <p className="text-gray-500 mb-4 max-w-md text-center">
                            Tambahkan hingga 5 foto untuk menampilkan produk Anda dari berbagai sudut
                          </p>
                          <button
                            type="button"
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg"
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          >
                            Pilih Foto
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-4">Foto Produk</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                            {imagePreviews.map((preview, index) => (
                              <div
                                key={index}
                                className={`relative group border-2 rounded-lg overflow-hidden transition-all ${index === 0 ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200 hover:border-amber-300'}`}
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={() => setDraggedImageIndex(null)}
                              >
                                <div className="aspect-square">
                                  <img src={preview} alt={`Foto produk ${index + 1}`} className="w-full h-full object-cover" />
                                </div>
                                {index === 0 && (
                                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-md font-medium">
                                    Utama
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => moveImageLeft(index)}
                                      disabled={index === 0}
                                      className={`p-1 rounded-full bg-white text-gray-800 ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveImageRight(index)}
                                      disabled={index === imagePreviews.length - 1}
                                      className={`p-1 rounded-full bg-white text-gray-800 ${index === imagePreviews.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      className="p-1 rounded-full bg-white text-red-500 hover:bg-red-50"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Add more button */}
                            {imagePreviews.length < 5 && (
                              <div
                                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span className="text-sm text-gray-500">Tambah Foto</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center p-4 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm">
                              <span className="font-medium">Tips:</span> Foto pertama akan menjadi foto utama produk.
                            </p>
                          </div>
                        </div>
                      )}

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                    </div>

                    <div className="border-t border-gray-200 pt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={formData.images.length === 0}
                        className={`px-6 py-3 bg-amber-500 rounded-lg text-white font-medium flex items-center ${formData.images.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-600 transition-all shadow hover:shadow-md'}`}
                      >
                        Lanjutkan
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2: Basic Product Info */}
                <div className={showField(2)}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Detail Produk</h2>
                    <p className="text-gray-600">Tambahkan informasi dasar tentang produk zero waste Anda.</p>
                  </div>

                  <div className="space-y-6">
                    {imagePreviews.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                            <img src={imagePreviews[0]} alt="Foto Utama" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm">Foto Utama Produk</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                      {/* Nama Produk */}
                      <div className="form-group">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Produk <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Contoh: Botol Minum Bambu Eco-Friendly"
                          maxLength={100}
                        />
                      </div>

                      {/* Harga */}
                      <div className="form-group">
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                          Harga (Rp) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <span className="text-gray-500">Rp</span>
                          </div>
                          <input
                            type="text"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                            placeholder="Contoh: 50000"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Kategori */}
                        <div className="form-group">
                          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            Kategori <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 bg-white"
                          >
                            <option value="" disabled>Pilih kategori</option>
                            {categories.map((category) => (
                              <option key={category} value={category.toLowerCase()}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Tipe */}
                        <div className="form-group">
                          <label htmlFor="tipe" className="block text-sm font-medium text-gray-700 mb-1">
                            Tipe Produk <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="tipe"
                            name="tipe"
                            value={formData.tipe}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                            placeholder="Contoh: Botol, Sedotan, Tas"
                          />
                        </div>
                      </div>

                      {/* Kondisi */}
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Kondisi <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <label className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer ${formData.condition === 'new' ? 'bg-amber-50 border-amber-300' : 'border-gray-200'}`}>
                            <input
                              type="radio"
                              name="condition"
                              value="new"
                              checked={formData.condition === 'new'}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div className="text-center">
                              <div className="w-12 h-12 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="font-medium text-gray-700">Baru</span>
                            </div>
                          </label>

                          <label className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer ${formData.condition === 'used' ? 'bg-amber-50 border-amber-300' : 'border-gray-200'}`}>
                            <input
                              type="radio"
                              name="condition"
                              value="used"
                              checked={formData.condition === 'used'}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div className="text-center">
                              <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="font-medium text-gray-700">Bekas</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={!formData.name || !formData.price || !formData.category || !formData.tipe}
                        className={`px-6 py-3 bg-amber-500 rounded-lg text-white font-medium flex items-center ${!formData.name || !formData.price || !formData.category || !formData.tipe ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-600'}`}
                      >
                        Lanjutkan
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 3: Deskripsi & Submit */}
                <div className={showField(3)}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Deskripsi & Finalisasi</h2>
                    <p className="text-gray-600">Tambahkan deskripsi detail dan tinjau produk Anda.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Deskripsi */}
                    <div className="form-group">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Deskripsi Produk <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Deskripsikan produk Anda secara detail, termasuk bahan, ukuran, manfaat, dan cara penggunaan."
                        maxLength={1000}
                      />
                      <div className="mt-1 flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          {formData.description.length}/1000 karakter
                        </p>
                      </div>
                    </div>

                    {/* Pratinjau Produk */}
                    {imagePreviews.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pratinjau Produk</h3>

                        <div className="flex flex-col md:flex-row md:space-x-6">
                          <div className="w-full md:w-1/3 mb-4 md:mb-0">
                            <div className="aspect-square rounded-lg overflow-hidden">
                              <img src={imagePreviews[0]} alt="Foto Utama" className="w-full h-full object-cover" />
                            </div>
                            {imagePreviews.length > 1 && (
                              <div className="flex mt-2 space-x-2 overflow-x-auto">
                                {imagePreviews.slice(1).map((preview, index) => (
                                  <div key={index} className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                                    <img src={preview} alt={`Preview ${index + 2}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="w-full md:w-2/3">
                            <h4 className="text-xl font-semibold text-gray-800">{formData.name || "Nama Produk"}</h4>
                            <div className="text-lg font-bold text-amber-600 mt-1">
                              Rp {formData.price ? Number(formData.price).toLocaleString('id-ID') : "0"}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="bg-white p-3 rounded-md border border-gray-200">
                                <div className="text-sm text-gray-500">Kategori</div>
                                <div className="font-medium capitalize">
                                  {formData.category || "Belum ditentukan"}
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-md border border-gray-200">
                                <div className="text-sm text-gray-500">Kondisi</div>
                                <div className="font-medium">
                                  {formData.condition === 'used' ? 'Bekas' : 'Baru'}
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-md border border-gray-200">
                                <div className="text-sm text-gray-500">Tipe</div>
                                <div className="font-medium">
                                  {formData.tipe || "Belum ditentukan"}
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-md border border-gray-200">
                                <div className="text-sm text-gray-500">Foto</div>
                                <div className="font-medium">
                                  {imagePreviews.length} foto
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-6 flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !formData.description}
                        className={`px-8 py-3 bg-amber-500 rounded-lg text-white font-medium flex items-center ${loading || !formData.description ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-600'}`}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Mengunggah...
                          </span>
                        ) : 'Upload Produk'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Footer Note */}
            {!success && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-center text-sm text-gray-500">
                Dengan mengupload produk, Anda menyetujui persyaratan layanan dan kebijakan privasi kami.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}