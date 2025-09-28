'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function SimpleTest() {
  const { data: session } = useSession()
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/adr-information/test')
      const data = await response.json()
      setTestResult({ 
        status: response.status, 
        data, 
        ok: response.ok 
      })
    } catch (error) {
      setTestResult({ 
        status: 0, 
        data: { error: error instanceof Error ? error.message : 'Network error' }, 
        ok: false 
      })
    } finally {
      setLoading(false)
    }
  }

  const checkUser = async () => {
    setLoading(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      setTestResult({ 
        status: response.status, 
        data, 
        ok: response.ok 
      })
    } catch (error) {
      setTestResult({ 
        status: 0, 
        data: { error: error instanceof Error ? error.message : 'Network error' }, 
        ok: false 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Simple ADR Information Test</h1>
      
      {!session ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Please login to access this test page</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Session Info */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold mb-4">Current Session</h2>
            <div className="space-y-2 text-sm">
              <p><strong>User:</strong> {session.user.name}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Role:</strong> {session.user.role}</p>
              <p><strong>ID:</strong> {session.user.id}</p>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold mb-4">Tests</h2>
            <div className="space-x-4">
              <button
                onClick={checkUser}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Fix User Issues'}
              </button>
              
              <button
                onClick={runTest}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Test Database'}
              </button>
            </div>
          </div>

          {/* Results */}
          {testResult && (
            <div className="bg-white rounded-lg shadow border p-6">
              <h2 className="text-lg font-semibold mb-4">
                Test Results 
                <span className={`ml-2 px-2 py-1 text-xs rounded ${
                  testResult.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {testResult.ok ? 'SUCCESS' : 'FAILED'} ({testResult.status})
                </span>
              </h2>
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Instructions</h2>
            <div className="text-blue-800 space-y-2">
              <p>1. Click "Fix User Issues" first to create the missing user record</p>
              <p>2. Then click "Test Database" to verify everything works</p>
              <p>3. Check the results for detailed information</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

