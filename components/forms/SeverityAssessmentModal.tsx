'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface SeverityLevel {
  id: number
  name: string
  description: string
  style: string
}

interface SeverityAssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (result: string) => void
  initialValue?: string
}

export default function SeverityAssessmentModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialValue = ''
}: SeverityAssessmentModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<SeverityLevel | null>(null)

  const levels: SeverityLevel[] = [
    { 
      id: 1, 
      name: 'Mức độ 1 (Nhẹ)', 
      description: 'Không có triệu chứng hoặc triệu chứng nhẹ; chỉ biết được thông qua quan sát để chẩn đoán hoặc biểu hiện lâm sàng; không cần đến can thiệp.', 
      style: 'text-gray-900 dark:text-white' 
    },
    { 
      id: 2, 
      name: 'Mức độ 2 (Trung bình)', 
      description: 'Cần đến can thiệp tối thiểu, tại chỗ hoặc không xâm lấn; ảnh hưởng đến một số chức năng vận động hoặc sinh hoạt thông thường.', 
      style: 'text-gray-900 dark:text-white' 
    },
    { 
      id: 3, 
      name: 'Mức độ 3 (Nặng)', 
      description: 'Ảnh hưởng đáng kể trên lâm sàng nhưng chưa đến mức đe dọa tính mạng; khiến người bệnh phải nhập viện hoặc kéo dài thời gian nằm viện; bị dị tật; giới hạn khả năng tự chăm sóc bản thân của người bệnh.', 
      style: 'text-gray-900 dark:text-white' 
    },
    { 
      id: 4, 
      name: 'Mức độ 4 (Đe dọa tính mạng)', 
      description: 'Gây ra hậu quả đe dọa tính mạng người bệnh; cần can thiệp khẩn cấp.', 
      style: 'text-red-600 dark:text-red-400 font-bold' 
    },
    { 
      id: 5, 
      name: 'Mức độ 5 (Tử vong)', 
      description: 'Tử vong liên quan đến biến cố bất lợi.', 
      style: 'text-black dark:text-gray-300 bg-red-200 dark:bg-red-900 px-2 py-1 rounded' 
    }
  ]

  const handleRowClick = (level: SeverityLevel) => {
    setSelectedLevel(level)
  }

  const handleSave = () => {
    if (!selectedLevel) {
      alert('Vui lòng chọn một mức độ đánh giá từ bảng.')
      return
    }
    
    const result = `${selectedLevel.name}: ${selectedLevel.description}`
    onSave(result)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-blue-600 dark:bg-blue-700 flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Đánh giá mức độ nặng của biến cố bất lợi
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 dark:hover:bg-blue-800 rounded-lg p-2 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">
                    Mức độ đánh giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Mô tả chi tiết
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Chọn
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {levels.map((level) => (
                  <tr
                    key={level.id}
                    onClick={() => handleRowClick(level)}
                    className={`cursor-pointer transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedLevel?.id === level.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${level.style}`}>{level.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {level.description}
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input
                        type="radio"
                        name="selected_level"
                        checked={selectedLevel?.id === level.id}
                        onChange={() => handleRowClick(level)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected Level Display */}
          {selectedLevel && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mức độ đã chọn
              </label>
              <input
                type="text"
                value={selectedLevel.name}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave}>
            Lưu Đánh Giá
          </Button>
        </div>
      </div>
    </div>
  )
}




