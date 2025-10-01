// =====================================================
// QR SCANNER COMPONENT
// Camera-based QR code scanner using html5-qrcode
// =====================================================

'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Button from './Button';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isInitializedRef = useRef(false);

  // Get available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera (environment) for mobile
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        onError?.('KhĂ´ng thá»ƒ truy cáº­p camera. Vui lĂ²ng cho phĂ©p quyá»n camera.');
      });
  }, [onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup khi component unmount
      if (scannerRef.current) {
        try {
          // getState() is synchronous, returns a number directly
          const state = scannerRef.current.getState();
          
          // Chá»‰ dá»«ng náº¿u Ä‘ang SCANNING (2) hoáº·c PAUSED (3)
          if (state === 2 || state === 3) {
            scannerRef.current.stop()
              .then(() => {
                console.log('Scanner cleaned up successfully');
              })
              .catch((err) => {
                // Bá» qua hoĂ n toĂ n cĂ¡c lá»—i "not running" hoáº·c "paused"
                const errorMsg = err?.message?.toLowerCase() || '';
                if (!errorMsg.includes('not running') && !errorMsg.includes('paused')) {
                  console.error('Cleanup error:', err);
                }
              });
          } else {
            // State khĂ¡c -> khĂ´ng cáº§n dá»«ng
            console.log('Scanner cleanup: scanner not running, no need to stop');
          }
        } catch (err) {
          console.error('Error checking scanner state:', err);
        }
      }
    };
  }, []); // Empty dependency - cleanup chá»‰ cháº¡y khi unmount

  const startScanning = async () => {
    if (!selectedCamera) {
      onError?.('KhĂ´ng tĂ¬m tháº¥y camera');
      return;
    }

    // Set isScanning NGAY Ä‘á»ƒ hiá»ƒn thá»‹ div qr-reader
    setIsScanning(true);

    try {
      // Dá»«ng scanner cÅ© náº¿u Ä‘ang cháº¡y
      if (scannerRef.current) {
        try {
          // getState() is synchronous, returns a number directly
          const state = scannerRef.current.getState();
          if (state === 2 || state === 3) {
            await scannerRef.current.stop();
          }
        } catch (e) {
          // Ignore error, will create new instance
        }
      }

      // Initialize scanner
      if (!scannerRef.current || isInitializedRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
        isInitializedRef.current = false;
      }

      console.log('Starting camera with:', selectedCamera);

      // Start scanning
      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // QR box size
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          console.log('QR Code detected:', decodedText);
          onScan(decodedText);
          stopScanning(); // Auto stop after successful scan
        },
        (errorMessage) => {
          // Error callback (usually just scanning, not actual error)
          // Ignore this as it fires constantly while scanning
        }
      );

      console.log('Camera started successfully');
      isInitializedRef.current = true;
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      onError?.(err?.message || 'KhĂ´ng thá»ƒ khá»Ÿi Ä‘á»™ng camera');
      setIsScanning(false); // Reset state náº¿u lá»—i
    }
  };

  const stopScanning = async () => {
    if (!scannerRef.current) {
      setIsScanning(false);
      return;
    }

    try {
      // getState() is synchronous, returns a number directly
      const state = scannerRef.current.getState();
      
      // Chá»‰ dá»«ng náº¿u scanner Ä‘ang SCANNING hoáº·c PAUSED
      if (state === 2 || state === 3) { // 2 = SCANNING, 3 = PAUSED
        await scannerRef.current.stop();
        console.log('Scanner stopped successfully');
      }
      
      setIsScanning(false);
    } catch (err: any) {
      console.error('Error stopping scanner:', err);
      // Ignore "not running" errors
      if (!err.message?.includes('not running') && !err.message?.includes('paused')) {
        onError?.(err.message || 'Lá»—i khi dá»«ng camera');
      }
      setIsScanning(false);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;

    // Stop current scanner
    await stopScanning();

    // Switch to next camera
    const currentIndex = cameras.findIndex(c => c.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCamera(cameras[nextIndex].id);

    // Restart with new camera
    setTimeout(() => {
      startScanning();
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Camera Preview */}
      <div className="relative">
        {/* QR Reader - Always present in DOM, just hidden with CSS */}
        <div 
          id="qr-reader" 
          className="rounded-lg overflow-hidden"
          style={{ 
            width: '100%', 
            maxWidth: '500px', 
            margin: '0 auto',
            display: isScanning ? 'block' : 'none'
          }}
        />
        
        {!isScanning && (
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Nháº¥n nĂºt bĂªn dÆ°á»›i Ä‘á»ƒ báº¯t Ä‘áº§u quĂ©t
            </p>
            <p className="text-sm text-gray-500">
              Camera sáº½ tá»± Ä‘á»™ng quĂ©t mĂ£ QR trĂªn tháº» dá»‹ á»©ng
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!isScanning ? (
          <Button
            onClick={startScanning}
            disabled={cameras.length === 0}
            className="flex items-center gap-2"
          >
            <CameraIcon className="w-5 h-5" />
            Báº¯t Ä‘áº§u quĂ©t
          </Button>
        ) : (
          <>
            <Button
              onClick={stopScanning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <XMarkIcon className="w-5 h-5" />
              Dá»«ng quĂ©t
            </Button>
            
            {cameras.length > 1 && (
              <Button
                onClick={switchCamera}
                variant="outline"
              >
                đŸ”„ Äá»•i camera
              </Button>
            )}
          </>
        )}
      </div>

      {/* Camera info */}
      {cameras.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Camera: {cameras.find(c => c.id === selectedCamera)?.label || 'Unknown'}
        </p>
      )}

      {/* No camera warning */}
      {cameras.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            â ï¸ KhĂ´ng tĂ¬m tháº¥y camera. Vui lĂ²ng:
          </p>
          <ul className="text-xs text-yellow-700 mt-2 ml-4 space-y-1">
            <li>â€¢ Cho phĂ©p quyá»n truy cáº­p camera trong trĂ¬nh duyá»‡t</li>
            <li>â€¢ Kiá»ƒm tra camera cĂ³ hoáº¡t Ä‘á»™ng khĂ´ng</li>
            <li>â€¢ Thá»­ trĂªn trĂ¬nh duyá»‡t khĂ¡c (Chrome, Safari)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
