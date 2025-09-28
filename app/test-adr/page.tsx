'use client'

export default function TestADR() {
  const testAPI = async () => {
    try {
      const response = await fetch('/api/test-simple')
      const data = await response.json()
      alert(JSON.stringify(data, null, 2))
    } catch (error) {
      alert('Error: ' + error)
    }
  }

  const testUserAPI = async () => {
    try {
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      alert(JSON.stringify(data, null, 2))
    } catch (error) {
      alert('Error: ' + error)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Test ADR System</h1>
      
      <div className="space-y-4">
        <button
          onClick={testAPI}
          className="block w-full p-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Simple API
        </button>

        <button
          onClick={testUserAPI}
          className="block w-full p-4 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Test & Fix User
        </button>

        <div className="space-y-2 text-sm">
          <a href="/admin/check-adr" className="block p-3 bg-gray-100 rounded hover:bg-gray-200">
            → Go to Check ADR Page
          </a>
          <a href="/admin/adr-information" className="block p-3 bg-gray-100 rounded hover:bg-gray-200">
            → Go to ADR Information Admin
          </a>
          <a href="/admin/test-basic" className="block p-3 bg-gray-100 rounded hover:bg-gray-200">
            → Go to Basic Test Page
          </a>
        </div>
      </div>
    </div>
  )
}

export default function TestADR() {
  const testAPI = async () => {
    try {
      const response = await fetch('/api/test-simple')
      const data = await response.json()
      alert(JSON.stringify(data, null, 2))
    } catch (error) {
      alert('Error: ' + error)
    }
  }

  const testUserAPI = async () => {
    try {
      const response = await fetch('/api/adr-information/test/user')
      const data = await response.json()
      alert(JSON.stringify(data, null, 2))
    } catch (error) {
      alert('Error: ' + error)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Test ADR System</h1>
      
      <div className="space-y-4">
        <button
          onClick={testAPI}
          className="block w-full p-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Simple API
        </button>

        <button
          onClick={testUserAPI}
          className="block w-full p-4 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Test & Fix User
        </button>

        <div className="space-y-2 text-sm">
          <a href="/admin/check-adr" className="block p-3 bg-gray-100 rounded hover:bg-gray-200">
            → Go to Check ADR Page
          </a>
          <a href="/admin/adr-information" className="block p-3 bg-gray-100 rounded hover:bg-gray-200">
            → Go to ADR Information Admin
          </a>
          <a href="/admin/test-basic" className="block p-3 bg-gray-100 rounded hover:bg-gray-200">
            → Go to Basic Test Page
          </a>
        </div>
      </div>
    </div>
  )
}
