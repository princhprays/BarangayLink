import React from 'react'
import { Link } from 'react-router-dom'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BL</span>
              </div>
              <span className="ml-2 text-xl font-bold">BarangayLink</span>
            </div>
            <p className="text-gray-300 text-sm max-w-md">
              A comprehensive barangay management platform that connects residents, 
              facilitates community sharing, and streamlines administrative processes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/marketplace" className="text-gray-300 hover:text-white text-sm">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/benefits" className="text-gray-300 hover:text-white text-sm">
                  Community Benefits
                </Link>
              </li>
              <li>
                <Link to="/announcements" className="text-gray-300 hover:text-white text-sm">
                  Announcements
                </Link>
              </li>
              <li>
                <Link to="/certificates" className="text-gray-300 hover:text-white text-sm">
                  Certificates
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white text-sm">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>Email: Pauljohn.antigo@gmail.com</p>
              <p>Phone: (+63) 9764859463</p>
              <p>Address: Zambales, Philippines</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 BarangayLink. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
