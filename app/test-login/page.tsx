'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TestLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Test Login Page
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Simplified version for testing
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="admin@soyte.gov.vn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="admin123"
              />
            </div>

            <button
              type="button"
              onClick={() => alert(`Email: ${email}, Password: ${password}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Test Login
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</h3>
            <div className="text-xs text-blue-800 space-y-1">
              <div><strong>Admin:</strong> admin@soyte.gov.vn / admin123</div>
              <div><strong>User:</strong> user@benhvien.gov.vn / user123</div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link 
              href="/auth/login"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              → Go to Real Login Page
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}


