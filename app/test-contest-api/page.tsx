'use client';

import { useState, useEffect } from 'react';

export default function TestContestAPI() {
  const [results, setResults] = useState<any>({
    active: null,
    register: null,
    questions: null,
    loading: true
  });

  useEffect(() => {
    testAPIs();
  }, []);

  const testAPIs = async () => {
    try {
      setResults({ ...results, loading: true });

      // Test 1: Active Contest
      console.log('🧪 Testing /api/contest/active...');
      const activeRes = await fetch('/api/contest/active');
      const activeData = await activeRes.json();
      
      console.log('✅ Active API:', activeData);

      // Test 2: Departments
      console.log('🧪 Testing /api/contest/departments...');
      const deptRes = await fetch('/api/contest/departments');
      const deptData = await deptRes.json();
      
      console.log('✅ Departments API:', deptData);

      setResults({
        active: {
          status: activeRes.status,
          ok: activeRes.ok,
          data: activeData
        },
        departments: {
          status: deptRes.status,
          ok: deptRes.ok,
          data: deptData
        },
        loading: false
      });
    } catch (error: any) {
      console.error('❌ Error:', error);
      setResults({
        ...results,
        error: error.message,
        loading: false
      });
    }
  };

  if (results.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Testing APIs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🧪 Contest API Test</h1>

        {/* Test Active API */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            {results.active?.ok ? '✅' : '❌'} 
            <span className="ml-2">/api/contest/active</span>
          </h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <p className="text-sm mb-2">
              <strong>Status:</strong> {results.active?.status}
            </p>
            <pre className="text-xs">{JSON.stringify(results.active?.data, null, 2)}</pre>
          </div>
        </div>

        {/* Test Departments API */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            {results.departments?.ok ? '✅' : '❌'} 
            <span className="ml-2">/api/contest/departments</span>
          </h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <p className="text-sm mb-2">
              <strong>Status:</strong> {results.departments?.status}
            </p>
            <pre className="text-xs">{JSON.stringify(results.departments?.data, null, 2)}</pre>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">📊 Summary</h2>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-3 ${results.active?.ok ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Active Contest API: {results.active?.ok ? 'OK' : 'Failed'}</span>
            </li>
            <li className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-3 ${results.departments?.ok ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Departments API: {results.departments?.ok ? 'OK' : 'Failed'}</span>
            </li>
          </ul>

          {results.active?.ok && results.active?.data?.data ? (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-bold">✅ Contest Found!</p>
              <p className="text-sm text-green-700 mt-2">
                Title: {results.active.data.data.title}
              </p>
              <a 
                href="/contest" 
                className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
              >
                Go to Contest Page
              </a>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-bold">❌ No Contest Found</p>
              <p className="text-sm text-red-700 mt-2">
                The API is working but returns no contest. Please check:
              </p>
              <ul className="list-disc ml-6 mt-2 text-sm text-red-700">
                <li>Database: Contest status = 'active'</li>
                <li>Database: Contest is_public = true</li>
                <li>RLS Policies allow anonymous read</li>
              </ul>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={testAPIs}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            🔄 Test Again
          </button>
          <a
            href="/contest"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition inline-block"
          >
            🏆 Go to Contest
          </a>
        </div>
      </div>
    </div>
  );
}

