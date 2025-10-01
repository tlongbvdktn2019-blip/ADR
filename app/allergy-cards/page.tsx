// =====================================================
// ALLERGY CARDS MANAGEMENT PAGE
// Main page for listing and managing allergy cards
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SimpleSelect from '@/components/ui/SimpleSelect';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import { 
  AllergyCard, 
  AllergyCardListResponse, 
  AllergyCardFilters,
  AllergyCardStatus,
  SeverityLevel 
} from '@/types/allergy-card';

export default function AllergyCardsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [cards, setCards] = useState<AllergyCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filters state
  const [filters, setFilters] = useState<AllergyCardFilters>({
    search: '',
    status: undefined,
    hospital: '',
    doctor: '',
    severity_level: undefined,
    page: 1,
    limit: 10
  });

  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    cardId: string;
    cardCode: string;
    patientName: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    cardId: '',
    cardCode: '',
    patientName: '',
    isLoading: false
  });

  // Load cards on component mount and filter changes
  useEffect(() => {
    loadCards();
  }, [filters.page, filters.limit]);

  // Load cards with debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.page === 1) {
        loadCards();
      } else {
        setFilters(prev => ({ ...prev, page: 1 }));
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.search, filters.status, filters.hospital, filters.doctor, filters.severity_level]);

  const loadCards = async () => {
    try {
      setIsLoading(true);

      const searchParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/allergy-cards?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách thẻ dị ứng');
      }

      const data: AllergyCardListResponse = await response.json();
      setCards(data.cards);
      setPagination(data.pagination);

    } catch (error) {
      console.error('Load cards error:', error);
      toast.error('Có lỗi xảy ra khi tải danh sách thẻ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field: keyof AllergyCardFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: undefined,
      hospital: '',
      doctor: '',
      severity_level: undefined,
      page: 1,
      limit: 10
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDelete = (card: AllergyCard) => {
    setDeleteDialog({
      isOpen: true,
      cardId: card.id,
      cardCode: card.card_code,
      patientName: card.patient_name,
      isLoading: false
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteDialog(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/allergy-cards/${deleteDialog.cardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Không thể xóa thẻ');
      }

      toast.success('Đã xóa vĩnh viễn thẻ dị ứng');
      loadCards(); // Reload list
      setDeleteDialog({
        isOpen: false,
        cardId: '',
        cardCode: '',
        patientName: '',
        isLoading: false
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({
      isOpen: false,
      cardId: '',
      cardCode: '',
      patientName: '',
      isLoading: false
    });
  };

  const handlePrintCard = (cardId: string) => {
    const printUrl = `/api/allergy-cards/${cardId}/print-view`;
    window.open(printUrl, '_blank');
  };

  const getSeverityBadgeColor = (severity?: SeverityLevel) => {
    switch (severity) {
      case 'life_threatening':
        return 'bg-red-100 text-red-800';
      case 'severe':
        return 'bg-orange-100 text-orange-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'mild':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityText = (severity?: SeverityLevel) => {
    switch (severity) {
      case 'life_threatening':
        return 'Nguy hiểm';
      case 'severe':
        return 'Nghiêm trọng';
      case 'moderate':
        return 'Vừa';
      case 'mild':
        return 'Nhẹ';
      default:
        return 'Chưa xác định';
    }
  };

  const getStatusBadgeColor = (status: AllergyCardStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: AllergyCardStatus) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Vô hiệu';
      case 'expired':
        return 'Hết hạn';
      default:
        return status;
    }
  };

  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Quản lý thẻ dị ứng
                </h1>
                <p className="text-gray-600">
                  Danh sách và quản lý thẻ dị ứng của bệnh nhân
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link href="/allergy-cards/scan">
                <Button variant="outline" className="flex items-center gap-2">
                  <QrCodeIcon className="w-5 h-5" />
                  Quét QR
                </Button>
              </Link>
              
              <Link href="/allergy-cards/new">
                <Button className="flex items-center gap-2">
                  <PlusIcon className="w-5 h-5" />
                  Cấp thẻ mới
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tìm kiếm và lọc</h2>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <FunnelIcon className="w-4 h-4" />
              {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
            </Button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Tìm theo tên bệnh nhân, mã thẻ, bệnh viện..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SimpleSelect
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Vô hiệu</option>
                <option value="expired">Hết hạn</option>
              </SimpleSelect>

              <Input
                placeholder="Tên bệnh viện"
                value={filters.hospital}
                onChange={(e) => handleFilterChange('hospital', e.target.value)}
              />

              <Input
                placeholder="Tên bác sĩ"
                value={filters.doctor}
                onChange={(e) => handleFilterChange('doctor', e.target.value)}
              />

              <div className="flex gap-2">
                <SimpleSelect
                  value={filters.severity_level || ''}
                  onChange={(e) => handleFilterChange('severity_level', e.target.value || undefined)}
                >
                  <option value="">Tất cả mức độ</option>
                  <option value="mild">Nhẹ</option>
                  <option value="moderate">Vừa</option>
                  <option value="severe">Nghiêm trọng</option>
                  <option value="life_threatening">Nguy hiểm</option>
                </SimpleSelect>
                
                <Button variant="outline" onClick={clearFilters}>
                  Xóa
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Cards List */}
        <Card className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có thẻ dị ứng
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.status || filters.hospital ? 
                  'Không tìm thấy thẻ nào phù hợp với điều kiện tìm kiếm' :
                  'Bạn chưa cấp thẻ dị ứng nào'
                }
              </p>
              <Link href="/allergy-cards/new">
                <Button>Cấp thẻ đầu tiên</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Cards Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2">Mã thẻ</th>
                      <th className="text-left py-3 px-2">Bệnh nhân</th>
                      <th className="text-left py-3 px-2">Bệnh viện</th>
                      <th className="text-left py-3 px-2">Dị ứng</th>
                      <th className="text-left py-3 px-2">Trạng thái</th>
                      <th className="text-left py-3 px-2">Ngày cấp</th>
                      <th className="text-center py-3 px-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((card) => {
                      // Find highest severity level
                      const highestSeverity = card.allergies?.reduce((max, allergy) => {
                        if (!allergy.severity_level) return max;
                        const levels = ['mild', 'moderate', 'severe', 'life_threatening'];
                        const currentLevel = levels.indexOf(allergy.severity_level);
                        const maxLevel = max ? levels.indexOf(max) : -1;
                        return currentLevel > maxLevel ? allergy.severity_level : max;
                      }, undefined as SeverityLevel | undefined);

                      return (
                        <tr key={card.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <span className="font-mono text-sm">{card.card_code}</span>
                          </td>
                          
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-semibold">{card.patient_name}</p>
                              <p className="text-sm text-gray-600">
                                {card.patient_age} tuổi • {card.patient_gender === 'male' ? 'Nam' : card.patient_gender === 'female' ? 'Nữ' : 'Khác'}
                              </p>
                            </div>
                          </td>
                          
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{card.hospital_name}</p>
                              <p className="text-sm text-gray-600">{card.doctor_name}</p>
                            </div>
                          </td>
                          
                          <td className="py-3 px-2">
                            <div className="space-y-1">
                              <p className="text-sm">
                                {card.allergies?.length || 0} dị ứng
                              </p>
                              {highestSeverity && (
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityBadgeColor(highestSeverity)}`}>
                                  {getSeverityText(highestSeverity)}
                                </span>
                              )}
                            </div>
                          </td>
                          
                          <td className="py-3 px-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(card.status)}`}>
                              {getStatusText(card.status)}
                            </span>
                          </td>
                          
                          <td className="py-3 px-2 text-sm">
                            {new Date(card.issued_date).toLocaleDateString('vi-VN')}
                          </td>
                          
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <Link href={`/allergy-cards/${card.id}`}>
                                <Button variant="outline" size="sm" title="Xem chi tiết">
                                  <EyeIcon className="w-4 h-4" />
                                </Button>
                              </Link>

                              <Button 
                                variant="outline" 
                                size="sm" 
                                title="In thẻ"
                                onClick={() => handlePrintCard(card.id)}
                              >
                                <PrinterIcon className="w-4 h-4" />
                              </Button>
                              
                              <Link href={`/allergy-cards/${card.id}/edit`}>
                                <Button variant="outline" size="sm" title="Chỉnh sửa">
                                  <PencilIcon className="w-4 h-4" />
                                </Button>
                              </Link>
                              
                              {(isAdmin || card.issued_by_user_id === session?.user?.id) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Xóa vĩnh viễn"
                                  onClick={() => handleDelete(card)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} thẻ
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      Trước
                    </Button>
                    
                    <span className="flex items-center px-3 py-2 text-sm">
                      Trang {pagination.page} / {pagination.totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Tiếp
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Xóa vĩnh viễn thẻ dị ứng"
        message={`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN thẻ dị ứng "${deleteDialog.cardCode}" của bệnh nhân "${deleteDialog.patientName}"?

🗑️ Hành động này sẽ:
• Xóa hoàn toàn thẻ dị ứng khỏi hệ thống
• Xóa tất cả thông tin dị ứng liên quan
• KHÔNG THỂ HOÀN TÁC được

Vui lòng chỉ thực hiện khi thật sự cần thiết!`}
        confirmText="XÓA VĨNH VIỄN"
        cancelText="Hủy bỏ"
        isLoading={deleteDialog.isLoading}
        variant="danger"
      />
    </div>
  );
}
