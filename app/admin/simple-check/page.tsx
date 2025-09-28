'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function SimpleCheck() {
  const { data: session, status } = useSession()
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const runQuickTest = async () => {
    setLoading(true)
    setTestResult('Testing...\n')
    
    let result = ''
    
    // Test 1: Check session
    result += '1. Session check: '
    if (session?.user) {
      result += `✅ OK (${session.user.name} - ${session.user.role})\n`
    } else {
      result += '❌ No session\n'
    }

    // Test 2: Test simple API
    result += '2. Simple API: '
    try {
      const response = await fetch('/api/test-simple')
      const data = await response.json()
      result += response.ok ? '✅ OK\n' : `❌ Failed: ${data.error}\n`
    } catch (error) {
      result += `❌ Error: ${error}\n`
    }

    // Test 3: Test user fix API
    result += '3. User API: '
    try {
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      
      if (response.ok) {
        result += '✅ OK'
        if (data.actions?.userCreated) result += ' (User created)'
        if (data.actions?.roleUpdated) result += ' (Role updated)'
        result += '\n'
      } else {
        result += `❌ Failed: ${data.error}\n`
      }
    } catch (error) {
      result += `❌ Error: ${error}\n`
    }

    // Test 4: Test main API
    result += '4. Main API: '
    try {
      const response = await fetch('/api/adr-information')
      const data = await response.json()
      result += response.ok ? `✅ OK (${data.data?.length || 0} items)\n` : `❌ Failed: ${data.error}\n`
    } catch (error) {
      result += `❌ Error: ${error}\n`
    }

    // Test 5: Test create (if admin)
    if (session?.user?.role === 'admin') {
      result += '5. Create test: '
      try {
        const testData = {
          title: 'Quick Test ' + Date.now(),
          content: '<p>Test content</p>',
          type: 'news'
        }

        const response = await fetch('/api/adr-information', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        })

        if (response.ok) {
          const data = await response.json()
          // Clean up
          await fetch(`/api/adr-information/${data.data.id}`, { method: 'DELETE' })
          result += '✅ OK (Created and cleaned up)\n'
        } else {
          const errorData = await response.json()
          result += `❌ Failed: ${errorData.error}\n`
        }
      } catch (error) {
        result += `❌ Error: ${error}\n`
      }
    } else {
      result += '5. Create test: ⚠️ Skipped (Not admin)\n'
    }

    // Final status
    result += '\n=== SUMMARY ===\n'
    const lines = result.split('\n')
    const okCount = lines.filter(line => line.includes('✅')).length
    const failCount = lines.filter(line => line.includes('❌')).length
    
    if (failCount === 0) {
      result += '🎉 ALL TESTS PASSED!\n'
      result += 'Your ADR Information system is working properly.\n'
      result += 'You can now create new information.'
    } else {
      result += `❌ ${failCount} tests failed\n`
      result += '🔧 Please fix the issues above.'
    }

    setTestResult(result)
    setLoading(false)
  }

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">🔍 Simple ADR Check</h1>
          
          {/* Session info */}
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h2 className="font-semibold mb-2">Current User:</h2>
            {session?.user ? (
              <div className="text-sm space-y-1">
                <p>Name: {session.user.name}</p>
                <p>Email: {session.user.email}</p>
                <p>Role: {session.user.role}</p>
                <p>ID: {session.user.id}</p>
              </div>
            ) : (
              <p className="text-red-600">Not logged in</p>
            )}
          </div>

          {/* Test button */}
          <button
            onClick={runQuickTest}
            disabled={loading}
            className="mb-6 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Testing...' : '🧪 Run Quick Test'}
          </button>

          {/* Results */}
          {testResult && (
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Test Results:</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap font-mono overflow-auto">
                {testResult}
              </pre>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <a
              href="/admin/adr-information"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
            >
              📋 Go to Admin Panel
            </a>
            <a
              href="/admin/adr-information/new"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
            >
              ➕ Create New Information
            </a>
            <a
              href="/adr-information"
              className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              👁️ View Public Page
            </a>
          </div>

          {/* Alternative links */}
          <div className="mt-8 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">Other Test Pages:</h3>
            <div className="space-y-2 text-sm">
              <div><a href="/admin/check-adr" className="text-blue-600 hover:underline">📊 Detailed Check Page</a></div>
              <div><a href="/admin/test-basic" className="text-blue-600 hover:underline">🔧 Basic Test & Fix</a></div>
              <div><a href="/test-adr" className="text-blue-600 hover:underline">🧪 Simple API Test</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function SimpleCheck() {
  const { data: session, status } = useSession()
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const runQuickTest = async () => {
    setLoading(true)
    setTestResult('Testing...\n')
    
    let result = ''
    
    // Test 1: Check session
    result += '1. Session check: '
    if (session?.user) {
      result += `✅ OK (${session.user.name} - ${session.user.role})\n`
    } else {
      result += '❌ No session\n'
    }

    // Test 2: Test simple API
    result += '2. Simple API: '
    try {
      const response = await fetch('/api/test-simple')
      const data = await response.json()
      result += response.ok ? '✅ OK\n' : `❌ Failed: ${data.error}\n`
    } catch (error) {
      result += `❌ Error: ${error}\n`
    }

    // Test 3: Test user fix API
    result += '3. User API: '
    try {
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      
      if (response.ok) {
        result += '✅ OK'
        if (data.actions?.userCreated) result += ' (User created)'
        if (data.actions?.roleUpdated) result += ' (Role updated)'
        result += '\n'
      } else {
        result += `❌ Failed: ${data.error}\n`
      }
    } catch (error) {
      result += `❌ Error: ${error}\n`
    }

    // Test 4: Test main API
    result += '4. Main API: '
    try {
      const response = await fetch('/api/adr-information')
      const data = await response.json()
      result += response.ok ? `✅ OK (${data.data?.length || 0} items)\n` : `❌ Failed: ${data.error}\n`
    } catch (error) {
      result += `❌ Error: ${error}\n`
    }

    // Test 5: Test create (if admin)
    if (session?.user?.role === 'admin') {
      result += '5. Create test: '
      try {
        const testData = {
          title: 'Quick Test ' + Date.now(),
          content: '<p>Test content</p>',
          type: 'news'
        }

        const response = await fetch('/api/adr-information', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        })

        if (response.ok) {
          const data = await response.json()
          // Clean up
          await fetch(`/api/adr-information/${data.data.id}`, { method: 'DELETE' })
          result += '✅ OK (Created and cleaned up)\n'
        } else {
          const errorData = await response.json()
          result += `❌ Failed: ${errorData.error}\n`
        }
      } catch (error) {
        result += `❌ Error: ${error}\n`
      }
    } else {
      result += '5. Create test: ⚠️ Skipped (Not admin)\n'
    }

    // Final status
    result += '\n=== SUMMARY ===\n'
    const lines = result.split('\n')
    const okCount = lines.filter(line => line.includes('✅')).length
    const failCount = lines.filter(line => line.includes('❌')).length
    
    if (failCount === 0) {
      result += '🎉 ALL TESTS PASSED!\n'
      result += 'Your ADR Information system is working properly.\n'
      result += 'You can now create new information.'
    } else {
      result += `❌ ${failCount} tests failed\n`
      result += '🔧 Please fix the issues above.'
    }

    setTestResult(result)
    setLoading(false)
  }

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">🔍 Simple ADR Check</h1>
          
          {/* Session info */}
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h2 className="font-semibold mb-2">Current User:</h2>
            {session?.user ? (
              <div className="text-sm space-y-1">
                <p>Name: {session.user.name}</p>
                <p>Email: {session.user.email}</p>
                <p>Role: {session.user.role}</p>
                <p>ID: {session.user.id}</p>
              </div>
            ) : (
              <p className="text-red-600">Not logged in</p>
            )}
          </div>

          {/* Test button */}
          <button
            onClick={runQuickTest}
            disabled={loading}
            className="mb-6 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Testing...' : '🧪 Run Quick Test'}
          </button>

          {/* Results */}
          {testResult && (
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Test Results:</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap font-mono overflow-auto">
                {testResult}
              </pre>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <a
              href="/admin/adr-information"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
            >
              📋 Go to Admin Panel
            </a>
            <a
              href="/admin/adr-information/new"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
            >
              ➕ Create New Information
            </a>
            <a
              href="/adr-information"
              className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              👁️ View Public Page
            </a>
          </div>

          {/* Alternative links */}
          <div className="mt-8 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">Other Test Pages:</h3>
            <div className="space-y-2 text-sm">
              <div><a href="/admin/check-adr" className="text-blue-600 hover:underline">📊 Detailed Check Page</a></div>
              <div><a href="/admin/test-basic" className="text-blue-600 hover:underline">🔧 Basic Test & Fix</a></div>
              <div><a href="/test-adr" className="text-blue-600 hover:underline">🧪 Simple API Test</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
