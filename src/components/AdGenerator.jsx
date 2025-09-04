import React from 'react'
import { Sparkles, Zap } from 'lucide-react'

const AdGenerator = ({ uploadedImage, onGenerate, isGenerating }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-4">
          Ready to Create Magic?
        </h2>
        <p className="text-xl text-purple-100">
          Our AI will generate 4 unique ad variations optimized for social media success
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Your Product Image</h3>
          {uploadedImage && (
            <img
              src={uploadedImage}
              alt="Product"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <div className="space-y-3">
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Image quality: Excellent
            </div>
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Resolution: Optimized for social media
            </div>
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Format: Supported
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-4">What You'll Get</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <Sparkles className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">4 Unique Ad Variations</p>
                <p className="text-sm text-gray-600">Different headlines, copy, and visual treatments</p>
              </div>
            </div>
            <div className="flex items-start">
              <Zap className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Performance Predictions</p>
                <p className="text-sm text-gray-600">AI-powered engagement forecasts</p>
              </div>
            </div>
            <div className="flex items-start">
              <Sparkles className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Platform Optimization</p>
                <p className="text-sm text-gray-600">Tailored for Instagram and TikTok</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
            <p className="text-sm font-medium text-primary">
              💰 Cost: $0.50 for complete ad batch
            </p>
          </div>

          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="btn-primary w-full mt-6 flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Generating Ads...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ad Variations
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdGenerator