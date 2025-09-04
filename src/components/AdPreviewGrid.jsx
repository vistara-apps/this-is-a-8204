import React from 'react'
import AdPreviewCard from './AdPreviewCard'
import { Send } from 'lucide-react'

const AdPreviewGrid = ({ ads, selectedAds, onAdSelection, onPostAds }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-4">
          Your AI-Generated Ad Variations
        </h2>
        <p className="text-xl text-purple-100">
          Select your favorites to post to your test social media profiles
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {ads.map((ad) => (
          <AdPreviewCard
            key={ad.id}
            ad={ad}
            isSelected={selectedAds.includes(ad.id)}
            onSelect={() => onAdSelection(ad.id)}
          />
        ))}
      </div>

      {selectedAds.length > 0 && (
        <div className="card max-w-md mx-auto text-center">
          <h3 className="text-lg font-semibold mb-4">
            Ready to Test? ({selectedAds.length} ads selected)
          </h3>
          <p className="text-gray-600 mb-6">
            Post selected ads to your test profiles and start gathering performance data.
          </p>
          <button
            onClick={onPostAds}
            className="btn-primary w-full flex items-center justify-center"
          >
            <Send className="w-4 h-4 mr-2" />
            Post to Social Media
          </button>
        </div>
      )}
    </div>
  )
}

export default AdPreviewGrid