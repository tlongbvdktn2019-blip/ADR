// =====================================================
// EDIT ALLERGY CARD PAGE
// Page for editing existing allergy cards
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { AllergyCardForm } from '@/components/forms/AllergyCardForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AllergyCard } from '@/types/allergy-card';
import Link from 'next/link';

interface EditAllergyCardPageProps {
  params: {
    id: string;
  };
}

export default function EditAllergyCardPage({ params }: EditAllergyCardPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [card, setCard] = useState<AllergyCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCard();
  }, [params.id]);

  const loadCard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/allergy-cards/${params.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tải thông tin thẻ');
      }

      const data = await response.json();
      
      // Check permissions
      const isAdmin = (session?.user as any)?.role === 'admin';
      const isOwner = data.card.issued_by_user_id === session?.user?.id;
      
      if (!isAdmin && !isOwner) {
        throw new Error('Bạn không có quyền chỉnh sửa thẻ này');
      }
      
      setCard(data.card);

    } catch (error) {
      console.error('Load card error:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không thể chỉnh sửa</h3>
            <p className="text-gray-600 mb-4">
              {error || 'Thẻ không tồn tại hoặc bạn không có quyền chỉnh sửa'}
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/allergy-cards">
                <Button variant="outline">Quay lại danh sách</Button>
              </Link>
              {card && (
                <Link href={`/allergy-cards/${card.id}`}>
                  <Button>Xem chi tiết</Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AllergyCardForm 
        mode="edit"
        initialData={card}
      />
    </div>
  );
}
