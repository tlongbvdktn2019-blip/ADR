'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function CheckADR() {
  const { data: session } = useSession()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const runBasicCheck = async () => {
    setLoading(true)
    setResults([])
    const checks = []

    // Test 1: Session check
    checks.push({
      name: '1. Session Check',
      status: session ? '✅ OK' : '❌ No session',
      details: session ? `User: ${session.user.name} (${session.user.role})` : 'Not logged in'
    })

    // Test 2: User API
    try {
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      checks.push({
        name: '2. User API',
        status: response.ok ? '✅ OK' : '❌ Failed',
        details: response.ok ? 'User record accessible' : data.error
      })
    } catch (error) {
      checks.push({
        name: '2. User API',
        status: '❌ Error',
        details: error instanceof Error ? error.message : 'Network error'
      })
    }

    // Test 3: Main API
    try {
      const response = await fetch('/api/adr-information')
      const data = await response.json()
      checks.push({
        name: '3. Main API',
        status: response.ok ? '✅ OK' : '❌ Failed',
        details: response.ok ? `Found ${data.data?.length || 0} items` : data.error
      })
    } catch (error) {
      checks.push({
        name: '3. Main API',
        status: '❌ Error',
        details: error instanceof Error ? error.message : 'Network error'
      })
    }

    // Test 4: Create Test
    if (session?.user.role === 'admin') {
      try {
        const testData = {
          title: 'Quick Test - ' + Date.now(),
          content: '<p>Test content</p>',
          type: 'news'
        }

        const response = await fetch('/api/adr-information', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        })

        const data = await response.json()
        
        if (response.ok) {
          // Clean up test data
          await fetch(`/api/adr-information/${data.data.id}`, { method: 'DELETE' })
          checks.push({
            name: '4. Create Test',
            status: '✅ OK',
            details: 'Successfully created and deleted test item'
          })
        } else {
          checks.push({
            name: '4. Create Test',
            status: '❌ Failed',
            details: data.error
          })
        }
      } catch (error) {
        checks.push({
          name: '4. Create Test',
          status: '❌ Error',
          details: error instanceof Error ? error.message : 'Network error'
        })
      }
    } else {
      checks.push({
        name: '4. Create Test',
        status: '⚠️ Skipped',
        details: 'Not admin user'
      })
    }

    setResults(checks)
    setLoading(false)
  }

  const fixUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      
      if (response.ok) {
        alert('User fix completed! Check results above.')
        runBasicCheck() // Re-run checks
      } else {
        alert(`Fix failed: ${data.error}`)
      }
    } catch (error) {
      alert(`Fix error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">
            🔧 ADR Information Quick Check
          </h1>

          {/* Session Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">Current Session:</h2>
            {session ? (
              <div className="text-blue-800 text-sm space-y-1">
                <p><strong>Name:</strong> {session.user.name}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Role:</strong> {session.user.role}</p>
                <p><strong>ID:</strong> {session.user.id}</p>
              </div>
            ) : (
              <p className="text-red-600">❌ Not logged in</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mb-6 space-x-4">
            <button
              onClick={runBasicCheck}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Checking...' : '🔍 Run Quick Check'}
            </button>

            {session && (
              <button
                onClick={fixUser}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Fixing...' : '🔧 Fix User Issues'}
              </button>
            )}

            <a
              href="/admin/adr-information"
              className="inline-block px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              📋 Go to Admin Panel
            </a>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Check Results:</h2>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.status.includes('✅') ? 'border-green-500 bg-green-50' :
                    result.status.includes('❌') ? 'border-red-500 bg-red-50' :
                    'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{result.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                    </div>
                    <span className="text-sm font-mono">{result.status}</span>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Summary:</h3>
                {results.every(r => r.status.includes('✅')) ? (
                  <div className="text-green-600">
                    🎉 All checks passed! Your ADR Information feature is working properly.
                    <div className="mt-2">
                      <a
                        href="/admin/adr-information/new"
                        className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        ✨ Create New Information
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">
                    ❌ Some issues found. Please fix the failed checks above.
                    {results.some(r => r.name.includes('User API') && r.status.includes('❌')) && (
                      <div className="mt-2 text-sm">
                        💡 Try clicking the "🔧 Fix User Issues" button above.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Quick Instructions:</h3>
            <div className="text-blue-800 text-sm space-y-1">
              <p>1. Click "🔍 Run Quick Check" to diagnose issues</p>
              <p>2. If any checks fail, click "🔧 Fix User Issues" to auto-fix</p>
              <p>3. Re-run the check to verify fixes</p>
              <p>4. When all checks pass, go to Admin Panel to create content</p>
            </div>
          </div>

          {/* Direct Links */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">🔗 Direct Links:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <a href="/admin/adr-information" className="text-blue-600 hover:underline">
                  📋 ADR Information Admin Panel
                </a>
              </div>
              <div>
                <a href="/admin/adr-information/new" className="text-blue-600 hover:underline">
                  ➕ Create New Information
                </a>
              </div>
              <div>
                <a href="/adr-information" className="text-blue-600 hover:underline">
                  👁️ View Public Information
                </a>
              </div>
              <div>
                <a href="/admin/test-basic" className="text-blue-600 hover:underline">
                  🧪 Alternative Test Page
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function CheckADR() {
  const { data: session } = useSession()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const runBasicCheck = async () => {
    setLoading(true)
    setResults([])
    const checks = []

    // Test 1: Session check
    checks.push({
      name: '1. Session Check',
      status: session ? '✅ OK' : '❌ No session',
      details: session ? `User: ${session.user.name} (${session.user.role})` : 'Not logged in'
    })

    // Test 2: User API
    try {
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      checks.push({
        name: '2. User API',
        status: response.ok ? '✅ OK' : '❌ Failed',
        details: response.ok ? 'User record accessible' : data.error
      })
    } catch (error) {
      checks.push({
        name: '2. User API',
        status: '❌ Error',
        details: error instanceof Error ? error.message : 'Network error'
      })
    }

    // Test 3: Main API
    try {
      const response = await fetch('/api/adr-information')
      const data = await response.json()
      checks.push({
        name: '3. Main API',
        status: response.ok ? '✅ OK' : '❌ Failed',
        details: response.ok ? `Found ${data.data?.length || 0} items` : data.error
      })
    } catch (error) {
      checks.push({
        name: '3. Main API',
        status: '❌ Error',
        details: error instanceof Error ? error.message : 'Network error'
      })
    }

    // Test 4: Create Test
    if (session?.user.role === 'admin') {
      try {
        const testData = {
          title: 'Quick Test - ' + Date.now(),
          content: '<p>Test content</p>',
          type: 'news'
        }

        const response = await fetch('/api/adr-information', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        })

        const data = await response.json()
        
        if (response.ok) {
          // Clean up test data
          await fetch(`/api/adr-information/${data.data.id}`, { method: 'DELETE' })
          checks.push({
            name: '4. Create Test',
            status: '✅ OK',
            details: 'Successfully created and deleted test item'
          })
        } else {
          checks.push({
            name: '4. Create Test',
            status: '❌ Failed',
            details: data.error
          })
        }
      } catch (error) {
        checks.push({
          name: '4. Create Test',
          status: '❌ Error',
          details: error instanceof Error ? error.message : 'Network error'
        })
      }
    } else {
      checks.push({
        name: '4. Create Test',
        status: '⚠️ Skipped',
        details: 'Not admin user'
      })
    }

    setResults(checks)
    setLoading(false)
  }

  const fixUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      
      if (response.ok) {
        alert('User fix completed! Check results above.')
        runBasicCheck() // Re-run checks
      } else {
        alert(`Fix failed: ${data.error}`)
      }
    } catch (error) {
      alert(`Fix error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">
            🔧 ADR Information Quick Check
          </h1>

          {/* Session Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">Current Session:</h2>
            {session ? (
              <div className="text-blue-800 text-sm space-y-1">
                <p><strong>Name:</strong> {session.user.name}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Role:</strong> {session.user.role}</p>
                <p><strong>ID:</strong> {session.user.id}</p>
              </div>
            ) : (
              <p className="text-red-600">❌ Not logged in</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mb-6 space-x-4">
            <button
              onClick={runBasicCheck}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Checking...' : '🔍 Run Quick Check'}
            </button>

            {session && (
              <button
                onClick={fixUser}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Fixing...' : '🔧 Fix User Issues'}
              </button>
            )}

            <a
              href="/admin/adr-information"
              className="inline-block px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              📋 Go to Admin Panel
            </a>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Check Results:</h2>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.status.includes('✅') ? 'border-green-500 bg-green-50' :
                    result.status.includes('❌') ? 'border-red-500 bg-red-50' :
                    'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{result.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                    </div>
                    <span className="text-sm font-mono">{result.status}</span>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Summary:</h3>
                {results.every(r => r.status.includes('✅')) ? (
                  <div className="text-green-600">
                    🎉 All checks passed! Your ADR Information feature is working properly.
                    <div className="mt-2">
                      <a
                        href="/admin/adr-information/new"
                        className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        ✨ Create New Information
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">
                    ❌ Some issues found. Please fix the failed checks above.
                    {results.some(r => r.name.includes('User API') && r.status.includes('❌')) && (
                      <div className="mt-2 text-sm">
                        💡 Try clicking the "🔧 Fix User Issues" button above.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Quick Instructions:</h3>
            <div className="text-blue-800 text-sm space-y-1">
              <p>1. Click "🔍 Run Quick Check" to diagnose issues</p>
              <p>2. If any checks fail, click "🔧 Fix User Issues" to auto-fix</p>
              <p>3. Re-run the check to verify fixes</p>
              <p>4. When all checks pass, go to Admin Panel to create content</p>
            </div>
          </div>

          {/* Direct Links */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">🔗 Direct Links:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <a href="/admin/adr-information" className="text-blue-600 hover:underline">
                  📋 ADR Information Admin Panel
                </a>
              </div>
              <div>
                <a href="/admin/adr-information/new" className="text-blue-600 hover:underline">
                  ➕ Create New Information
                </a>
              </div>
              <div>
                <a href="/adr-information" className="text-blue-600 hover:underline">
                  👁️ View Public Information
                </a>
              </div>
              <div>
                <a href="/admin/test-basic" className="text-blue-600 hover:underline">
                  🧪 Alternative Test Page
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
