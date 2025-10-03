'use client'

import { useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { 
  ArrowUpTrayIcon, 
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface ImportResult {
  total_rows: number
  inserted: number
  errors: number
  error_details: string[]
}

interface QuizImportExcelProps {
  onSuccess?: () => void
  onClose?: () => void
}

export default function QuizImportExcel({ onSuccess, onClose }: QuizImportExcelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)')
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/quiz/import')
      
      if (!response.ok) {
        throw new Error('Không thể tải template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'template-cau-hoi-adr.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Đã tải template thành công')
    } catch (error) {
      console.error('Download template error:', error)
      toast.error('Không thể tải template')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Vui lòng chọn file')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/quiz/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi upload file')
      }

      setResult(data.data)
      
      if (data.data.inserted > 0) {
        toast.success(data.message || `Import thành công ${data.data.inserted} câu hỏi`)
        
        // Call onSuccess after a delay to show result first
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      } else {
        toast.error('Không có câu hỏi nào được import')
      }

    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Lỗi khi upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import Câu hỏi từ Excel</h2>
            <p className="text-sm text-gray-600 mt-1">
              Tải lên file Excel để thêm hàng loạt câu hỏi vào ngân hàng câu hỏi
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Hướng dẫn:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tải template Excel mẫu bằng nút bên dưới</li>
                <li>Điền thông tin câu hỏi vào file Excel theo mẫu</li>
                <li>Đảm bảo danh mục đã tồn tại trong hệ thống</li>
                <li>Độ khó phải là: beginner, intermediate, advanced, hoặc expert</li>
                <li>Đáp án đúng phải là A, B, C, hoặc D (viết hoa)</li>
                <li>Upload file và kiểm tra kết quả</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Download Template Button */}
        <div className="mb-6">
          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="w-full"
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Tải Template Excel Mẫu
          </Button>
        </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn file Excel
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="excel-file-input"
            />
            <label
              htmlFor="excel-file-input"
              className="flex-1 cursor-pointer"
            >
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">
                      Click để chọn file hoặc kéo thả file vào đây
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Hỗ trợ .xlsx và .xls
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                Upload và Import
              </>
            )}
          </Button>
          {file && !uploading && (
            <Button
              onClick={handleReset}
              variant="outline"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Import Result */}
        {result && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Kết quả Import</h3>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Tổng số dòng</p>
                  <p className="text-2xl font-bold text-blue-900">{result.total_rows}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Import thành công</p>
                  <p className="text-2xl font-bold text-green-900">{result.inserted}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 font-medium">Có lỗi</p>
                  <p className="text-2xl font-bold text-red-900">{result.errors}</p>
                </div>
              </div>

              {/* Success Message */}
              {result.inserted > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Đã thêm thành công {result.inserted} câu hỏi vào ngân hàng câu hỏi!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {result.error_details && result.error_details.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start mb-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-sm font-semibold text-yellow-800">
                      Chi tiết lỗi ({result.errors} lỗi):
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {result.error_details.map((error, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}



