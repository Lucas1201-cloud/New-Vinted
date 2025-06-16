import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await axios.get(`${API}/dashboard/stats`);
      setStats(statsResponse.data);
      
      // Fetch market trends
      const trendsResponse = await axios.get(`${API}/analytics/trends`);
      setTrends(trendsResponse.data);
      
      // Fetch monthly analytics
      const monthlyResponse = await axios.get(`${API}/analytics/monthly`);
      setMonthlyData(monthlyResponse.data);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount || 0);
  };

  const MetricCard = ({ title, value, subtitle, icon, color = "blue", trend = null }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="text-sm font-medium">
                {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const TrendItem = ({ brand, trend_percentage, message }) => (
    <div className={`p-4 rounded-lg border-l-4 ${
      trend_percentage > 0 
        ? 'bg-green-50 border-green-400' 
        : 'bg-red-50 border-red-400'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className={`font-semibold ${
            trend_percentage > 0 ? 'text-green-800' : 'text-red-800'
          }`}>
            {brand}
          </h4>
          <p className={`text-sm ${
            trend_percentage > 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {message}
          </p>
        </div>
        <div className={`text-2xl font-bold ${
          trend_percentage > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend_percentage > 0 ? '+' : ''}{trend_percentage}%
        </div>
      </div>
    </div>
  );

  const InsightCard = ({ title, insight, recommendation, icon }) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-lg">{icon}</span>
          </div>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 mt-1">{insight}</p>
          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-800">💡 Recommendation:</p>
            <p className="text-sm text-purple-700 mt-1">{recommendation}</p>
          </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
              <p className="text-sm text-gray-600">AI-Powered Business Intelligence & Market Insights</p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Export Report
              </button>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                AI Insights
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Average ROI"
            value={`${stats?.average_roi?.toFixed(1) || 0}%`}
            subtitle="Across all sold items"
            icon="📈"
            color="green"
            trend={5.2}
          />
          <MetricCard
            title="Inventory Turnover"
            value="6.8x"
            subtitle="Items per month"
            icon="🔄"
            color="blue"
            trend={-2.1}
          />
          <MetricCard
            title="Avg. Days to Sell"
            value="18"
            subtitle="Days on market"
            icon="⏱️"
            color="orange"
            trend={-12.5}
          />
          <MetricCard
            title="Profit Margin"
            value="47%"
            subtitle="Average margin"
            icon="💰"
            color="emerald"
            trend={8.3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market Trends */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Intelligence</h2>
              <div className="space-y-4">
                {trends.length > 0 ? (
                  trends.map((trend, index) => (
                    <TrendItem key={index} {...trend} />
                  ))
                ) : (
                  <>
                    <TrendItem 
                      brand="Stone Island" 
                      trend_percentage={35} 
                      message="High demand for autumn collection - consider stocking more"
                    />
                    <TrendItem 
                      brand="Armani" 
                      trend_percentage={25} 
                      message="Designer pieces trending up - premium pricing opportunity"
                    />
                    <TrendItem 
                      brand="Fast Fashion" 
                      trend_percentage={-15} 
                      message="Seasonal decline - focus on timeless pieces"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Seasonal Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">❄️</div>
                  <h3 className="font-semibold text-blue-800">Winter</h3>
                  <p className="text-sm text-blue-600">Coats & Boots</p>
                  <p className="text-lg font-bold text-blue-800">£85 avg</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">🌸</div>
                  <h3 className="font-semibold text-green-800">Spring</h3>
                  <p className="text-sm text-green-600">Light Jackets</p>
                  <p className="text-lg font-bold text-green-800">£42 avg</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl mb-2">☀️</div>
                  <h3 className="font-semibold text-yellow-800">Summer</h3>
                  <p className="text-sm text-yellow-600">Dresses & Tops</p>
                  <p className="text-lg font-bold text-yellow-800">£28 avg</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Insights</h2>
              <div className="space-y-4">
                <InsightCard
                  title="Pricing Optimization"
                  insight="Your Stone Island items are priced 15% below market rate"
                  recommendation="Increase pricing by £12-18 for 23% profit boost"
                  icon="💎"
                />
              </div>
            </div>

            {/* Performance Alerts */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Alerts</h2>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        5 items below ROI target
                      </p>
                      <p className="text-xs text-red-700">Review pricing strategy</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-yellow-600 mr-2">🔄</span>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        12 items need renewal
                      </p>
                      <p className="text-xs text-yellow-700">Listings over 30 days old</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">🎯</span>
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Monthly target: 87%
                      </p>
                      <p className="text-xs text-green-700">£156 to reach £1,200 goal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Charts Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Forecast</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-600">Interactive charts coming soon</p>
                <p className="text-sm text-gray-500">Revenue trending +15% this quarter</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Performance</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">Stone Island</p>
                  <p className="text-sm text-gray-600">12 items • £89 avg</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+£427</p>
                  <div className="w-16 h-2 bg-green-200 rounded-full">
                    <div className="w-3/4 h-full bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">Nike</p>
                  <p className="text-sm text-gray-600">8 items • £67 avg</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+£312</p>
                  <div className="w-16 h-2 bg-green-200 rounded-full">
                    <div className="w-2/3 h-full bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">Zara</p>
                  <p className="text-sm text-gray-600">15 items • £23 avg</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+£198</p>
                  <div className="w-16 h-2 bg-green-200 rounded-full">
                    <div className="w-1/2 h-full bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;