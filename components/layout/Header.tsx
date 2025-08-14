import React from 'react'
import Image from 'next/image'

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="BillForge Logo" 
              width={32} 
              height={32} 
              className="w-6 h-6 sm:w-8 sm:h-8 mr-2"
            />
            <span className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-800">BillForge</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button className="btn btn-secondary btn-sm sm:btn-md">
              <span className="material-icons mr-1 sm:mr-2 text-xs sm:text-sm">chat_bubble_outline</span>
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">WA</span>
            </button>
            <button className="btn btn-secondary btn-sm sm:btn-md">
              <span className="material-icons mr-1 sm:mr-2 text-xs sm:text-sm">email</span>
              <span className="hidden sm:inline">Email</span>
              <span className="sm:hidden">Mail</span>
            </button>
            <button className="btn btn-secondary btn-sm sm:btn-md">
              <span className="material-icons mr-1 sm:mr-2 text-xs sm:text-sm">print</span>
              <span className="hidden lg:inline">Print</span>
              <span className="lg:hidden">📄</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header