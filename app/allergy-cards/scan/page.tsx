// =====================================================
// QR SCANNER PAGE - GOOGLE DRIVE VERSION
// Quét QR để mở file thẻ dị ứng từ Google Drive
// =====================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  QrCodeIcon, 
  ArrowLeftIcon,
  DocumentIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import QRScanner from '@/components/ui/QRScanner';

export default function QRScannerPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Xử lý quét QR (hỗ trợ mã thẻ, URL, Google Drive)
  const handleManualInput = async (qrContent: string) => {
    setIsProcessing(true);
    
    try {
      const trimmedContent = qrContent.trim();

      // 1. Kiểm tra xem có phải MÃ THẺ không (AC-YYYY-XXXXXX)
      if (/^AC-\d{4}-\d{6}$/.test(trimmedContent)) {
        toast.loading('Đang tra cứu thẻ dị ứng...');
        
        // Gọi API tra cứu thẻ bằng mã thẻ
        const response = await fetch(`/api/allergy-cards/lookup/${trimmedContent}`);
        const result = await response.json();
        
        if (response.ok && result.card) {
          toast.dismiss();
          toast.success('Đã tìm thấy thẻ dị ứng! Đang chuyển hướng...');
          
          // Hiển thị cảnh báo nếu có
          if (result.warning) {
            setTimeout(() => toast(result.warning, {
              icon: '⚠️',
              duration: 4000,
            }), 1000);
          }
          
          setTimeout(() => {
            router.push(`/allergy-cards/view/${result.card.id}`);
            setIsProcessing(false);
          }, 1000);
          return;
        } else {
          toast.dismiss();
          toast.error(result.error || 'Không tìm thấy thẻ dị ứng');
          setIsProcessing(false);
          return;
        }
      }

      // 2. Kiểm tra xem có phải URL thẻ dị ứng không
      if (trimmedContent.includes('/allergy-cards/view/')) {
        const match = trimmedContent.match(/\/allergy-cards\/view\/([a-f0-9-]+)/);
        if (match) {
          const cardId = match[1];
          toast.success('Đã quét thẻ dị ứng! Đang chuyển hướng...');
          setTimeout(() => {
            router.push(`/allergy-cards/view/${cardId}`);
            setIsProcessing(false);
          }, 500);
          return;
        }
      }

      // 3. Kiểm tra xem có phải Google Drive URL không
      if (trimmedContent.includes('drive.google.com')) {
        setScannedUrl(trimmedContent);
        toast.success('Đã quét Google Drive! Đang mở file...');
        
        setTimeout(() => {
          window.open(trimmedContent, '_blank');
          setIsProcessing(false);
        }, 1000);
        return;
      }

      // 4. Thử parse JSON (cho QR data offline)
      try {
        const data = JSON.parse(trimmedContent);
        if (data.type === 'allergy_card') {
          // Nếu có code, dùng code để tra cứu
          if (data.code) {
            handleManualInput(data.code); // Recursive call với card code
            return;
          }
          // Fallback dùng ID
          if (data.id) {
            toast.success('Đã quét thẻ dị ứng! Đang chuyển hướng...');
            setTimeout(() => {
              router.push(`/allergy-cards/view/${data.id}`);
              setIsProcessing(false);
            }, 500);
            return;
          }
        }
      } catch {
        // Not JSON, continue
      }

      // Không nhận dạng được định dạng QR
      toast.error('Mã QR không hợp lệ. Vui lòng quét mã QR của thẻ dị ứng.');
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Error processing QR:', error);
      toast.error('Có lỗi xảy ra khi xử lý mã QR');
      setIsProcessing(false);
    }
  };

  // Xử lý khi quét QR bằng camera
  const handleCameraScan = (data: string) => {
    console.log('Camera scanned:', data);
    setShowScanner(false); // Ẩn camera sau khi quét
    handleManualInput(data); // Xử lý kết quả
  };

  // Xử lý lỗi camera
  const handleScanError = (error: string) => {
    console.error('Scanner error:', error);
    toast.error(error);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Quay lại
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <QrCodeIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Quét mã QR thẻ dị ứng
          </h1>
        </div>
        <p className="text-gray-600">
          Quét mã QR để xem thông tin thẻ dị ứng hoặc file từ Google Drive
        </p>
        </div>

        {/* Info Card */}
        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <DocumentIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Cách sử dụng
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Quét QR trên thẻ:</strong> Dùng camera điện thoại quét mã QR</li>
                <li>• <strong>Hoặc nhập mã thẻ:</strong> Nhập mã thẻ (ví dụ: AC-2024-000001) vào ô bên dưới</li>
                <li>• Hệ thống sẽ tự động tra cứu và hiển thị thông tin dị ứng</li>
                <li>• QR code chứa mã thẻ để dễ dàng tra cứu nhanh trong trường hợp khẩn cấp</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Scanner Section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Quét mã QR bằng camera</h2>
            {!showScanner && (
              <Button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-2"
              >
                <QrCodeIcon className="w-5 h-5" />
                Bật camera
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Camera Scanner - NOW IMPLEMENTED */}
            {showScanner ? (
              <QRScanner 
                onScan={handleCameraScan}
                onError={handleScanError}
              />
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <QrCodeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Nhấn "Bật camera" để bắt đầu quét QR
                </p>
                <p className="text-sm text-gray-500">
                  Camera sẽ tự động phát hiện và quét mã QR trên thẻ dị ứng
                </p>
              </div>
            )}

            <div className="text-center text-gray-500 text-sm">
              hoặc
            </div>

            {/* Manual Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập mã thẻ hoặc link từ QR
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="VD: AC-2024-000001 hoặc dán link từ QR"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    if (pastedText) {
                      setTimeout(() => handleManualInput(pastedText), 100);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      handleManualInput(e.currentTarget.value);
                    }
                  }}
                  disabled={isProcessing}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Nhập mã thẻ dị ứng (định dạng: AC-YYYY-XXXXXX) hoặc dán link và nhấn Enter
              </p>
            </div>
          </div>
        </Card>

        {/* Result */}
        {scannedUrl && (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <DocumentIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">
                  Đã quét thành công!
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  Link: {scannedUrl}
                </p>
                <Button
                  onClick={() => window.open(scannedUrl, '_blank')}
                  className="flex items-center gap-2"
                >
                  <DocumentIcon className="w-4 h-4" />
                  Mở file thẻ dị ứng
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Warning */}
        <Card className="p-6 mt-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                Lưu ý quan trọng
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• File thẻ dị ứng được lưu trữ an toàn trên Google Drive</li>
                <li>• Đảm bảo có kết nối internet để xem file</li>
                <li>• Nếu không mở được file, kiểm tra quyền truy cập</li>
                <li>• Liên hệ bác sĩ điều trị nếu cần hỗ trợ</li>
              </ul>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
