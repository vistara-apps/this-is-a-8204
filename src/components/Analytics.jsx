import React from 'react'
import { TrendingUp, Users, Heart, MessageCircle, Share, Eye } from 'lucide-react'

const Analytics = ({ ads }) => {
  const totalMetrics = ads.reduce(
    (acc, ad) => ({
      likes: acc.likes + ad.metrics.likes,
      comments: acc.comments + ad.metrics.comments,
      shares: acc.shares + ad.metrics.shares,
      views: acc.views + ad.metrics.views,
    }),
    { likes: 0, comments: 0, shares: 0, views: 0 }
  )

  const avgEngagementRate = ads.length > 0 
    ? ((totalMetrics.likes + totalMetrics.comments + totalMetrics.shares) / totalMetrics.views * 100).toFixed(2)
    : 0

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-4">
          Performance Dashboard
        </h2>
        <p className="text-xl text-purple-100">
          Live analytics from your posted ad variations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Eye className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-text mb-1">
            {totalMetrics.views.toLocaleString()}
          </h3>
          <p className="text-gray-600">Total Views</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Heart className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-text mb-1">
            {totalMetrics.likes.toLocaleString()}
          </h3>
          <p className="text-gray-600">Total Likes</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-text mb-1">
            {totalMetrics.comments}
          </h3>
          <p className="text-gray-600">Comments</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-text mb-1">
            {avgEngagementRate}%
          </h3>
          <p className="text-gray-600">Avg Engagement</p>
        </div>
      </div>

      {/* Individual Ad Performance */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-6">Individual Ad Performance</h3>
        <div className="space-y-4">
          {ads.map((ad, index) => (
            <div key={ad.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden">
                    <img
                      src={ad.imageUrl}
                      alt="Ad creative"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold">{ad.headline}</h4>
                    <p className="text-sm text-gray-600 capitalize">{ad.platform}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {((ad.metrics.likes + ad.metrics.comments + ad.metrics.shares) / ad.metrics.views * 100).toFixed(2)}%
                  </div>
                  <p className="text-sm text-gray-600">Engagement Rate</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{ad.metrics.views.toLocaleString()}</div>
                  <div className="text-gray-600">Views</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{ad.metrics.likes.toLocaleString()}</div>
                  <div className="text-gray-600">Likes</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{ad.metrics.comments}</div>
                  <div className="text-gray-600">Comments</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{ad.metrics.shares}</div>
                  <div className="text-gray-600">Shares</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-8">
        <button className="btn-secondary">
          Export Data
        </button>
        <button className="btn-primary">
          Create New Ad Batch
        </button>
      </div>
    </div>
  )
}

export default Analytics