'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import MainLayout from '../../../../components/layout/MainLayout'
import Button from '../../../../components/ui/Button'
import LoadingSpinner from '../../../../components/ui/LoadingSpinner'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ADRInformationTest() {
  const { data: session } = useSession()
  const [testResult, setTestResult] = useState<any>(null)
  const [createResult, setCreateResult] = useState<any>(null)
  const [rlsResult, setRlsResult] = useState<any>(null)
  const [userResult, setUserResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [testingRls, setTestingRls] = useState(false)
  const [checkingUser, setCheckingUser] = useState(false)

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

  const testCreate = async () => {
    setCreating(true)
    setCreateResult(null)
    
    try {
      const testData = {
        title: 'Test Information ' + new Date().toLocaleString(),
        content: '<p>This is a test content created at ' + new Date().toLocaleString() + '</p>',
        type: 'news',
        priority: 3
      }

      const response = await fetch('/api/adr-information/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      const data = await response.json()
      setCreateResult({ 
        status: response.status, 
        data, 
        ok: response.ok 
      })
    } catch (error) {
      setCreateResult({ 
        status: 0, 
        data: { error: error instanceof Error ? error.message : 'Network error' }, 
        ok: false 
      })
    } finally {
      setCreating(false)
    }
  }

  const testRLS = async () => {
    setTestingRls(true)
    setRlsResult(null)
    
    try {
      const response = await fetch('/api/adr-information/test/rls')
      const data = await response.json()
      setRlsResult({ 
        status: response.status, 
        data, 
        ok: response.ok 
      })
    } catch (error) {
      setRlsResult({ 
        status: 0, 
        data: { error: error instanceof Error ? error.message : 'Network error' }, 
        ok: false 
      })
    } finally {
      setTestingRls(false)
    }
  }

  const checkUser = async () => {
    setCheckingUser(true)
    setUserResult(null)
    
    try {
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      setUserResult({ 
        status: response.status, 
        data, 
        ok: response.ok 
      })
    } catch (error) {
      setUserResult({ 
        status: 0, 
        data: { error: error instanceof Error ? error.message : 'Network error' }, 
        ok: false 
      })
    } finally {
      setCheckingUser(false)
    }
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Please login to access this test page</p>
        </div>
      </MainLayout>
    )
  }

  if (session.user.role !== 'admin') {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Admin access required</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/adr-information"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">ADR Information Test</h1>
        </div>

        {/* Session Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Session</h2>
          <div className="space-y-2 text-sm">
            <p><strong>User:</strong> {session.user.name}</p>
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>Role:</strong> {session.user.role}</p>
            <p><strong>ID:</strong> {session.user.id}</p>
            <p><strong>Organization:</strong> {session.user.organization || 'None'}</p>
          </div>
        </div>

        {/* Primary Fix Button */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">🚨 Fix User Issues First</h2>
          <p className="text-red-700 text-sm mb-4">
            Based on your error, the user record is missing from the database. Click this button to fix it automatically.
          </p>
          <Button
            onClick={checkUser}
            disabled={checkingUser}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
          >
            {checkingUser ? <LoadingSpinner size="sm" /> : null}
            <span>🔧 Fix User Issues</span>
          </Button>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={runTest}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : null}
              <span>Test Database Connection</span>
            </Button>

            <Button
              onClick={testRLS}
              disabled={testingRls}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {testingRls ? <LoadingSpinner size="sm" /> : null}
              <span>Test RLS Policies</span>
            </Button>

            <Button
              onClick={testCreate}
              disabled={creating}
              variant="danger"
              className="flex items-center space-x-2"
            >
              {creating ? <LoadingSpinner size="sm" /> : null}
              <span>Test Create Information</span>
            </Button>
          </div>
        </div>

        {/* User Fix Results */}
        {userResult && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              User Fix Results 
              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                userResult.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userResult.ok ? 'SUCCESS' : 'FAILED'} ({userResult.status})
              </span>
            </h2>
            {userResult.ok && userResult.data.actions && (
              <div className="mb-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                <h3 className="font-medium text-blue-900">Actions Performed:</h3>
                <ul className="text-blue-800 text-sm mt-2 space-y-1">
                  {userResult.data.actions.userCreated && (
                    <li>✅ Created missing user record in database</li>
                  )}
                  {userResult.data.actions.roleUpdated && (
                    <li>✅ Updated user role to admin</li>
                  )}
                  {!userResult.data.actions.userCreated && !userResult.data.actions.roleUpdated && (
                    <li>ℹ️ User record already exists and is correct</li>
                  )}
                </ul>
              </div>
            )}
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(userResult.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Test Results */}
        {testResult && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Database Test Results 
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

        {/* RLS Test Results */}
        {rlsResult && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              RLS Policy Test Results 
              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                rlsResult.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {rlsResult.ok ? 'SUCCESS' : 'FAILED'} ({rlsResult.status})
              </span>
            </h2>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(rlsResult.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Create Test Results */}
        {createResult && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Create Test Results 
              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                createResult.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {createResult.ok ? 'SUCCESS' : 'FAILED'} ({createResult.status})
              </span>
            </h2>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(createResult.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">How to Debug</h2>
          <div className="space-y-2 text-blue-800">
            <p><strong>⚡ QUICK FIX for "User not found" error:</strong></p>
            <ol className="list-decimal list-inside ml-4 space-y-1 mb-4">
              <li>Click the <strong>"🔧 Fix User Issues"</strong> button first</li>
              <li>Wait for success message</li>
              <li>Then run the other tests to verify</li>
            </ol>
            <p><strong>📋 Full testing sequence:</strong></p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li><strong>Fix User Issues</strong> - Creates missing user record and sets admin role</li>
              <li><strong>Test Database Connection</strong> - Verifies user exists and has access</li>
              <li><strong>Test RLS Policies</strong> - Deep dive into authentication policies</li>
              <li><strong>Test Create Information</strong> - Final test of actual insert operation</li>
            </ol>
            <p className="mt-4"><strong>🛠️ If automated fix doesn't work:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Run SQL manually: <code>supabase/fix-missing-user.sql</code></li>
              <li>Then run: <code>supabase/fix-adr-information-rls.sql</code></li>
            </ul>
          </div>
        </div>

        {/* SQL Commands */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick SQL Commands</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-2 text-red-600">🔧 FIRST: Fix missing user:</p>
              <pre className="bg-white p-2 rounded border">
                \\i supabase/fix-missing-user.sql
              </pre>
            </div>
            <div>
              <p className="font-medium mb-2 text-orange-600">🔧 SECOND: Fix RLS policies:</p>
              <pre className="bg-white p-2 rounded border">
                \\i supabase/fix-adr-information-rls.sql
              </pre>
            </div>
            <div>
              <p className="font-medium mb-2">Check if tables exist:</p>
              <pre className="bg-white p-2 rounded border">
{`SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('adr_information', 'information_views', 'information_likes');`}
              </pre>
            </div>
            <div>
              <p className="font-medium mb-2">Check user role:</p>
              <pre className="bg-white p-2 rounded border">
{`SELECT id, name, email, role::text FROM users WHERE id = '${session.user.id}';`}
              </pre>
            </div>
            <div>
              <p className="font-medium mb-2">Test auth.uid() function:</p>
              <pre className="bg-white p-2 rounded border">
                SELECT get_current_user_id(), test_admin_check();
              </pre>
            </div>
            <div>
              <p className="font-medium mb-2">Check RLS policies:</p>
              <pre className="bg-white p-2 rounded border">
{`SELECT tablename, policyname, cmd, permissive 
FROM pg_policies WHERE tablename = 'adr_information';`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import MainLayout from '../../../../components/layout/MainLayout'
import Button from '../../../../components/ui/Button'
import LoadingSpinner from '../../../../components/ui/LoadingSpinner'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ADRInformationTest() {
  const { data: session } = useSession()
  const [testResult, setTestResult] = useState<any>(null)
  const [createResult, setCreateResult] = useState<any>(null)
  const [rlsResult, setRlsResult] = useState<any>(null)
  const [userResult, setUserResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [testingRls, setTestingRls] = useState(false)
  const [checkingUser, setCheckingUser] = useState(false)

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

  const testCreate = async () => {
    setCreating(true)
    setCreateResult(null)
    
    try {
      const testData = {
        title: 'Test Information ' + new Date().toLocaleString(),
        content: '<p>This is a test content created at ' + new Date().toLocaleString() + '</p>',
        type: 'news',
        priority: 3
      }

      const response = await fetch('/api/adr-information/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      const data = await response.json()
      setCreateResult({ 
        status: response.status, 
        data, 
        ok: response.ok 
      })
    } catch (error) {
      setCreateResult({ 
        status: 0, 
        data: { error: error instanceof Error ? error.message : 'Network error' }, 
        ok: false 
      })
    } finally {
      setCreating(false)
    }
  }

  const testRLS = async () => {
    setTestingRls(true)
    setRlsResult(null)
    
    try {
      const response = await fetch('/api/adr-information/test/rls')
      const data = await response.json()
      setRlsResult({ 
        status: response.status, 
        data, 
        ok: response.ok 
      })
    } catch (error) {
      setRlsResult({ 
        status: 0, 
        data: { error: error instanceof Error ? error.message : 'Network error' }, 
        ok: false 
      })
    } finally {
      setTestingRls(false)
    }
  }

  const checkUser = async () => {
    setCheckingUser(true)
    setUserResult(null)
    
    try {
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      setUserResult({ 
        status: response.status, 
        data, 
        ok: response.ok 
      })
    } catch (error) {
      setUserResult({ 
        status: 0, 
        data: { error: error instanceof Error ? error.message : 'Network error' }, 
        ok: false 
      })
    } finally {
      setCheckingUser(false)
    }
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Please login to access this test page</p>
        </div>
      </MainLayout>
    )
  }

  if (session.user.role !== 'admin') {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Admin access required</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/adr-information"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">ADR Information Test</h1>
        </div>

        {/* Session Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Session</h2>
          <div className="space-y-2 text-sm">
            <p><strong>User:</strong> {session.user.name}</p>
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>Role:</strong> {session.user.role}</p>
            <p><strong>ID:</strong> {session.user.id}</p>
            <p><strong>Organization:</strong> {session.user.organization || 'None'}</p>
          </div>
        </div>

        {/* Primary Fix Button */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">🚨 Fix User Issues First</h2>
          <p className="text-red-700 text-sm mb-4">
            Based on your error, the user record is missing from the database. Click this button to fix it automatically.
          </p>
          <Button
            onClick={checkUser}
            disabled={checkingUser}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
          >
            {checkingUser ? <LoadingSpinner size="sm" /> : null}
            <span>🔧 Fix User Issues</span>
          </Button>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={runTest}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : null}
              <span>Test Database Connection</span>
            </Button>

            <Button
              onClick={testRLS}
              disabled={testingRls}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {testingRls ? <LoadingSpinner size="sm" /> : null}
              <span>Test RLS Policies</span>
            </Button>

            <Button
              onClick={testCreate}
              disabled={creating}
              variant="danger"
              className="flex items-center space-x-2"
            >
              {creating ? <LoadingSpinner size="sm" /> : null}
              <span>Test Create Information</span>
            </Button>
          </div>
        </div>

        {/* User Fix Results */}
        {userResult && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              User Fix Results 
              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                userResult.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userResult.ok ? 'SUCCESS' : 'FAILED'} ({userResult.status})
              </span>
            </h2>
            {userResult.ok && userResult.data.actions && (
              <div className="mb-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                <h3 className="font-medium text-blue-900">Actions Performed:</h3>
                <ul className="text-blue-800 text-sm mt-2 space-y-1">
                  {userResult.data.actions.userCreated && (
                    <li>✅ Created missing user record in database</li>
                  )}
                  {userResult.data.actions.roleUpdated && (
                    <li>✅ Updated user role to admin</li>
                  )}
                  {!userResult.data.actions.userCreated && !userResult.data.actions.roleUpdated && (
                    <li>ℹ️ User record already exists and is correct</li>
                  )}
                </ul>
              </div>
            )}
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(userResult.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Test Results */}
        {testResult && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Database Test Results 
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

        {/* RLS Test Results */}
        {rlsResult && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              RLS Policy Test Results 
              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                rlsResult.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {rlsResult.ok ? 'SUCCESS' : 'FAILED'} ({rlsResult.status})
              </span>
            </h2>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(rlsResult.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Create Test Results */}
        {createResult && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Create Test Results 
              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                createResult.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {createResult.ok ? 'SUCCESS' : 'FAILED'} ({createResult.status})
              </span>
            </h2>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(createResult.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">How to Debug</h2>
          <div className="space-y-2 text-blue-800">
            <p><strong>⚡ QUICK FIX for "User not found" error:</strong></p>
            <ol className="list-decimal list-inside ml-4 space-y-1 mb-4">
              <li>Click the <strong>"🔧 Fix User Issues"</strong> button first</li>
              <li>Wait for success message</li>
              <li>Then run the other tests to verify</li>
            </ol>
            <p><strong>📋 Full testing sequence:</strong></p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li><strong>Fix User Issues</strong> - Creates missing user record and sets admin role</li>
              <li><strong>Test Database Connection</strong> - Verifies user exists and has access</li>
              <li><strong>Test RLS Policies</strong> - Deep dive into authentication policies</li>
              <li><strong>Test Create Information</strong> - Final test of actual insert operation</li>
            </ol>
            <p className="mt-4"><strong>🛠️ If automated fix doesn't work:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Run SQL manually: <code>supabase/fix-missing-user.sql</code></li>
              <li>Then run: <code>supabase/fix-adr-information-rls.sql</code></li>
            </ul>
          </div>
        </div>

        {/* SQL Commands */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick SQL Commands</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-2 text-red-600">🔧 FIRST: Fix missing user:</p>
              <pre className="bg-white p-2 rounded border">
                \\i supabase/fix-missing-user.sql
              </pre>
            </div>
            <div>
              <p className="font-medium mb-2 text-orange-600">🔧 SECOND: Fix RLS policies:</p>
              <pre className="bg-white p-2 rounded border">
                \\i supabase/fix-adr-information-rls.sql
              </pre>
            </div>
            <div>
              <p className="font-medium mb-2">Check if tables exist:</p>
              <pre className="bg-white p-2 rounded border">
{`SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('adr_information', 'information_views', 'information_likes');`}
              </pre>
            </div>
            <div>
              <p className="font-medium mb-2">Check user role:</p>
              <pre className="bg-white p-2 rounded border">
{`SELECT id, name, email, role::text FROM users WHERE id = '${session.user.id}';`}
              </pre>
            </div>
            <div>
              <p className="font-medium mb-2">Test auth.uid() function:</p>
              <pre className="bg-white p-2 rounded border">
                SELECT get_current_user_id(), test_admin_check();
              </pre>
            </div>
            <div>
              <p className="font-medium mb-2">Check RLS policies:</p>
              <pre className="bg-white p-2 rounded border">
{`SELECT tablename, policyname, cmd, permissive 
FROM pg_policies WHERE tablename = 'adr_information';`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
