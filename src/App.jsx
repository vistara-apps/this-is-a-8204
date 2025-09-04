import React, { useState } from 'react'
import Header from './components/Header'
import ImageUploader from './components/ImageUploader'
import AdGenerator from './components/AdGenerator'
import AdPreviewGrid from './components/AdPreviewGrid'
import Analytics from './components/Analytics'
import BillingModal from './components/BillingModal'

function App() {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [generatedAds, setGeneratedAds] = useState([])
  const [selectedAds, setSelectedAds] = useState([])
  const [showBilling, setShowBilling] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState('upload') // upload, generate, preview, analytics

  const handleImageUpload = (file) => {
    setUploadedImage(file)
    setCurrentStep('generate')
  }

  const handleGenerateAds = () => {
    if (!isPaid) {
      setShowBilling(true)
      return
    }
    
    setIsGenerating(true)
    // Simulate API call
    setTimeout(() => {
      const mockAds = [
        {
          id: 1,
          headline: "Transform Your Style Today",
          copy: "Discover the perfect look that matches your personality. Join thousands who've already transformed their style.",
          imageUrl: uploadedImage,
          platform: "instagram",
          predictedScore: 87,
          metrics: { likes: 1240, comments: 89, shares: 156, views: 12400 }
        },
        {
          id: 2,
          headline: "Limited Time: 50% Off",
          copy: "Don't miss out! This exclusive offer ends soon. Get yours before it's too late.",
          imageUrl: uploadedImage,
          platform: "tiktok",
          predictedScore: 92,
          metrics: { likes: 2180, comments: 134, shares: 298, views: 18700 }
        },
        {
          id: 3,
          headline: "Why Everyone's Talking About This",
          copy: "See what the buzz is all about. Join the conversation and discover something amazing.",
          imageUrl: uploadedImage,
          platform: "instagram",
          predictedScore: 79,
          metrics: { likes: 890, comments: 67, shares: 123, views: 9200 }
        },
        {
          id: 4,
          headline: "Your Next Favorite Thing",
          copy: "Ready to fall in love? This could be exactly what you've been searching for.",
          imageUrl: uploadedImage,
          platform: "tiktok",
          predictedScore: 85,
          metrics: { likes: 1560, comments: 98, shares: 187, views: 14300 }
        }
      ]
      setGeneratedAds(mockAds)
      setIsGenerating(false)
      setCurrentStep('preview')
    }, 3000)
  }

  const handleAdSelection = (adId) => {
    setSelectedAds(prev => 
      prev.includes(adId) 
        ? prev.filter(id => id !== adId)
        : [...prev, adId]
    )
  }

  const handlePostAds = () => {
    if (selectedAds.length === 0) return
    
    // Simulate posting
    setTimeout(() => {
      setCurrentStep('analytics')
    }, 1000)
  }

  const handlePaymentSuccess = () => {
    setIsPaid(true)
    setShowBilling(false)
    handleGenerateAds()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentStep === 'upload' && (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-4">
                Win jind Sirle: Ad?
              </h1>
              <p className="text-xl text-purple-100 mb-8">
                Upload your product image and let AI create winning ad variations
              </p>
            </div>
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
        )}

        {currentStep === 'generate' && (
          <div className="animate-slide-up">
            <AdGenerator 
              uploadedImage={uploadedImage}
              onGenerate={handleGenerateAds}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="animate-slide-up">
            <AdPreviewGrid 
              ads={generatedAds}
              selectedAds={selectedAds}
              onAdSelection={handleAdSelection}
              onPostAds={handlePostAds}
            />
          </div>
        )}

        {currentStep === 'analytics' && (
          <div className="animate-slide-up">
            <Analytics ads={generatedAds.filter(ad => selectedAds.includes(ad.id))} />
          </div>
        )}
      </main>

      {showBilling && (
        <BillingModal 
          onClose={() => setShowBilling(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

export default App