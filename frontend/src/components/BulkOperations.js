import React, { useState, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BulkOperations = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadData, setUploadData] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadData(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const item = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Map CSV headers to our API fields
        switch (header.toLowerCase()) {
          case 'title':
          case 'name':
            item.title = value;
            break;
          case 'brand':
            item.brand = value;
            break;
          case 'category':
            item.category = value;
            break;
          case 'size':
            item.size = value;
            break;
          case 'color':
          case 'colour':
            item.color = value;
            break;
          case 'condition':
            item.condition = value;
            break;
          case 'purchase price':
          case 'purchase_price':
          case 'cost':
            item.purchase_price = parseFloat(value) || 0;
            break;
          case 'listed price':
          case 'listed_price':
          case 'price':
            item.listed_price = parseFloat(value) || 0;
            break;
          case 'description':
            item.description = value;
            break;
          case 'tags':
            item.tags = value.split(';').map(tag => tag.trim()).filter(tag => tag);
            break;
          default:
            break;
        }
      });
      
      return item;
    }).filter(item => item.title && item.brand && item.category);
  };

  const handleBulkUpload = async () => {
    if (!uploadData.trim()) {
      alert('Please provide CSV data to upload');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const items = parseCSV(uploadData);
      
      if (items.length === 0) {
        alert('No valid items found in CSV data. Please check the format.');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API}/items/bulk-upload`, {
        items: items
      });

      setResults({
        success: true,
        message: response.data.message,
        count: items.length
      });

      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('Error uploading items:', error);
      setResults({
        success: false,
        message: 'Failed to upload items. Please check your data format.',
        error: error.response?.data?.detail || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/items/export/csv`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vinted_items_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setResults({
        success: true,
        message: 'CSV export completed successfully'
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setResults({
        success: false,
        message: 'Failed to export CSV file'
      });
    } finally {
      setLoading(false);
    }
  };

  const sampleCSV = `title,brand,category,condition,purchase_price,listed_price,description,tags
"Vintage Stone Island Jacket","Stone Island","Outerwear","Good",85.00,150.00,"Rare vintage piece in excellent condition","vintage;designer;jacket"
"Nike Air Max 90","Nike","Shoes","Like new",45.00,80.00,"Classic white and grey colorway","sneakers;nike;retro"
"Zara Wool Coat","Zara","Outerwear","Very good",25.00,55.00,"Warm winter coat, size M","coat;winter;wool"`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Bulk Operations</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📤 Upload Items
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'export'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📥 Export Data
              </button>
              <button
                onClick={() => setActiveTab('template')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'template'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 CSV Template
              </button>
            </nav>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Items via CSV</h3>
                <p className="text-gray-600 mb-4">
                  Upload multiple items at once using CSV format. Supported fields: title, brand, category, 
                  condition, purchase_price, listed_price, description, tags.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-4"
                    >
                      Choose CSV File
                    </button>
                    <p className="text-sm text-gray-500">or paste CSV data below</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSV Data
                  </label>
                  <textarea
                    value={uploadData}
                    onChange={(e) => setUploadData(e.target.value)}
                    rows={10}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Paste your CSV data here or use the file upload above..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setUploadData(sampleCSV)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Load Sample Data
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={loading || !uploadData.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Uploading...' : 'Upload Items'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
                <p className="text-gray-600 mb-6">
                  Export all your items to CSV format for backup, analysis, or migration to other platforms.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Export Your Vinted Data</h4>
                  <p className="text-gray-600 mb-6">
                    Download a comprehensive CSV file containing all your items, pricing, and performance data.
                  </p>
                  
                  <button
                    onClick={handleExportCSV}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Exporting...' : 'Download CSV Export'}
                  </button>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Export includes:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Item details (title, brand, category, condition)</li>
                    <li>• Pricing information (purchase, listed, sold prices)</li>
                    <li>• Performance metrics (views, likes, engagement)</li>
                    <li>• Financial data (profit, ROI calculations)</li>
                    <li>• Timestamps (created, listed, sold dates)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Template Tab */}
          {activeTab === 'template' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">CSV Template & Format</h3>
                <p className="text-gray-600 mb-6">
                  Use this template to prepare your CSV file for bulk upload. All fields except title, brand, 
                  and category are optional.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Required Fields:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      <span className="font-medium">title</span> - Item name
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      <span className="font-medium">brand</span> - Brand name
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      <span className="font-medium">category</span> - Item category
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Optional Fields:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">condition</div>
                      <div className="text-gray-600">New with tags, Like new, Good, Fair, Poor</div>
                    </div>
                    <div>
                      <div className="font-medium">purchase_price</div>
                      <div className="text-gray-600">What you paid for the item</div>
                    </div>
                    <div>
                      <div className="font-medium">listed_price</div>
                      <div className="text-gray-600">Your selling price</div>
                    </div>
                    <div>
                      <div className="font-medium">size</div>
                      <div className="text-gray-600">Item size (XS, S, M, L, etc.)</div>
                    </div>
                    <div>
                      <div className="font-medium">color</div>
                      <div className="text-gray-600">Primary color</div>
                    </div>
                    <div>
                      <div className="font-medium">description</div>
                      <div className="text-gray-600">Item description</div>
                    </div>
                    <div>
                      <div className="font-medium">tags</div>
                      <div className="text-gray-600">Semicolon-separated tags</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Sample CSV Template:</h4>
                  <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre>{sampleCSV}</pre>
                  </div>
                  
                  <button
                    onClick={() => {
                      const blob = new Blob([sampleCSV], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', 'vinted_template.csv');
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    }}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Download Template CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className={`mt-6 p-4 rounded-lg ${
              results.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                <span className={`text-2xl mr-3 ${
                  results.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {results.success ? '✅' : '❌'}
                </span>
                <div>
                  <h4 className={`font-semibold ${
                    results.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {results.success ? 'Success!' : 'Error'}
                  </h4>
                  <p className={`${
                    results.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {results.message}
                  </p>
                  {results.error && (
                    <p className="text-red-600 text-sm mt-1">
                      {results.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;