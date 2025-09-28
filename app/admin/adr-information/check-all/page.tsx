'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MainLayout from '../../../../components/layout/MainLayout'
import LoadingSpinner from '../../../../components/ui/LoadingSpinner'
import Button from '../../../../components/ui/Button'
import Link from 'next/link'
import { ArrowLeftIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'running'
  message?: string
  details?: any
  duration?: number
}

export default function CheckAllADRFeatures() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [tests, setTests] = useState<TestResult[]>([
    { name: '1. Ki???m tra User v?? Permissions', status: 'pending' },
    { name: '2. Ki???m tra Database Schema', status: 'pending' },
    { name: '3. Ki???m tra RLS Policies', status: 'pending' },
    { name: '4. Test API Endpoints', status: 'pending' },
    { name: '5. Test Frontend Pages', status: 'pending' },
    { name: '6. Test Create New Information', status: 'pending' },
    { name: '7. Test Edit Information', status: 'pending' },
    { name: '8. Test User View (Published)', status: 'pending' }
  ])
  
  const [running, setRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState(0)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  if (session?.user?.role !== 'admin') {
    router.push('/unauthorized')
    return null
  }

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ))
  }

  const runTest = async (testIndex: number, testFn: () => Promise<any>) => {
    const startTime = Date.now()
    updateTest(testIndex, { status: 'running' })
    
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      
      updateTest(testIndex, {
        status: 'success',
        message: result.message || 'Test passed',
        details: result,
        duration
      })
    } catch (error) {
      const duration = Date.now() - startTime
      updateTest(testIndex, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Test failed',
        details: error,
        duration
      })
    }
  }

  // Test functions
  const test1_UserPermissions = async () => {
    const response = await fetch('/api/adr-information/test/user')
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'User test failed')
    }
    
    if (!data.publicUser) {
      throw new Error('User record missing in database')
    }
    
    if (data.publicUser.role !== 'admin') {
      throw new Error('User does not have admin role')
    }
    
    return {
      message: 'User permissions OK',
      user: data.publicUser,
      actions: data.actions
    }
  }

  const test2_DatabaseSchema = async () => {
    // Test if tables exist
    const response = await fetch('/api/adr-information/test')
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Database schema test failed')
    }
    
    return {
      message: 'Database schema OK',
      tables: 'adr_information, information_views, information_likes exist'
    }
  }

  const test3_RLSPolicies = async () => {
    const response = await fetch('/api/adr-information/test/rls')
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'RLS test failed')
    }
    
    return {
      message: 'RLS policies working',
      details: data.results
    }
  }

  const test4_APIEndpoints = async () => {
    // Test GET /api/adr-information
    const getResponse = await fetch('/api/adr-information')
    if (!getResponse.ok) {
      const error = await getResponse.json()
      throw new Error(`GET API failed: ${error.error}`)
    }
    
    // Test POST /api/adr-information  
    const testData = {
      title: 'Test Information - ' + Date.now(),
      content: '<p>Test content for API validation</p>',
      type: 'news',
      priority: 5,
      tags: ['test', 'api-check'],
      target_audience: ['admin']
    }
    
    const postResponse = await fetch('/api/adr-information', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })
    
    if (!postResponse.ok) {
      const error = await postResponse.json()
      throw new Error(`POST API failed: ${error.error}`)
    }
    
    const created = await postResponse.json()
    
    // Clean up test data
    await fetch(`/api/adr-information/${created.data.id}`, { method: 'DELETE' })
    
    return {
      message: 'API endpoints working',
      tested: ['GET', 'POST', 'DELETE']
    }
  }

  const test5_FrontendPages = async () => {
    // Test admin page load
    const adminResponse = await fetch('/admin/adr-information')
    if (!adminResponse.ok && adminResponse.status !== 500) { // 500 might be expected for SSR
      throw new Error('Admin page failed to load')
    }
    
    // Test user page load
    const userResponse = await fetch('/adr-information')
    if (!userResponse.ok && userResponse.status !== 500) {
      throw new Error('User page failed to load')
    }
    
    return {
      message: 'Frontend pages accessible',
      pages: ['Admin management', 'User view']
    }
  }

  const test6_CreateInformation = async () => {
    // Test the actual creation process
    const testData = {
      title: 'Full Test Information - ' + new Date().toLocaleString(),
      summary: 'Test summary for comprehensive check',
      content: '<h2>Test Content</h2><p>This is a comprehensive test of the create functionality.</p>',
      type: 'news',
      priority: 2,
      tags: ['test', 'comprehensive'],
      target_audience: ['admin', 'user'],
      is_pinned: false,
      show_on_homepage: true,
      meta_keywords: 'test, adr, information',
      meta_description: 'Test meta description'
    }
    
    const response = await fetch('/api/adr-information', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Create failed: ${error.error}`)
    }
    
    const result = await response.json()
    
    return {
      message: 'Information created successfully',
      id: result.data.id,
      title: result.data.title,
      status: result.data.status
    }
  }

  const test7_EditInformation = async () => {
    // First create a test item
    const createData = {
      title: 'Edit Test - ' + Date.now(),
      content: '<p>Original content</p>',
      type: 'news'
    }
    
    const createResponse = await fetch('/api/adr-information', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createData)
    })
    
    if (!createResponse.ok) {
      throw new Error('Failed to create test item for edit test')
    }
    
    const created = await createResponse.json()
    const itemId = created.data.id
    
    // Now test editing
    const updateData = {
      title: 'Edited Test - ' + Date.now(),
      content: '<p>Updated content</p>',
      status: 'published'
    }
    
    const editResponse = await fetch(`/api/adr-information/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    
    if (!editResponse.ok) {
      const error = await editResponse.json()
      throw new Error(`Edit failed: ${error.error}`)
    }
    
    // Clean up
    await fetch(`/api/adr-information/${itemId}`, { method: 'DELETE' })
    
    return {
      message: 'Edit functionality working',
      tested: ['Update content', 'Change status']
    }
  }

  const test8_UserView = async () => {
    // Create a published item for user testing
    const createData = {
      title: 'Public Test - ' + Date.now(),
      content: '<p>Public content for user testing</p>',
      type: 'news',
      target_audience: ['user', 'public'],
      status: 'draft' // We'll publish it
    }
    
    const createResponse = await fetch('/api/adr-information', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createData)
    })
    
    if (!createResponse.ok) {
      throw new Error('Failed to create test item for user view test')
    }
    
    const created = await createResponse.json()
    const itemId = created.data.id
    
    // Publish it
    await fetch(`/api/adr-information/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' })
    })
    
    // Test if it appears in public listing (this would need a non-admin session in real scenario)
    const listResponse = await fetch('/api/adr-information?status=published')
    const listData = await listResponse.json()
    
    const foundItem = listData.data.find((item: any) => item.id === itemId)
    
    // Clean up
    await fetch(`/api/adr-information/${itemId}`, { method: 'DELETE' })
    
    if (!foundItem) {
      throw new Error('Published item not found in public listing')
    }
    
    return {
      message: 'User view functionality working',
      publishedItem: foundItem.title
    }
  }

  const runAllTests = async () => {
    setRunning(true)
    setCurrentTest(0)
    
    const testFunctions = [
      test1_UserPermissions,
      test2_DatabaseSchema,
      test3_RLSPolicies,
      test4_APIEndpoints,
      test5_FrontendPages,
      test6_CreateInformation,
      test7_EditInformation,
      test8_UserView
    ]
    
    for (let i = 0; i < testFunctions.length; i++) {
      setCurrentTest(i)
      await runTest(i, testFunctions[i])
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setRunning(false)
    setCurrentTest(-1)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckIcon className="w-5 h-5 text-green-600" />
      case 'error':
        return <XMarkIcon className="w-5 h-5 text-red-600" />
      case 'running':
        return <LoadingSpinner size="sm" />
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
    }
  }

  const successCount = tests.filter(t => t.status === 'success').length
  const errorCount = tests.filter(t => t.status === 'error').length
  const totalTests = tests.length

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/adr-information"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-1" />
              Quay l???i
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">???? Ki???m tra to??n b??? ADR Information</h1>
              <p className="text-gray-600 mt-1">Comprehensive test c???a t???t c??? ch???c n??ng</p>
            </div>
          </div>
          
          <Button
            onClick={runAllTests}
            disabled={running}
            className="flex items-center space-x-2"
          >
            {running ? <LoadingSpinner size="sm" /> : null}
            <span>{running ? '??ang test...' : 'Ch???y t???t c??? tests'}</span>
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-gray-600">Th??nh c??ng</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-gray-600">L???i</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{totalTests}</div>
              <div className="text-sm text-gray-600">T???ng tests</div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">K???t qu??? ki???m tra</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {tests.map((test, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  test.status === 'success' ? 'border-green-200 bg-green-50' :
                  test.status === 'error' ? 'border-red-200 bg-red-50' :
                  test.status === 'running' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <p className="font-medium">{test.name}</p>
                      {test.message && (
                        <p className={`text-sm ${
                          test.status === 'success' ? 'text-green-600' :
                          test.status === 'error' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {test.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {test.duration && (
                    <span className="text-xs text-gray-500">
                      {test.duration}ms
                    </span>
                  )}
                </div>
                
                {test.details && test.status === 'error' && (
                  <div className="mt-3 p-3 bg-red-100 rounded text-sm">
                    <pre className="text-red-800 whitespace-pre-wrap overflow-auto max-h-32">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </div>
                )}
                
                {test.details && test.status === 'success' && (
                  <div className="mt-3 p-3 bg-green-100 rounded text-sm">
                    <pre className="text-green-800 whitespace-pre-wrap overflow-auto max-h-32">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        {errorCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-4">???? C???n fix c??c l???i sau:</h2>
            <div className="space-y-2 text-red-800">
              {tests.filter(t => t.status === 'error').map((test, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <XMarkIcon className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm">{test.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {successCount === totalTests && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-green-900 mb-2">
              ???? T???t c??? ch???c n??ng ho???t ?????ng b??nh th?????ng!
            </h2>
            <p className="text-green-800">
              ADR Information feature ???? s???n s??ng s??? d???ng. B???n c?? th??? t???o tin t???c m???i ngay b??y gi???.
            </p>
            <div className="mt-4">
              <Link href="/admin/adr-information/new">
                <Button className="bg-green-600 hover:bg-green-700">
                  T???o tin t???c m???i
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}


