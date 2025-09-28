/**
 * USER MANAGEMENT API TEST SCRIPT
 * 
 * Test script to verify all User Management endpoints
 * Run with: node scripts/test-user-management.js
 * 
 * Requirements:
 * - Server running on http://localhost:3000
 * - Valid admin session cookie
 */

const BASE_URL = 'http://localhost:3000'

// Test data
const testUser = {
  name: 'Test User API',
  email: 'testuser@api-test.com',
  organization: 'API Test Hospital',
  phone: '0900000000',
  role: 'user'
}

// Helper function to make HTTP requests with cookie
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      // Add session cookie here if testing with authentication
      // 'Cookie': 'next-auth.session-token=your-session-token'
    }
  }

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  })

  let data
  try {
    data = await response.json()
  } catch (e) {
    data = null
  }

  return {
    status: response.status,
    ok: response.ok,
    data
  }
}

// Test functions
async function testGetUsers() {
  console.log('🧪 Testing GET /api/admin/users...')
  
  const result = await makeRequest('/api/admin/users')
  
  if (result.status === 403) {
    console.log('❌ Access denied - Need admin authentication')
    return false
  }
  
  if (result.ok && result.data.users) {
    console.log(`✅ GET Users: ${result.data.users.length} users found`)
    console.log(`📄 Pagination: Page ${result.data.pagination.page}/${result.data.pagination.totalPages}`)
    return true
  } else {
    console.log(`❌ GET Users failed: ${result.status} - ${result.data?.error}`)
    return false
  }
}

async function testCreateUser() {
  console.log('🧪 Testing POST /api/admin/users...')
  
  const result = await makeRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(testUser)
  })
  
  if (result.status === 403) {
    console.log('❌ Access denied - Need admin authentication')
    return null
  }
  
  if (result.ok && result.data.user) {
    console.log(`✅ CREATE User: ${result.data.user.name} created`)
    return result.data.user.id
  } else {
    console.log(`❌ CREATE User failed: ${result.status} - ${result.data?.error}`)
    return null
  }
}

async function testGetUserById(userId) {
  console.log(`🧪 Testing GET /api/admin/users/${userId}...`)
  
  const result = await makeRequest(`/api/admin/users/${userId}`)
  
  if (result.ok && result.data.user) {
    console.log(`✅ GET User by ID: ${result.data.user.name}`)
    if (result.data.user.statistics) {
      console.log(`📊 Statistics: ${result.data.user.statistics.totalReports} reports, ${result.data.user.statistics.totalCards} cards`)
    }
    return true
  } else {
    console.log(`❌ GET User by ID failed: ${result.status} - ${result.data?.error}`)
    return false
  }
}

async function testUpdateUser(userId) {
  console.log(`🧪 Testing PUT /api/admin/users/${userId}...`)
  
  const updatedData = {
    ...testUser,
    name: 'Test User API (Updated)',
    phone: '0911111111'
  }
  
  const result = await makeRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedData)
  })
  
  if (result.ok && result.data.user) {
    console.log(`✅ UPDATE User: ${result.data.user.name}`)
    return true
  } else {
    console.log(`❌ UPDATE User failed: ${result.status} - ${result.data?.error}`)
    return false
  }
}

async function testDeleteUser(userId) {
  console.log(`🧪 Testing DELETE /api/admin/users/${userId}...`)
  
  const result = await makeRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE'
  })
  
  if (result.ok) {
    console.log(`✅ DELETE User: ${result.data.message}`)
    return true
  } else {
    console.log(`❌ DELETE User failed: ${result.status} - ${result.data?.error}`)
    if (result.status === 409 && result.data.hasData) {
      console.log(`📊 User has data: ${result.data.dataCount.reports} reports, ${result.data.dataCount.cards} cards`)
    }
    return false
  }
}

async function testSearchAndFilter() {
  console.log('🧪 Testing search and filter...')
  
  // Test search
  const searchResult = await makeRequest('/api/admin/users?search=admin')
  if (searchResult.ok) {
    console.log(`✅ Search "admin": ${searchResult.data.users.length} results`)
  }
  
  // Test role filter
  const roleResult = await makeRequest('/api/admin/users?role=admin')
  if (roleResult.ok) {
    console.log(`✅ Role filter "admin": ${roleResult.data.users.length} results`)
  }
  
  // Test pagination
  const pageResult = await makeRequest('/api/admin/users?page=1&limit=5')
  if (pageResult.ok) {
    console.log(`✅ Pagination: ${pageResult.data.users.length} users per page`)
  }
}

async function testValidation() {
  console.log('🧪 Testing validation...')
  
  // Test missing fields
  const invalidResult = await makeRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test',
      // Missing email and organization
    })
  })
  
  if (invalidResult.status === 400) {
    console.log(`✅ Validation: ${invalidResult.data.error}`)
  } else {
    console.log(`❌ Validation test failed: Expected 400, got ${invalidResult.status}`)
  }
  
  // Test duplicate email
  const duplicateResult = await makeRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      ...testUser,
      email: 'admin@soyte.gov.vn' // Existing demo email
    })
  })
  
  if (duplicateResult.status === 400) {
    console.log(`✅ Duplicate email: ${duplicateResult.data.error}`)
  } else {
    console.log(`❌ Duplicate email test failed: Expected 400, got ${duplicateResult.status}`)
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting User Management API Tests...')
  console.log('=' .repeat(50))
  
  try {
    // Basic tests
    const getUsersSuccess = await testGetUsers()
    if (!getUsersSuccess) {
      console.log('⚠️  Cannot continue without admin authentication')
      console.log('')
      console.log('To test with authentication:')
      console.log('1. Login as admin in browser')
      console.log('2. Copy session cookie from browser dev tools')
      console.log('3. Add cookie to makeRequest headers in this script')
      return
    }
    
    await testSearchAndFilter()
    await testValidation()
    
    // CRUD tests
    console.log('')
    console.log('🔄 Running CRUD operations...')
    const userId = await testCreateUser()
    
    if (userId) {
      await testGetUserById(userId)
      await testUpdateUser(userId)
      await testDeleteUser(userId)
    }
    
    console.log('')
    console.log('✅ All tests completed!')
    
  } catch (error) {
    console.error('❌ Test runner error:', error)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
}

module.exports = {
  runTests,
  testGetUsers,
  testCreateUser,
  testGetUserById,
  testUpdateUser,
  testDeleteUser
}




