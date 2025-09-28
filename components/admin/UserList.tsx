'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { User, UserFilters } from '@/types/user'
import { 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  DocumentTextIcon,
  QrCodeIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

interface UserListProps {
  users: User[]
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onCreateNew: () => void
  onManagePassword?: (user: User) => void
  loading?: boolean
  totalPages: number
}

export default function UserList({
  users,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onCreateNew,
  onManagePassword,
  loading = false,
  totalPages
}: UserListProps) {
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value,
      page: 1 // Reset to first page when searching
    })
  }

  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      role: e.target.value === '' ? undefined : e.target.value as 'admin' | 'user',
      page: 1 // Reset to first page when filtering
    })
  }

  const handlePageChange = (newPage: number) => {
    onFiltersChange({
      ...filters,
      page: newPage
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return

    setDeleting(true)
    try {
      await onDelete(deleteUser)
      setDeleteUser(null)
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setDeleting(false)
    }
  }

  const roleOptions = [
    { value: '', label: 'Tất cả vai trò' },
    { value: 'user', label: 'Người dùng' },
    { value: 'admin', label: 'Quản trị viên' },
  ]

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
                Quản lý Người dùng
              </h2>
              <Button disabled className="flex items-center opacity-50">
                <PlusIcon className="w-4 h-4 mr-2" />
                Tạo người dùng mới
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
              <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
              <div className="animate-pulse h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
        
        {/* Loading Table */}
        <Card>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổ chức</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoạt động</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="animate-pulse h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div className="ml-4 space-y-2">
                            <div className="animate-pulse h-4 w-24 bg-gray-200 rounded"></div>
                            <div className="animate-pulse h-3 w-32 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse h-4 w-32 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse h-6 w-20 bg-gray-200 rounded-full"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse h-4 w-24 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="animate-pulse h-3 w-16 bg-gray-200 rounded"></div>
                          <div className="animate-pulse h-3 w-12 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="animate-pulse h-4 w-20 bg-gray-200 rounded"></div>
                          <div className="animate-pulse h-3 w-16 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                          <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
              Quản lý Người dùng
            </h2>
            <Button
              onClick={onCreateNew}
              className="flex items-center"
              disabled={loading}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Tạo người dùng mới
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                placeholder="Tìm kiếm theo tên, email, tổ chức..."
                value={filters.search || ''}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.role || ''}
              onChange={handleRoleFilter}
              options={roleOptions}
            />
            <div className="text-sm text-gray-500 flex items-center justify-between">
              <span>
                Tổng cộng: <span className="font-medium text-gray-900">{users.length} người dùng</span>
              </span>
              {loading && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Đang tải...
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổ chức
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hoạt động
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 transition-colors duration-150"
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {/* User Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <UserCircleIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {/* Show organization on mobile */}
                          <div className="md:hidden text-xs text-gray-500 mt-1">
                            {user.organization}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Organization - Hidden on mobile */}
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.organization}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        <span className="sm:hidden">
                          {user.role === 'admin' ? (
                            <ShieldCheckIcon className="w-3 h-3" />
                          ) : (
                            <UserCircleIcon className="w-3 h-3" />
                          )}
                        </span>
                        <span className="hidden sm:flex items-center">
                          {user.role === 'admin' ? (
                            <>
                              <ShieldCheckIcon className="w-3 h-3 mr-1" />
                              Quản trị viên
                            </>
                          ) : (
                            <>
                              <UserCircleIcon className="w-3 h-3 mr-1" />
                              Người dùng
                            </>
                          )}
                        </span>
                      </span>
                    </td>

                    {/* Contact - Hidden on small screens */}
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                      {user.phone ? (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="w-4 h-4 mr-1" />
                          {user.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Activity - Hidden on small screens */}
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                      {user.statistics ? (
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center">
                            <DocumentTextIcon className="w-3 h-3 mr-1" />
                            {user.statistics.totalReports} báo cáo
                          </div>
                          <div className="flex items-center">
                            <QrCodeIcon className="w-3 h-3 mr-1" />
                            {user.statistics.totalCards} thẻ
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Created Date - Hidden on mobile */}
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(user.created_at).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(user)}
                          disabled={loading}
                          className="hidden sm:flex items-center"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Sửa
                        </Button>
                        
                        {onManagePassword && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onManagePassword(user)}
                            disabled={loading}
                            className="hidden sm:flex items-center text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <KeyIcon className="w-4 h-4 mr-1" />
                            Mật khẩu
                          </Button>
                        )}
                        
                        {/* Mobile actions - Icons only */}
                        <div className="sm:hidden flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(user)}
                            disabled={loading}
                            className="p-2"
                            title="Chỉnh sửa người dùng"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          {onManagePassword && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onManagePassword(user)}
                              disabled={loading}
                              className="text-orange-600 border-orange-200 hover:bg-orange-50 p-2"
                              title="Quản lý mật khẩu"
                            >
                              <KeyIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteUser(user)}
                            disabled={loading}
                            className="text-red-600 border-red-200 hover:bg-red-50 p-2"
                            title="Xóa người dùng"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Desktop delete button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteUser(user)}
                          disabled={loading}
                          className="hidden sm:flex items-center text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State for Table */}
            {users.length === 0 && !loading && (
              <div className="text-center py-12">
                <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Không tìm thấy người dùng nào
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {filters.search || filters.role 
                    ? 'Thử thay đổi bộ lọc tìm kiếm'
                    : 'Bắt đầu bằng cách tạo người dùng mới'
                  }
                </p>
                {!filters.search && !filters.role && (
                  <Button onClick={onCreateNew}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Tạo người dùng mới
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Trang {filters.page} / {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1 || loading}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= totalPages || loading}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa người dùng"
        message={
          deleteUser 
            ? `Bạn có chắc chắn muốn xóa người dùng ${deleteUser.name}? Hành động này không thể hoàn tác. Nếu người dùng có dữ liệu liên quan (báo cáo ADR hoặc thẻ dị ứng), việc xóa sẽ bị từ chối.`
            : ''
        }
        confirmText="Xóa người dùng"
        type="danger"
      />
    </div>
  )
}