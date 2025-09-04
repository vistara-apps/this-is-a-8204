import React, { useState } from 'react'
import { X, CreditCard, Lock } from 'lucide-react'

const BillingModal = ({ onClose, onPaymentSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')

  const handlePayment = () => {
    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      onPaymentSuccess()
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text">Complete Purchase</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-primary mb-2">AdSpark AI Generation Package</h3>
              <ul className="text-sm space-y-1">
                <li>• 4 unique ad variations</li>
                <li>• AI performance predictions</li>
                <li>• Auto-posting to test profiles</li>
                <li>• Basic analytics tracking</li>
              </ul>
            </div>
            
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">$0.50</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                    paymentMethod === 'card' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-gray-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                    paymentMethod === 'wallet' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-gray-300'
                  }`}
                >
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm">Wallet</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600">
              <Lock className="w-4 h-4 mr-2" />
              Your payment information is secure and encrypted
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay $0.50
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BillingModal