import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, profit_alert, milestone, restock
  const [roiTarget, setRoiTarget] = useState(null);

  useEffect(() => {
    fetchNotifications();
    fetchROITarget();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const unreadOnly = filter === 'unread';
      const response = await axios.get(`${API}/notifications?unread_only=${unreadOnly}`);
      let filteredNotifications = response.data;
      
      if (filter !== 'all' && filter !== 'unread') {
        filteredNotifications = response.data.filter(n => n.type === filter);
      }
      
      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchROITarget = async () => {
    try {
      const response = await axios.get(`${API}/roi-targets/current`);
      setRoiTarget(response.data);
    } catch (error) {
      console.error('Error fetching ROI target:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const triggerRenewalCheck = async () => {
    try {
      const response = await axios.post(`${API}/tasks/check-renewals`);
      alert(response.data.message);
      fetchNotifications();
    } catch (error) {
      console.error('Error triggering renewal check:', error);
    }
  };

  const triggerROICheck = async () => {
    try {
      const response = await axios.post(`${API}/tasks/check-roi-alerts`);
      alert(response.data.message);
      fetchNotifications();
    } catch (error) {
      console.error('Error triggering ROI check:', error);
    }
  };

  const updateROITarget = async (newTarget) => {
    try {
      const response = await axios.post(`${API}/roi-targets`, {
        target_percentage: newTarget,
        is_active: true
      });
      setRoiTarget(response.data);
      alert(`ROI target updated to ${newTarget}%`);
    } catch (error) {
      console.error('Error updating ROI target:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'profit_alert': return '⚠️';
      case 'milestone': return '🎉';
      case 'restock': return '📦';
      case 'listing_renewal': return '🔄';
      case 'market_trend': return '📈';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'profit_alert': return 'border-red-200 bg-red-50';
      case 'milestone': return 'border-green-200 bg-green-50';
      case 'restock': return 'border-orange-200 bg-orange-50';
      case 'listing_renewal': return 'border-purple-200 bg-purple-50';
      case 'market_trend': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const NotificationCard = ({ notification }) => (
    <div className={`border rounded-lg p-4 mb-3 transition-all hover:shadow-md ${
      notification.read ? 'bg-white border-gray-200' : getNotificationColor(notification.type)
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              notification.read ? 'bg-gray-100' : 'bg-white'
            }`}>
              <span className="text-lg">{getNotificationIcon(notification.type)}</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
              {notification.title}
            </h3>
            <p className={`mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
              {notification.message}
            </p>
            <div className="flex items-center mt-2 space-x-4">
              <span className="text-xs text-gray-400">
                {new Date(notification.created_at).toLocaleString()}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                notification.read 
                  ? 'bg-gray-100 text-gray-600' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {notification.type.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        {!notification.read && (
          <button
            onClick={() => markAsRead(notification.id)}
            className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Mark Read
          </button>
        )}
      </div>
    </div>
  );

  const QuickAction = ({ title, description, buttonText, onClick, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <button
        onClick={onClick}
        className={`mt-3 px-4 py-2 bg-${color}-600 text-white rounded-md hover:bg-${color}-700 transition-colors text-sm`}
      >
        {buttonText}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Smart Notifications</h1>
              <p className="text-sm text-gray-600">Performance alerts & business intelligence</p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Mark All Read
              </button>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters & Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Notifications</h2>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Notifications', icon: '📋' },
                  { value: 'unread', label: 'Unread Only', icon: '🔵' },
                  { value: 'profit_alert', label: 'Profit Alerts', icon: '⚠️' },
                  { value: 'milestone', label: 'Milestones', icon: '🎉' },
                  { value: 'listing_renewal', label: 'Renewal Reminders', icon: '🔄' },
                  { value: 'restock', label: 'Restock Suggestions', icon: '📦' }
                ].map((filterOption) => (
                  <button
                    key={filterOption.value}
                    onClick={() => setFilter(filterOption.value)}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center ${
                      filter === filterOption.value
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{filterOption.icon}</span>
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ROI Target Management */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ROI Target</h2>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {roiTarget?.target_percentage || 30}%
                </div>
                <p className="text-sm text-gray-600 mb-4">Current target</p>
                <div className="space-y-2">
                  {[20, 30, 40, 50].map(target => (
                    <button
                      key={target}
                      onClick={() => updateROITarget(target)}
                      className={`w-full p-2 text-sm rounded ${
                        roiTarget?.target_percentage === target
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {target}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <QuickAction
                title="Check Renewals"
                description="Scan for items needing listing renewal"
                buttonText="Run Check"
                onClick={triggerRenewalCheck}
                color="purple"
              />
              
              <QuickAction
                title="ROI Analysis"
                description="Analyze items below target ROI"
                buttonText="Analyze"
                onClick={triggerROICheck}
                color="orange"
              />
            </div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Notifications
                  {filter !== 'all' && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({filter.replace('_', ' ')})
                    </span>
                  )}
                </h2>
                <span className="text-sm text-gray-500">
                  {notifications.length} notifications
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {notifications.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">🔔</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                  <p className="text-gray-500">
                    {filter === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : "No notifications match your current filter."}
                  </p>
                </div>
              )}
            </div>

            {/* Sample Notifications for Demo */}
            {notifications.length === 0 && !loading && (
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Notifications</h3>
                <div className="space-y-3">
                  <NotificationCard notification={{
                    id: 'sample-1',
                    type: 'profit_alert',
                    title: 'Low ROI Alert',
                    message: 'Stone Island jacket sold with 15% ROI (target: 30%)',
                    created_at: new Date().toISOString(),
                    read: false
                  }} />
                  
                  <NotificationCard notification={{
                    id: 'sample-2',
                    type: 'milestone',
                    title: 'Monthly Target Achieved!',
                    message: 'Congratulations! You\'ve reached your £1,200 monthly target',
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    read: false
                  }} />
                  
                  <NotificationCard notification={{
                    id: 'sample-3',
                    type: 'listing_renewal',
                    title: 'Renewal Reminder',
                    message: 'Nike Air Max 90 has been active for 35 days - consider refreshing',
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                    read: true
                  }} />
                  
                  <NotificationCard notification={{
                    id: 'sample-4',
                    type: 'restock',
                    title: 'Restock Suggestion',
                    message: 'Stone Island items selling 40% faster - consider stocking more',
                    created_at: new Date(Date.now() - 14400000).toISOString(),
                    read: true
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;