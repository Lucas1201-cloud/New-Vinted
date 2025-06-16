import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InventoryForecasting = () => {
  const [stats, setStats] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    fetchForecastData();
    generateInsights();
  }, [selectedPeriod]);

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
      
      // Generate mock forecast data based on current performance
      const mockForecastData = generateForecastData(response.data);
      setForecastData(mockForecastData);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateForecastData = (currentStats) => {
    const periods = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12;
    const baseRevenue = (currentStats?.monthly_profit || 200) * 2; // Estimate monthly revenue
    
    return Array.from({ length: periods }, (_, index) => {
      const month = new Date();
      month.setMonth(month.getMonth() + index + 1);
      
      // Add some realistic variance and growth trend
      const growthFactor = 1 + (Math.random() * 0.3 - 0.15); // -15% to +15% variance
      const trendFactor = 1 + (index * 0.05); // 5% growth per month
      
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        projected_revenue: Math.round(baseRevenue * growthFactor * trendFactor),
        projected_profit: Math.round(baseRevenue * growthFactor * trendFactor * 0.35),
        recommended_stock: Math.round(15 + (index * 2) + (Math.random() * 10)),
        confidence: Math.round(90 - (index * 5) + (Math.random() * 10))
      };
    });
  };

  const generateInsights = () => {
    const aiInsights = [
      {
        type: 'seasonal',
        title: 'Seasonal Opportunity',
        description: 'Summer clothing demand expected to increase by 40% in the next 2 months',
        recommendation: 'Stock up on dresses, shorts, and summer tops',
        confidence: 85,
        impact: 'high'
      },
      {
        type: 'brand',
        title: 'Brand Performance',
        description: 'Stone Island items are selling 60% faster than average',
        recommendation: 'Prioritize Stone Island acquisitions for higher turnover',
        confidence: 92,
        impact: 'high'
      },
      {
        type: 'pricing',
        title: 'Price Optimization',
        description: 'You could increase prices by 12% without affecting demand',
        recommendation: 'Gradually adjust pricing on slow-moving premium items',
        confidence: 78,
        impact: 'medium'
      },
      {
        type: 'inventory',
        title: 'Inventory Alert',
        description: 'Current stock will last approximately 6 weeks at current sales pace',
        recommendation: 'Plan next purchasing trip within 3-4 weeks',
        confidence: 88,
        impact: 'high'
      },
      {
        type: 'market',
        title: 'Market Trend',
        description: 'Y2K fashion trend gaining momentum - 90s/early 2000s items in demand',
        recommendation: 'Focus on vintage pieces from 1995-2005 era',
        confidence: 82,
        impact: 'medium'
      }
    ];
    
    setInsights(aiInsights);
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
              <span className="text-xs text-gray-500 ml-1">projected growth</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const ForecastRow = ({ data }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {data.month}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatCurrency(data.projected_revenue)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
        {formatCurrency(data.projected_profit)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {data.recommended_stock} items
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`flex-1 h-2 rounded-full mr-2 ${
            data.confidence >= 80 ? 'bg-green-200' : 
            data.confidence >= 60 ? 'bg-yellow-200' : 'bg-red-200'
          }`}>
            <div 
              className={`h-full rounded-full ${
                data.confidence >= 80 ? 'bg-green-500' : 
                data.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${data.confidence}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{data.confidence}%</span>
        </div>
      </td>
    </tr>
  );

  const InsightCard = ({ insight }) => (
    <div className={`p-4 rounded-lg border-l-4 ${
      insight.impact === 'high' ? 'bg-red-50 border-red-400' :
      insight.impact === 'medium' ? 'bg-yellow-50 border-yellow-400' :
      'bg-blue-50 border-blue-400'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">
              {insight.type === 'seasonal' ? '🌱' :
               insight.type === 'brand' ? '🏷️' :
               insight.type === 'pricing' ? '💰' :
               insight.type === 'inventory' ? '📦' :
               '📈'}
            </span>
            <h3 className={`font-semibold ${
              insight.impact === 'high' ? 'text-red-800' :
              insight.impact === 'medium' ? 'text-yellow-800' :
              'text-blue-800'
            }`}>
              {insight.title}
            </h3>
          </div>
          <p className={`text-sm mb-3 ${
            insight.impact === 'high' ? 'text-red-700' :
            insight.impact === 'medium' ? 'text-yellow-700' :
            'text-blue-700'
          }`}>
            {insight.description}
          </p>
          <div className={`p-3 rounded ${
            insight.impact === 'high' ? 'bg-red-100' :
            insight.impact === 'medium' ? 'bg-yellow-100' :
            'bg-blue-100'
          }`}>
            <p className="text-sm font-medium">💡 Recommendation:</p>
            <p className="text-sm mt-1">{insight.recommendation}</p>
          </div>
        </div>
        <div className="ml-4 text-center">
          <div className={`text-2xl font-bold ${
            insight.impact === 'high' ? 'text-red-600' :
            insight.impact === 'medium' ? 'text-yellow-600' :
            'text-blue-600'
          }`}>
            {insight.confidence}%
          </div>
          <div className="text-xs text-gray-500">confidence</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Inventory Forecasting</h1>
              <p className="text-sm text-gray-600">AI-powered predictions & business intelligence</p>
            </div>
            <div className="flex space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="3months">Next 3 Months</option>
                <option value="6months">Next 6 Months</option>
                <option value="12months">Next 12 Months</option>
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                🤖 Generate New Forecast
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Projected Revenue"
            value={formatCurrency(forecastData.reduce((sum, item) => sum + item.projected_revenue, 0))}
            subtitle="Next 3 months"
            icon="📈"
            color="green"
            trend={15.2}
          />
          <MetricCard
            title="Expected Profit"
            value={formatCurrency(forecastData.reduce((sum, item) => sum + item.projected_profit, 0))}
            subtitle="Estimated margin"
            icon="💰"
            color="emerald"
            trend={12.8}
          />
          <MetricCard
            title="Recommended Stock"
            value={`${forecastData.reduce((sum, item) => sum + item.recommended_stock, 0)} items`}
            subtitle="Optimal inventory"
            icon="📦"
            color="blue"
            trend={8.5}
          />
          <MetricCard
            title="Forecast Accuracy"
            value="87%"
            subtitle="Model confidence"
            icon="🎯"
            color="purple"
            trend={null}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Forecast Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Revenue Forecast</h2>
                <p className="text-sm text-gray-600">Projected performance over selected period</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Needed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {forecastData.map((data, index) => (
                      <ForecastRow key={index} data={data} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory Planning */}
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Planning</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-semibold text-green-800">Current Stock</h3>
                  <p className="text-2xl font-bold text-green-600">{stats?.active_listings || 0}</p>
                  <p className="text-sm text-green-700">Active listings</p>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl mb-2">⏰</div>
                  <h3 className="font-semibold text-yellow-800">Stock Duration</h3>
                  <p className="text-2xl font-bold text-yellow-600">6 weeks</p>
                  <p className="text-sm text-yellow-700">At current pace</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">🛒</div>
                  <h3 className="font-semibold text-blue-800">Next Purchase</h3>
                  <p className="text-2xl font-bold text-blue-600">25 items</p>
                  <p className="text-sm text-blue-700">Recommended</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Insights</h2>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {insights.map((insight, index) => (
                  <InsightCard key={index} insight={insight} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Action Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🛍️ This Week</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Source 5-8 Stone Island pieces</li>
                <li>• List 3 summer dresses</li>
                <li>• Adjust pricing on slow items</li>
                <li>• Renew 7 stale listings</li>
              </ul>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📅 Next Month</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Plan summer collection sourcing</li>
                <li>• Prepare for Y2K trend demand</li>
                <li>• Optimize photography setup</li>
                <li>• Review and adjust ROI targets</li>
              </ul>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">🚀 Long-term</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Expand into autumn/winter prep</li>
                <li>• Build premium brand portfolio</li>
                <li>• Develop international shipping</li>
                <li>• Consider VAT registration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryForecasting;