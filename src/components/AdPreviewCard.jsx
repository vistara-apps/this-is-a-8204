import React from 'react'
import { Instagram, Video, TrendingUp, Heart, MessageCircle, Share } from 'lucide-react'

const AdPreviewCard = ({ ad, isSelected, onSelect }) => {
  const PlatformIcon = ad.platform === 'instagram' ? Instagram : Video

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div
      className={`card cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <PlatformIcon className="w-5 h-5 text-primary" />
          <span className="font-medium capitalize">{ad.platform}</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(ad.predictedScore)}`}>
          <TrendingUp className="w-3 h-3 inline mr-1" />
          {ad.predictedScore}% predicted
        </div>
      </div>

      <div className="mb-4">
        <img
          src={ad.imageUrl}
          alt="Ad creative"
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
        <h3 className="font-bold text-lg mb-2">{ad.headline}</h3>
        <p className="text-gray-600 text-sm">{ad.copy}</p>
      </div>

      <div className="border-t pt-4">
        <p className="text-xs text-gray-500 mb-2">Predicted Performance:</p>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <Heart className="w-3 h-3 mx-auto text-red-500 mb-1" />
            <div className="font-medium">{ad.metrics.likes.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <MessageCircle className="w-3 h-3 mx-auto text-blue-500 mb-1" />
            <div className="font-medium">{ad.metrics.comments}</div>
          </div>
          <div className="text-center">
            <Share className="w-3 h-3 mx-auto text-green-500 mb-1" />
            <div className="font-medium">{ad.metrics.shares}</div>
          </div>
          <div className="text-center">
            <TrendingUp className="w-3 h-3 mx-auto text-purple-500 mb-1" />
            <div className="font-medium">{(ad.metrics.views / 1000).toFixed(1)}K</div>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="mt-4 p-2 bg-primary/10 rounded-lg text-center">
          <p className="text-primary font-medium text-sm">Selected for posting</p>
        </div>
      )}
    </div>
  )
}

export default AdPreviewCard