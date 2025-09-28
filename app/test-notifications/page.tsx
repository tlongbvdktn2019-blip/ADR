'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { BellIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useNotifications } from '@/hooks/useNotifications'

export default function TestNotificationsPage() {
  const { data: session } = useSession()
  const [testing, setTesting] = useState(false)
  const { stats, fetchStats } = useNotifications()

  // Test creating a notification via API
  const testCreateNotification = async () => {
    if (!session?.user?.id) {
      toast.error('Please login first')
      return
    }

    setTesting(true)
    try {
      // Create a test notification by inserting directly
      const response = await fetch('/api/test/create-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'system',
          title: 'Test Notification',
          message: `Test notification created at ${new Date().toLocaleTimeString()}`,
          data: { test: true }
        })
      })

      if (response.ok) {
        toast.success('Test notification created! Check the bell in header')
        // Refresh stats
        setTimeout(fetchStats, 1000)
      } else {
        const error = await response.json()
        toast.error(`Failed to create notification: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating test notification:', error)
      toast.error('Error creating test notification')
    } finally {
      setTesting(false)
    }
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Notifications</h1>
          <p className="text-gray-600">Please login to test notification functionality</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-8">
        <div className="text-center mb-8">
          <BellIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Notification Bell</h1>
          <p className="text-gray-600">Test the notification bell functionality and positioning</p>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-800">Total</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
            <div className="text-sm text-red-800">Unread</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.read}</div>
            <div className="text-sm text-green-800">Read</div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="space-y-6">
          <div className="border-l-4 border-primary-500 pl-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🔔 Bell Position Test</h3>
            <p className="text-gray-600">
              Check the top right corner of the page. The notification bell should now be positioned 
              at the far right, after the user account dropdown.
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Functionality Test</h3>
            <div className="space-y-2 text-gray-600">
              <p>1. Click the button below to create a test notification</p>
              <p>2. Look at the bell icon - it should show a red badge with the unread count</p>
              <p>3. Click the bell to open the dropdown</p>
              <p>4. Click "Mark as read" to test the read functionality</p>
            </div>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🔄 Real-time Test</h3>
            <div className="space-y-2 text-gray-600">
              <p>1. Open another browser tab/window with this app</p>
              <p>2. Login as a user (user@benhvien.gov.vn / user123)</p>
              <p>3. Create a new ADR report</p>
              <p>4. Come back to this admin tab - notification should appear automatically</p>
            </div>
          </div>
        </div>

        {/* Test Button */}
        <div className="text-center mt-8">
          <Button
            onClick={testCreateNotification}
            disabled={testing}
            size="lg"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Test Notification...
              </>
            ) : (
              <>
                <BellIcon className="w-5 h-5 mr-2" />
                Create Test Notification
              </>
            )}
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Bell Position</div>
              <div className="text-sm text-gray-600">Moved to far right corner</div>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Real-time Updates</div>
              <div className="text-sm text-gray-600">Supabase subscription active</div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 text-center space-x-4">
          <a
            href="/notifications"
            className="text-primary-600 hover:text-primary-800 transition-colors"
          >
            View Full Notifications Page →
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="/reports/new"
            className="text-primary-600 hover:text-primary-800 transition-colors"
          >
            Create New ADR Report →
          </a>
        </div>
      </Card>
    </div>
  )
}
