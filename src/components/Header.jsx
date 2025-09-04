import React from 'react'
import { Sparkles, User } from 'lucide-react'

const Header = () => {
  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold text-white">AdSpark AI</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-white/80 hover:text-white transition-colors">How it Works</a>
            <a href="#" className="text-white/80 hover:text-white transition-colors">Pricing</a>
            <a href="#" className="text-white/80 hover:text-white transition-colors">About</a>
            <a href="#" className="text-white/80 hover:text-white transition-colors">Blog</a>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="btn-secondary text-sm">
              Login
            </button>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header