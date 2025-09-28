// =====================================================
// QR SCANNER PAGE FOR ALLERGY CARDS
// Page for scanning QR codes and displaying allergy information
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import toast from 'react-hot-toast';
import { 
  QrCodeIcon, 
  ExclamationTriangleIcon,
  PhoneIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { QRCodeData, QRScanResult } from '@/types/allergy-card';

export default function QRScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  const [allergyData, setAllergyData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);

  // Check camera permission on component mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCamera(true);
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasCamera(false);
      toast.error('Không thể truy cập camera. Vui lòng cấp quyền camera.');
    }
  };

  const handleScan = async (result: string) => {
    if (!result || isLoading) return;

    setIsLoading(true);
    setIsScanning(false);

    try {
      // Try to parse as JSON first (QR data from our system)
      let qrData: QRCodeData;
      
      try {
        qrData = JSON.parse(result);
        
        // Validate if it's our allergy card QR
        if (!qrData.cardCode || !qrData.cardCode.startsWith('AC-')) {
          throw new Error('Not an allergy card QR');
        }
        
      } catch (parseError) {
        // If not JSON, treat as card code and fetch from API
        const cardCode = result.trim().toUpperCase();
        
        if (!cardCode.match(/^AC-\d{4}-\d{6}$/)) {
          toast.error('Mã QR không phải là mã thẻ dị ứng hợp lệ');
          setIsLoading(false);
          return;
        }

        // Fetch card data from API
        const response = await fetch(`/api/allergy-cards/verify/${cardCode}`);
        const apiResult = await response.json();
        
        if (!apiResult.success || !apiResult.data) {
          toast.error(apiResult.error || 'Không thể xác thực thẻ dị ứng');
          setIsLoading(false);
          return;
        }
        
        qrData = apiResult.data;
      }

      // Verify data with API for extra security
      const verifyResponse = await fetch(`/api/allergy-cards/verify/${qrData.cardCode}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData: JSON.stringify(qrData) }),
      });

      const verifyResult = await verifyResponse.json();
      
      if (!verifyResult.success) {
        toast.error(verifyResult.error || 'Thẻ dị ứng không hợp lệ');
        setScanResult(verifyResult);
        setIsLoading(false);
        return;
      }

      // Success - display allergy information
      setAllergyData(qrData);
      setScanResult(verifyResult);
      toast.success('Đã quét thành công thẻ dị ứng!');
      
      // Play sound for emergency alert if severe allergies
      const hasSevereAllergy = qrData.allergies.some(a => 
        a.severity === 'severe' || a.severity === 'life_threatening'
      );
      
      if (hasSevereAllergy) {
        // Could add audio alert here
        toast.error('⚠️ CẢNH BÁO: Bệnh nhân có dị ứng nghiêm trọng!', {
          duration: 8000
        });
      }

    } catch (error) {
      console.error('QR scan error:', error);
      toast.error('Có lỗi xảy ra khi xử lý mã QR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: unknown) => {
    console.error('QR Scanner error:', error);
    toast.error('Lỗi khi quét mã QR');
  };

  const startScanning = () => {
    setScanResult(null);
    setAllergyData(null);
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const resetScanner = () => {
    setScanResult(null);
    setAllergyData(null);
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
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
            Quét mã QR trên thẻ dị ứng để xem thông tin dị ứng khẩn cấp của bệnh nhân
          </p>
        </div>

        {/* Scanner Section */}
        {!allergyData && (
          <Card className="p-6 mb-6">
            <div className="text-center">
              {!hasCamera ? (
                <div className="py-8">
                  <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Không thể truy cập camera</h3>
                  <p className="text-gray-600 mb-4">
                    Vui lòng cấp quyền camera để quét mã QR
                  </p>
                  <Button onClick={checkCameraPermission}>
                    Thử lại
                  </Button>
                </div>
              ) : !isScanning ? (
                <div className="py-8">
                  <QrCodeIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sẵn sàng quét mã QR</h3>
                  <p className="text-gray-600 mb-4">
                    Nhấn nút bên dưới để bắt đầu quét mã QR trên thẻ dị ứng
                  </p>
                  <Button onClick={startScanning} className="flex items-center gap-2 mx-auto">
                    <QrCodeIcon className="w-5 h-5" />
                    Bắt đầu quét
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <Scanner
                      onScan={(detectedCodes) => {
                        if (detectedCodes && detectedCodes.length > 0) {
                          handleScan(detectedCodes[0].rawValue);
                        }
                      }}
                      onError={handleError}
                      constraints={{
                        facingMode: 'environment'
                      }}
                      styles={{
                        container: {
                          width: '100%',
                          maxWidth: '400px',
                          margin: '0 auto'
                        },
                        video: {
                          width: '100%',
                          height: 'auto'
                        }
                      }}
                    />
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <LoadingSpinner size="sm" />
                      <span>Đang xử lý mã QR...</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={stopScanning}>
                      Dừng quét
                    </Button>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    Hướng camera về phía mã QR trên thẻ dị ứng
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Scan Results */}
        {scanResult && !scanResult.success && (
          <Card className="p-6 mb-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Lỗi quét mã QR</h3>
                <p className="text-red-700">{scanResult.error}</p>
                <Button 
                  variant="outline" 
                  onClick={resetScanner}
                  className="mt-3"
                >
                  Quét lại
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Allergy Information Display */}
        {allergyData && (
          <div className="space-y-6">
            
            {/* Emergency Alert */}
            {allergyData.allergies.some(a => a.severity === 'severe' || a.severity === 'life_threatening') && (
              <Card className="p-6 border-red-200 bg-red-50">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-600 flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-bold text-red-900 mb-2">
                      ⚠️ CẢNH BÁO DỊ ỨNG NGHIÊM TRỌNG
                    </h2>
                    <p className="text-red-800 font-medium">
                      Bệnh nhân có dị ứng nghiêm trọng. Cần cẩn thận khi sử dụng thuốc!
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Patient Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <InformationCircleIcon className="w-6 h-6 text-blue-600" />
                Thông tin bệnh nhân
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Họ tên</label>
                  <p className="text-lg font-semibold">{allergyData.patientName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Tuổi</label>
                  <p className="text-lg">{allergyData.patientAge}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Giới tính</label>
                  <p className="text-lg">
                    {allergyData.patientGender === 'male' ? 'Nam' : 
                     allergyData.patientGender === 'female' ? 'Nữ' : 'Khác'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Mã thẻ</label>
                  <p className="text-lg font-mono">{allergyData.cardCode}</p>
                </div>
              </div>
            </Card>

            {/* Allergy Details */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-6 h-6 text-orange-600" />
                Thông tin dị ứng
              </h2>
              
              <div className="space-y-4">
                {allergyData.allergies.map((allergy, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      allergy.severity === 'severe' || allergy.severity === 'life_threatening' 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{allergy.name}</h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          allergy.certainty === 'confirmed' 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {allergy.certainty === 'confirmed' ? 'Chắc chắn' : 'Nghi ngờ'}
                        </span>
                        
                        {allergy.severity && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            allergy.severity === 'life_threatening' ? 'bg-red-200 text-red-900' :
                            allergy.severity === 'severe' ? 'bg-orange-200 text-orange-900' :
                            allergy.severity === 'moderate' ? 'bg-yellow-200 text-yellow-900' :
                            'bg-green-200 text-green-900'
                          }`}>
                            {
                              allergy.severity === 'life_threatening' ? 'Nguy hiểm' :
                              allergy.severity === 'severe' ? 'Nghiêm trọng' :
                              allergy.severity === 'moderate' ? 'Vừa' : 'Nhẹ'
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {allergy.symptoms && (
                      <p className="text-gray-700">{allergy.symptoms}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Emergency Contact */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <PhoneIcon className="w-6 h-6 text-green-600" />
                Liên hệ khẩn cấp
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Bác sĩ điều trị</label>
                  <p className="text-lg font-semibold">{allergyData.doctorName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Bệnh viện</label>
                  <p className="text-lg">{allergyData.hospitalName}</p>
                </div>
                
                {allergyData.doctorPhone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-mono">{allergyData.doctorPhone}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${allergyData.doctorPhone}`)}
                        className="flex items-center gap-1"
                      >
                        <PhoneIcon className="w-4 h-4" />
                        Gọi
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 font-medium">
                    {allergyData.emergencyInstructions}
                  </p>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <Button onClick={resetScanner} variant="outline">
                Quét thẻ khác
              </Button>
              
              <Button 
                onClick={() => window.open(allergyData.verificationUrl, '_blank')}
                variant="outline"
              >
                Xem thông tin đầy đủ
              </Button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
