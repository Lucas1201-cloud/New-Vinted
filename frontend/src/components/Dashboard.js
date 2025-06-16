import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ onAddItemClick, onBulkOperationsClick }) => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showROIModal, setShowROIModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await axios.get(`${API}/dashboard/stats`);
      setStats(statsResponse.data);
      
      // Fetch market trends
      const trendsResponse = await axios.get(`${API}/analytics/trends`);
      setTrends(trendsResponse.data);
      
      // Fetch notifications
      const notificationsResponse = await axios.get(`${API}/notifications?unread_only=true`);
      setNotifications(notificationsResponse.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = () => {
    window.location.href = '/analytics';
  };

  const handleSetROITarget = () => {
    setShowROIModal(true);
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API}/items/export/csv`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'vinted_items.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const StatCard = ({ title, value, subtitle, icon, color = "blue" }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const TrendAlert = ({ brand, trend_percentage, message }) => (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-3">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-semibold text-green-800">
            {brand} is trending up +{trend_percentage}%
          </p>
          <p className="text-sm text-green-700">{message}</p>
        </div>
      </div>
    </div>
  );

  const NotificationItem = ({ notification }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            {notification.type === 'profit_alert' && <span className="text-blue-600">⚠️</span>}
            {notification.type === 'milestone' && <span className="text-green-600">🎉</span>}
            {notification.type === 'restock' && <span className="text-orange-600">📦</span>}
            {notification.type === 'listing_renewal' && <span className="text-purple-600">🔄</span>}
          </div>
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(notification.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vinted Tracker Dashboard</h1>
              <p className="text-sm text-gray-600">AI-Powered Sales Intelligence</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => onAddItemClick && onAddItemClick()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Item
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Items"
            value={stats?.total_items || 0}
            subtitle={`${stats?.active_listings || 0} active listings`}
            icon="📦"
            color="blue"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.total_revenue || 0)}
            subtitle={`${stats?.sold_items || 0} items sold`}
            icon="💰"
            color="green"
          />
          <StatCard
            title="Total Profit"
            value={formatCurrency(stats?.total_profit || 0)}
            subtitle={`${stats?.average_roi?.toFixed(1) || 0}% average ROI`}
            icon="📈"
            color="emerald"
          />
          <StatCard
            title="This Month"
            value={formatCurrency(stats?.monthly_profit || 0)}
            subtitle={`${stats?.monthly_sales_count || 0} sales`}
            icon="📅"
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market Trends */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Intelligence</h2>
              {trends.length > 0 ? (
                <div>
                  {trends.map((trend, index) => (
                    <TrendAlert key={index} {...trend} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No trending data available</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleViewAnalytics}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl">📊</span>
                    <p className="text-sm font-medium text-gray-600 mt-2">View Analytics</p>
                  </div>
                </button>
                <button 
                  onClick={() => onBulkOperationsClick && onBulkOperationsClick()}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl">📋</span>
                    <p className="text-sm font-medium text-gray-600 mt-2">Bulk Upload</p>
                  </div>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                  <div className="text-center">
                    <span className="text-2xl">🎯</span>
                    <p className="text-sm font-medium text-gray-600 mt-2">Set ROI Target</p>
                  </div>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
                  <div className="text-center">
                    <span className="text-2xl">📤</span>
                    <p className="text-sm font-medium text-gray-600 mt-2">Export CSV</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Sidebar */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                {notifications.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No new notifications</p>
                )}
              </div>
            </div>

            {/* Performance Alerts */}
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Alerts</h2>
              {stats?.items_needing_renewal > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium text-yellow-800">
                    🔄 {stats.items_needing_renewal} items need renewal
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">Consider refreshing old listings</p>
                </div>
              )}
              {stats?.low_performing_items > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium text-red-800">
                    ⚠️ {stats.low_performing_items} low-performing items
                  </p>
                  <p className="text-xs text-red-700 mt-1">Items with low engagement</p>
                </div>
              )}
              {stats?.items_needing_renewal === 0 && stats?.low_performing_items === 0 && (
                <p className="text-gray-500 text-center py-4">All items performing well! 🎉</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;