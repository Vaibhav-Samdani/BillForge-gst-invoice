import React from 'react'

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="material-icons text-indigo-600 text-3xl mr-2">receipt_long</span>
            <span className="font-bold text-2xl text-gray-800">BillForge</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="btn btn-secondary">
              <span className="material-icons mr-2 text-sm">chat_bubble_outline</span>
              WhatsApp
            </button>
            <button className="btn btn-secondary">
              <span className="material-icons mr-2 text-sm">email</span>
              Email
            </button>
            <button className="btn btn-secondary">
              <span className="material-icons mr-2 text-sm">print</span>
              Print
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header