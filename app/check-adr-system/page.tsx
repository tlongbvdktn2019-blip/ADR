'use client'

export default function CheckADRSystem() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-2 text-center">???? ADR Information System Check</h1>
          <p className="text-gray-600 text-center mb-8">
            Choose a test page to diagnose and fix ADR Information issues
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Simple Check - Recommended */}
            <div className="border-2 border-blue-300 rounded-lg p-6 bg-blue-50">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-blue-900">???? Simple Check</h2>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">RECOMMENDED</span>
                </div>
                <p className="text-blue-700 text-sm mt-2">
                  Quick 5-step test with auto-fix capabilities
                </p>
              </div>
              <a
                href="/admin/simple-check"
                className="block w-full text-center py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Start Simple Check ???
              </a>
            </div>

            {/* Detailed Check */}
            <div className="border rounded-lg p-6 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">???? Detailed Check</h2>
              <p className="text-gray-600 text-sm mb-4">
                Comprehensive analysis with detailed results
              </p>
              <a
                href="/admin/check-adr"
                className="block w-full text-center py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Start Detailed Check ???
              </a>
            </div>

            {/* Basic Test & Fix */}
            <div className="border rounded-lg p-6 bg-green-50">
              <h2 className="text-xl font-semibold text-green-900 mb-2">???? Basic Test & Fix</h2>
              <p className="text-green-700 text-sm mb-4">
                Focus on user issues and permissions
              </p>
              <a
                href="/admin/test-basic"
                className="block w-full text-center py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Start Fix Process ???
              </a>
            </div>

            {/* API Test */}
            <div className="border rounded-lg p-6 bg-yellow-50">
              <h2 className="text-xl font-semibold text-yellow-900 mb-2">??? API Test</h2>
              <p className="text-yellow-700 text-sm mb-4">
                Direct API testing with alerts
              </p>
              <a
                href="/test-adr"
                className="block w-full text-center py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Start API Test ???
              </a>
            </div>
          </div>

          {/* Current Issue */}
          <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-semibold text-red-900 mb-3">???? Your Current Issue:</h2>
            <p className="text-red-800 mb-4">
              <strong>"Kh??ng th??? th??m m???i th??ng tin trong tab ADR Info"</strong>
            </p>
            <div className="text-red-700 text-sm space-y-1">
              <p>Common causes:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>User record missing in database</li>
                <li>Incorrect user permissions (not admin)</li>
                <li>Database schema issues</li>
                <li>API endpoint errors</li>
              </ul>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 p-6 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">???? Direct Links:</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <a href="/admin/adr-information" className="text-blue-600 hover:underline">
                ???? Admin Panel
              </a>
              <a href="/admin/adr-information/new" className="text-blue-600 hover:underline">
                ??? Create New
              </a>
              <a href="/adr-information" className="text-blue-600 hover:underline">
                ??????? Public View
              </a>
              <a href="/api/test-simple" className="text-blue-600 hover:underline">
                ???? API Status
              </a>
              <a href="/admin/users" className="text-blue-600 hover:underline">
                ???? User Management
              </a>
              <a href="/dashboard" className="text-blue-600 hover:underline">
                ???? Dashboard
              </a>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">???? Recommended Flow:</h2>
            <div className="text-blue-800 text-sm space-y-2">
              <p><strong>Step 1:</strong> Start with "???? Simple Check" (recommended)</p>
              <p><strong>Step 2:</strong> If issues found, it will auto-fix them</p>
              <p><strong>Step 3:</strong> Re-run the test to verify fixes</p>
              <p><strong>Step 4:</strong> Go to Admin Panel to create content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

