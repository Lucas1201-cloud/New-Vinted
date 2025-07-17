import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PhotoManager from './PhotoManager';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddItemForm = ({ isOpen, onClose, onItemAdded, editingItem = null }) => {
  const getInitialFormData = () => ({
    title: editingItem?.title || '',
    description: editingItem?.description || '',
    category: editingItem?.category || '',
    brand: editingItem?.brand || '',
    size: editingItem?.size || '',
    color: editingItem?.color || '',
    condition: editingItem?.condition || '',
    purchase_price: editingItem?.purchase_price || 0,
    listed_price: editingItem?.listed_price || 0,
    sold_price: editingItem?.sold_price || '',
    shipping_cost: editingItem?.shipping_cost || 0,
    vinted_fee: editingItem?.vinted_fee || 0,
    buyer_protection_fee: editingItem?.buyer_protection_fee || 0,
    views: editingItem?.views || 0,
    likes: editingItem?.likes || 0,
    watchers: editingItem?.watchers || 0,
    messages: editingItem?.messages || 0,
    status: editingItem?.status || 'draft',
    photos: editingItem?.photos?.map((base64, index) => ({
      id: index,
      base64: base64,
      name: `Photo ${index + 1}`,
      isMain: index === 0
    })) || [],
    tags: editingItem?.tags ? editingItem.tags.join(', ') : ''
  });

  const [formData, setFormData] = useState(getInitialFormData);
  const [loading, setLoading] = useState(false);

  // Update form data when editingItem changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [editingItem]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePhotosChange = (photos) => {
    const photoBase64Array = photos.map(p => p.base64);
    const mainPhoto = photos.find(p => p.isMain)?.base64 || photoBase64Array[0];
    
    setFormData(prev => ({
      ...prev,
      photos: photoBase64Array,
      main_photo: mainPhoto
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      // Debug: Log the data being sent
      console.log('Submitting data:', submitData);
      console.log('Edit mode:', !!editingItem);
      console.log('Item ID:', editingItem?.id);

      if (editingItem) {
        const response = await axios.put(`${API}/items/${editingItem.id}`, submitData);
        console.log('PUT response:', response.data);
      } else {
        const response = await axios.post(`${API}/items`, submitData);
        console.log('POST response:', response.data);
      }

      onItemAdded();
      onClose();
      
      // Reset form
      setFormData({
        title: '', description: '', category: '', brand: '', size: '', color: '',
        condition: '', purchase_price: 0, listed_price: 0, sold_price: '',
        shipping_cost: 0, vinted_fee: 0, buyer_protection_fee: 0,
        views: 0, likes: 0, watchers: 0, messages: 0, status: 'draft',
        photos: [], tags: ''
      });
    } catch (error) {
      console.error('Error saving item:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert('Failed to save item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Item title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Item description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brand name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      <option value="Women's Clothing">Women's Clothing</option>
                      <option value="Men's Clothing">Men's Clothing</option>
                      <option value="Shoes">Shoes</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Bags">Bags</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Home & Garden">Home & Garden</option>
                      <option value="Electronics">Electronics</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Size"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Color"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Condition *</label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select condition</option>
                      <option value="New with tags">New with tags</option>
                      <option value="New without tags">New without tags</option>
                      <option value="Very good">Very good</option>
                      <option value="Good">Good</option>
                      <option value="Satisfactory">Satisfactory</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>

              {/* Pricing and Performance */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Pricing & Performance</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price</label>
                    <input
                      type="number"
                      name="purchase_price"
                      value={formData.purchase_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Listed Price *</label>
                    <input
                      type="number"
                      name="listed_price"
                      value={formData.listed_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {editingItem && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sold Price</label>
                        <input
                          type="number"
                          name="sold_price"
                          value={formData.sold_price}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="sold">Sold</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Cost</label>
                        <input
                          type="number"
                          name="shipping_cost"
                          value={formData.shipping_cost}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vinted Fee</label>
                        <input
                          type="number"
                          name="vinted_fee"
                          value={formData.vinted_fee}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Protection Fee</label>
                        <input
                          type="number"
                          name="buyer_protection_fee"
                          value={formData.buyer_protection_fee}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Views</label>
                        <input
                          type="number"
                          name="views"
                          value={formData.views}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Likes</label>
                        <input
                          type="number"
                          name="likes"
                          value={formData.likes}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Watchers</label>
                        <input
                          type="number"
                          name="watchers"
                          value={formData.watchers}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Messages</label>
                        <input
                          type="number"
                          name="messages"
                          value={formData.messages}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Photo Management */}
                <PhotoManager
                  photos={formData.photos}
                  onPhotosChange={handlePhotosChange}
                  maxPhotos={8}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddItemForm;