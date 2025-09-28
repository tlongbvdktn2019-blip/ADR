'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function BasicTest() {
  const { data: session, status } = useSession()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Test simple API first
  const testSimpleAPI = async () => {
    setLoading(true)
    try {
      console.log('Testing simple API...')
      const response = await fetch('/api/test-simple')
      const data = await response.json()
      
      setResult({
        type: 'Simple API Test',
        status: response.status,
        ok: response.ok,
        data: data
      })
    } catch (error) {
      console.error('API test error:', error)
      setResult({
        type: 'Simple API Test',
        status: 0,
        ok: false,
        data: { error: error instanceof Error ? error.message : 'Network error' }
      })
    } finally {
      setLoading(false)
    }
  }

  // Test user fix API
  const testUserFix = async () => {
    setLoading(true)
    try {
      console.log('Testing user fix API...')
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      
      setResult({
        type: 'User Fix Test',
        status: response.status,
        ok: response.ok,
        data: data
      })
    } catch (error) {
      console.error('User fix test error:', error)
      setResult({
        type: 'User Fix Test',
        status: 0,
        ok: false,
        data: { error: error instanceof Error ? error.message : 'Network error' }
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="p-6">Loading session...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">???? Basic ADR Test & Fix</h1>
      
      <div className="space-y-6">
        {/* Session Info */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Session Status</h2>
          {session ? (
            <div className="space-y-2 text-sm">
              <p><strong>??? Logged in as:</strong> {session.user.name}</p>
              <p><strong>???? Email:</strong> {session.user.email}</p>
              <p><strong>???? Role:</strong> {session.user.role}</p>
              <p><strong>???? ID:</strong> {session.user.id}</p>
            </div>
          ) : (
            <p className="text-red-600">??? Not logged in</p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Tests</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                First, test if the API is working:
              </p>
              <button
                onClick={testSimpleAPI}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : '???? Test Simple API'}
              </button>
            </div>

            {session && (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Then, fix the user record issue:
                </p>
                <button
                  onClick={testUserFix}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Fixing...' : '???? Fix User Issues'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              {result.type} Results
              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                result.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.ok ? '??? SUCCESS' : '??? FAILED'} ({result.status})
              </span>
            </h2>

            {result.ok && result.data?.actions && (
              <div className="mb-4 p-3 bg-green-50 rounded border-l-4 border-green-400">
                <h3 className="font-medium text-green-900">Actions Performed:</h3>
                <ul className="text-green-800 text-sm mt-2 space-y-1">
                  {result.data.actions.userCreated && (
                    <li>??? Created missing user record in database</li>
                  )}
                  {result.data.actions.roleUpdated && (
                    <li>??? Updated user role to admin</li>
                  )}
                  {!result.data.actions.userCreated && !result.data.actions.roleUpdated && (
                    <li>?????? User record already exists and is correct</li>
                  )}
                </ul>
              </div>
            )}
            
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96 border">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">???? Error Fix Guide</h2>
          <div className="text-blue-800 space-y-2 text-sm">
            <p><strong>Your issue:</strong> "User not found in database" error</p>
            <p><strong>Solution:</strong></p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Click "???? Test Simple API" to verify API works</li>
              <li>Click "???? Fix User Issues" to create missing user record</li>
              <li>Go back to main app and try creating news again</li>
            </ol>
            <p className="mt-4 text-blue-900">
              <strong>What this fixes:</strong> Creates your user record in the database with admin permissions
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <a
            href="/admin/adr-information"
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            ??? Back to ADR Information Admin
          </a>
        </div>
      </div>
    </div>
  )
}

