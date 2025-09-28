'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import UserList from '@/components/admin/UserList'
import UserForm from '@/components/admin/UserForm'
import PasswordManagement from '@/components/admin/PasswordManagement'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { User, UserFormData, UserFilters, UserListResponse } from '@/types/user'

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [managingPasswordUser, setManagingPasswordUser] = useState<User | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: undefined,
    page: 1,
    limit: 10
  })

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'admin') {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const searchParams = new URLSearchParams()
      searchParams.append('page', filters.page.toString())
      searchParams.append('limit', filters.limit.toString())
      
      if (filters.search) searchParams.append('search', filters.search)
      if (filters.role) searchParams.append('role', filters.role)

      const response = await fetch(`/api/admin/users?${searchParams.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
        setTotalPages(data.pagination.totalPages)
      } else {
        throw new Error(data.error || 'Không thể tải danh sách người dùng')
      }
    } catch (error) {
      console.error('Fetch users error:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchUsers()
    }
  }, [session, fetchUsers])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== undefined) {
        fetchUsers()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [filters.search, fetchUsers])

  // Immediate fetch for other filters
  useEffect(() => {
    if (session?.user?.role === 'admin' && filters.search === undefined) {
      fetchUsers()
    }
  }, [filters.role, filters.page, filters.limit, fetchUsers, session])

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters)
  }

  const handleCreateNew = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const handleEdit = async (user: User) => {
    // Fetch detailed user info
    try {
      const response = await fetch(`/api/admin/users/${user.id}`)
      const data = await response.json()

      if (response.ok) {
        setEditingUser(data.user)
        setShowForm(true)
      } else {
        toast.error(data.error || 'Không thể lấy thông tin chi tiết người dùng')
      }
    } catch (error) {
      console.error('Fetch user detail error:', error)
      toast.error('Có lỗi xảy ra khi lấy thông tin người dùng')
    }
  }

  const handleSubmit = async (formData: UserFormData) => {
    setSubmitting(true)
    
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || (editingUser ? 'Cập nhật người dùng thành công' : 'Tạo người dùng thành công'))
        setShowForm(false)
        setEditingUser(null)
        await fetchUsers() // Refresh the list
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Submit user error:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu thông tin người dùng')
      throw error // Re-throw so form can handle it
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Xóa người dùng thành công')
        await fetchUsers() // Refresh the list
      } else {
        if (response.status === 409 && data.hasData) {
          // User has related data, show detailed error
          toast.error(data.error, { duration: 6000 })
        } else {
          throw new Error(data.error || 'Không thể xóa người dùng')
        }
      }
    } catch (error) {
      console.error('Delete user error:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa người dùng')
      throw error // Re-throw so UserList can handle it
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingUser(null)
  }

  const handleManagePassword = (user: User) => {
    setManagingPasswordUser(user)
  }

  const handlePasswordManagementClose = () => {
    setManagingPasswordUser(null)
  }

  const handlePasswordManagementSuccess = () => {
    // Refresh users list if needed
    fetchUsers()
  }

  // Loading state
  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  // Not admin
  if (!session || session.user.role !== 'admin') {
    return null // Will redirect
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm ? (
          <UserForm
            user={editingUser}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={submitting}
            title={editingUser ? `Chỉnh sửa: ${editingUser.name}` : 'Tạo Người Dùng Mới'}
          />
        ) : managingPasswordUser ? (
          <PasswordManagement
            user={managingPasswordUser}
            onClose={handlePasswordManagementClose}
            onSuccess={handlePasswordManagementSuccess}
          />
        ) : (
          <UserList
            users={users}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateNew={handleCreateNew}
            onManagePassword={handleManagePassword}
            loading={loading}
            totalPages={totalPages}
          />
        )}
      </div>
    </MainLayout>
  )
}



