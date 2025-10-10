'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface PreventabilityCriteria {
  id: string
  category: string
  question: string
  rowspan?: number
}

interface PreventabilityAssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (result: string) => void
  initialValue?: string
}

export default function PreventabilityAssessmentModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialValue = ''
}: PreventabilityAssessmentModalProps) {
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no' | 'unknown' | 'na'>>({})

  const criteria: PreventabilityCriteria[] = [
    { id: 'q1', category: 'Thực hành chuyên môn "Pr"', question: '1. Liều không phù hợp?', rowspan: 16 },
    { id: 'q2', category: '', question: '2. Đường dùng không phù hợp?' },
    { id: 'q3', category: '', question: '3. Thời gian sử dụng thuốc không phù hợp?' },
    { id: 'q4', category: '', question: '4. Sử dụng dạng thuốc không phù hợp?' },
    { id: 'q5', category: '', question: '5. Sử dụng thuốc hết hạn?' },
    { id: 'q6', category: '', question: '6. Bảo quản thuốc không phù hợp?' },
    { id: 'q7', category: '', question: '7. Cách dùng không phù hợp (thời gian, tốc độ, tần suất, kỹ thuật, pha chế, thao tác, trộn lẫn)?' },
    { id: 'q8', category: '', question: '8. Chỉ định không phù hợp?' },
    { id: 'q9', category: '', question: '9. Không phù hợp với đặc điểm của người bệnh (tuổi, giới, phụ nữ mang thai, khác)?' },
    { id: 'q10', category: '', question: '10. Không phù hợp với tình trạng lâm sàng (suy thận, suy gan…) hoặc bệnh lý đang có của người bệnh?' },
    { id: 'q11', category: '', question: '11. Có tiền sử quá mẫn với thuốc hoặc các thuốc khác trong nhóm?' },
    { id: 'q12', category: '', question: '12. Tương tác thuốc-thuốc?' },
    { id: 'q13', category: '', question: '13. Trùng lặp điều trị (kê đơn 2 hay nhiều thuốc có thành phần tương tự nhau)?' },
    { id: 'q14', category: '', question: '14. Không sử dụng thuốc cần dùng?' },
    { id: 'q15', category: '', question: '15. Hội chứng cai thuốc (do ngừng thuốc đột ngột)?' },
    { id: 'q16', category: '', question: '16. Xét nghiệm hoặc theo dõi lâm sàng không phù hợp?' },
    { id: 'q17', category: 'Chế phẩm/ thuốc "Pd"', question: '17. Đã sử dụng thuốc nghi ngờ kém chất lượng?', rowspan: 2 },
    { id: 'q18', category: '', question: '18. Đã sử dụng thuốc nghi ngờ là giả?' },
    { id: 'q19', category: 'Người bệnh "Pa"', question: '19. Không tuân thủ điều trị?', rowspan: 2 },
    { id: 'q20', category: '', question: '20. Người bệnh tự ý dùng thuốc kê đơn?' },
  ]

  const handleAnswer = (questionId: string, answer: 'yes' | 'no' | 'unknown' | 'na') => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const calculateResult = (): string => {
    const yesAnswers = Object.entries(answers).filter(([_, value]) => value === 'yes')
    
    if (yesAnswers.length > 0) {
      return 'Có thể phòng tránh được'
    } else if (Object.keys(answers).length === criteria.length) {
      const hasUnknown = Object.values(answers).some(v => v === 'unknown')
      if (hasUnknown) {
        return 'Không đánh giá được (Thiếu thông tin)'
      }
      return 'Không thể phòng tránh được'
    }
    
    return 'Chưa hoàn thành đánh giá'
  }

  const handleSave = () => {
    const result = calculateResult()
    
    if (result === 'Chưa hoàn thành đánh giá') {
      if (!confirm('Bạn chưa hoàn thành tất cả các câu hỏi. Bạn có muốn lưu kết quả hiện tại không?')) {
        return
      }
    }

    // Build detailed result
    const yesAnswers = Object.entries(answers)
      .filter(([_, value]) => value === 'yes')
      .map(([id]) => {
        const q = criteria.find(c => c.id === id)
        return q?.question
      })
      .filter(Boolean)

    let detailedResult = `Kết quả: ${result}\n\n`
    
    if (yesAnswers.length > 0) {
      detailedResult += `Các tiêu chí xác định được (trả lời "Có"):\n${yesAnswers.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    }

    onSave(detailedResult)
    onClose()
  }

  if (!isOpen) return null

  // Group criteria for rendering
  let currentCategory = ''
  let categoryRowIndex = 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Bảng đánh giá khả năng phòng tránh được của ADR
            </h2>
            <p className="text-sm text-indigo-100 mt-1">(theo phương pháp P của Tổ chức Y tế Thế giới)</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-indigo-700 rounded-lg p-2 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {/* Introduction */}
          <div className="prose max-w-none text-gray-700 dark:text-gray-300 space-y-3 mb-6 text-sm">
            <p>
              Phương pháp P được áp dụng để phát hiện một cách hệ thống các sai sót liên quan đến thuốc. 
              Câu trả lời "có" cho bất kỳ tiêu chí nào được coi là ADR xảy ra có thể "phòng tránh được".
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Các yếu tố liên quan
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Các tiêu chí về khả năng phòng tránh được
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Có
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Không
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Không rõ
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Không áp dụng
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {criteria.map((item, index) => {
                  const showCategory = item.category && item.category !== currentCategory
                  if (showCategory) {
                    currentCategory = item.category
                    categoryRowIndex = index
                  }

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {showCategory && (
                        <td 
                          className="border border-gray-300 dark:border-gray-600 p-3 align-top font-medium text-gray-800 dark:text-gray-200" 
                          rowSpan={item.rowspan}
                        >
                          {item.category}
                        </td>
                      )}
                      <td className="border border-gray-300 dark:border-gray-600 p-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.question}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                        <input
                          type="radio"
                          name={item.id}
                          checked={answers[item.id] === 'yes'}
                          onChange={() => handleAnswer(item.id, 'yes')}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                        <input
                          type="radio"
                          name={item.id}
                          checked={answers[item.id] === 'no'}
                          onChange={() => handleAnswer(item.id, 'no')}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                        <input
                          type="radio"
                          name={item.id}
                          checked={answers[item.id] === 'unknown'}
                          onChange={() => handleAnswer(item.id, 'unknown')}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                        <input
                          type="radio"
                          name={item.id}
                          checked={answers[item.id] === 'na'}
                          onChange={() => handleAnswer(item.id, 'na')}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Result Preview */}
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Kết quả đánh giá:
            </h3>
            <p className="text-base font-medium text-indigo-700 dark:text-indigo-300">
              {calculateResult()}
            </p>
          </div>
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




