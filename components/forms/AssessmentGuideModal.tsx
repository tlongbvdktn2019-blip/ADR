'use client'

import { Fragment, useState, useMemo } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, BookOpenIcon, CalculatorIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

interface AssessmentGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

interface NaranjoQuestion {
  id: number
  question: string
  yesScore: number
  noScore: number
  unknownScore: number
}

const naranjoQuestions: NaranjoQuestion[] = [
  { id: 1, question: 'Phản ứng có được mô tả trước đó trong y văn không?', yesScore: 1, noScore: 0, unknownScore: 0 },
  { id: 2, question: 'Phản ứng có xuất hiện sau khi điều trị bằng thuốc nghi ngờ không?', yesScore: 2, noScore: -1, unknownScore: 0 },
  { id: 3, question: 'Phản ứng có được cải thiện sau khi ngừng thuốc hoặc dùng chất đối kháng không?', yesScore: 1, noScore: 0, unknownScore: 0 },
  { id: 4, question: 'Phản ứng có tái xuất hiện khi dùng lại thuốc không?', yesScore: 2, noScore: -1, unknownScore: 0 },
  { id: 5, question: 'Có nguyên nhân nào khác (trừ thuốc nghi ngờ) có thể là nguyên nhân gây ra phản ứng không?', yesScore: -1, noScore: 2, unknownScore: 0 },
  { id: 6, question: 'Phản ứng có xuất hiện khi dùng giả dược (placebo) không?', yesScore: -1, noScore: 1, unknownScore: 0 },
  { id: 7, question: 'Nồng độ thuốc trong máu (hay các dịch sinh học khác) có ở ngưỡng gây độc không?', yesScore: 1, noScore: 0, unknownScore: 0 },
  { id: 8, question: 'Phản ứng có nghiêm trọng hơn khi tăng liều hoặc ít nghiêm trọng hơn khi giảm liều không?', yesScore: 1, noScore: 0, unknownScore: 0 },
  { id: 9, question: 'Người bệnh có gặp phản ứng tương tự với thuốc nghi ngờ hoặc các thuốc tương tự trước đó không?', yesScore: 1, noScore: 0, unknownScore: 0 },
  { id: 10, question: 'Phản ứng có được xác nhận bằng các bằng chứng khách quan (xét nghiệm, chẩn đoán hình ảnh) không?', yesScore: 1, noScore: 0, unknownScore: 0 },
]

export default function AssessmentGuideModal({ isOpen, onClose }: AssessmentGuideModalProps) {
  // State for Naranjo calculator
  const [naranjoAnswers, setNaranjoAnswers] = useState<{ [key: number]: 'yes' | 'no' | 'unknown' | null }>({})
  
  // Calculate total score
  const totalScore = useMemo(() => {
    let score = 0
    naranjoQuestions.forEach(q => {
      const answer = naranjoAnswers[q.id]
      if (answer === 'yes') score += q.yesScore
      else if (answer === 'no') score += q.noScore
      else if (answer === 'unknown') score += q.unknownScore
    })
    return score
  }, [naranjoAnswers])
  
  // Get conclusion based on score
  const getConclusion = (score: number): { text: string; color: string; bgColor: string } => {
    if (score >= 9) return { text: 'Chắc chắn', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300' }
    if (score >= 5) return { text: 'Có khả năng', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300' }
    if (score >= 1) return { text: 'Có thể', color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-300' }
    return { text: 'Nghi ngờ', color: 'text-gray-700', bgColor: 'bg-gray-100 border-gray-300' }
  }
  
  // Handle answer change
  const handleAnswerChange = (questionId: number, answer: 'yes' | 'no' | 'unknown') => {
    setNaranjoAnswers(prev => ({
      ...prev,
      [questionId]: prev[questionId] === answer ? null : answer
    }))
  }
  
  // Reset calculator
  const resetCalculator = () => {
    setNaranjoAnswers({})
  }
  
  const conclusion = getConclusion(totalScore)
  const hasAnswers = Object.keys(naranjoAnswers).length > 0
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <BookOpenIcon className="w-6 h-6 text-white" />
                      <Dialog.Title className="text-lg font-semibold text-white">
                        Hướng dẫn đánh giá Mối liên quan thuốc và ADR
                      </Dialog.Title>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <div className="prose prose-sm max-w-none">
                    {/* Introduction */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
                      <p className="text-sm text-blue-900 leading-relaxed">
                        Một biến cố bất lợi xảy ra trong quá trình điều trị có thể có liên quan đến bệnh lý hoặc thuốc đang sử dụng của người bệnh. 
                        Việc xác định rõ nguyên nhân gây ra ADR là quy trình phức tạp, cần thu thập đầy đủ thông tin về người bệnh, về phản ứng có hại, 
                        về thuốc nghi ngờ và các thuốc dùng đồng thời. Có hai thang đánh giá được sử dụng phổ biến nhất hiện nay là <strong>thang WHO-UMC</strong> và <strong>thang Naranjo</strong>.
                      </p>
                    </div>

                    {/* WHO-UMC Scale */}
                    <section className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
                        Thang phân loại của Tổ chức Y tế thế giới (WHO-UMC)
                      </h3>
                      
                      <p className="text-gray-700 mb-4">
                        Mối quan hệ giữa thuốc nghi ngờ và ADR được phân thành 6 mức độ. Để xếp loại mối quan hệ ở mức độ nào, 
                        cần thỏa mãn <strong>tất cả</strong> các tiêu chuẩn đánh giá đã được quy định tương ứng với mức độ đó.
                      </p>

                      <div className="space-y-4">
                        {/* Certain */}
                        <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                          <h4 className="font-bold text-green-900 mb-2">✓ Chắc chắn (Certain)</h4>
                          <ul className="space-y-1 text-sm text-green-800">
                            <li>• Phản ứng có mối liên hệ chặt chẽ với thời gian sử dụng thuốc nghi ngờ</li>
                            <li>• Phản ứng không thể giải thích bằng bệnh lý hoặc thuốc khác sử dụng đồng thời</li>
                            <li>• Cải thiện khi ngừng sử dụng thuốc nghi ngờ</li>
                            <li>• Phản ứng là tác dụng phụ đặc trưng đã biết của thuốc (có cơ chế dược lý rõ ràng)</li>
                            <li>• Phản ứng lặp lại khi tái sử dụng thuốc nghi ngờ</li>
                          </ul>
                        </div>

                        {/* Probable */}
                        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                          <h4 className="font-bold text-blue-900 mb-2">✓ Có khả năng (Probable/Likely)</h4>
                          <ul className="space-y-1 text-sm text-blue-800">
                            <li>• Phản ứng có mối liên hệ hợp lý với thời gian sử dụng thuốc nghi ngờ</li>
                            <li>• Nguyên nhân gây ra phản ứng không chắc chắn có liên quan đến bệnh lý hoặc thuốc khác</li>
                            <li>• Cải thiện khi ngừng sử dụng thuốc nghi ngờ</li>
                            <li>• Không cần thiết phải có thông tin về tái sử dụng thuốc</li>
                          </ul>
                        </div>

                        {/* Possible */}
                        <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                          <h4 className="font-bold text-yellow-900 mb-2">✓ Có thể (Possible)</h4>
                          <ul className="space-y-1 text-sm text-yellow-800">
                            <li>• Phản ứng có mối liên hệ hợp lý với thời gian sử dụng thuốc nghi ngờ</li>
                            <li>• Phản ứng có thể được giải thích bằng bệnh lý hoặc thuốc khác sử dụng đồng thời</li>
                            <li>• Thiếu thông tin về diễn biến khi ngừng thuốc hoặc thông tin không rõ ràng</li>
                          </ul>
                        </div>

                        {/* Unlikely */}
                        <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                          <h4 className="font-bold text-orange-900 mb-2">Không chắc chắn (Unlikely)</h4>
                          <ul className="space-y-1 text-sm text-orange-800">
                            <li>• Phản ứng có mối liên hệ không rõ ràng với thời gian sử dụng thuốc</li>
                            <li>• Phản ứng có thể được giải thích bằng bệnh lý hoặc thuốc khác sử dụng đồng thời</li>
                          </ul>
                        </div>

                        {/* Unclassified */}
                        <div className="border-l-4 border-gray-500 bg-gray-50 p-4 rounded-r-lg">
                          <h4 className="font-bold text-gray-900 mb-2">Chưa phân loại (Unclassified)</h4>
                          <ul className="space-y-1 text-sm text-gray-800">
                            <li>• Ghi nhận việc xảy ra phản ứng</li>
                            <li>• Cần thêm thông tin để đánh giá hoặc đang tiếp tục thu thập thông tin bổ sung</li>
                          </ul>
                        </div>

                        {/* Unclassifiable */}
                        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                          <h4 className="font-bold text-red-900 mb-2">Không thể phân loại (Unclassifiable)</h4>
                          <ul className="space-y-1 text-sm text-red-800">
                            <li>• Ghi nhận phản ứng, nghi ngờ là phản ứng có hại của thuốc</li>
                            <li>• Không thể đánh giá do thông tin không đầy đủ hoặc không thống nhất</li>
                            <li>• Không thể thu thập thêm thông tin bổ sung hoặc xác minh lại</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    {/* Naranjo Scale */}
                    <section className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">2</span>
                        Thang đánh giá của Naranjo
                      </h3>
                      
                      <p className="text-gray-700 mb-4">
                        Mối quan hệ giữa thuốc nghi ngờ và ADR được phân thành 4 mức: <strong>chắc chắn, có khả năng, có thể, không chắc chắn</strong>. 
                        Thang đánh giá này đưa ra 10 câu hỏi và cho điểm dựa trên các câu trả lời.
                      </p>

                      {/* Calculator Header */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CalculatorIcon className="w-5 h-5 text-indigo-600" />
                            <h4 className="font-bold text-indigo-900">Máy tính điểm Naranjo tương tác</h4>
                          </div>
                          {hasAnswers && (
                            <button
                              onClick={resetCalculator}
                              className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-colors"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                              <span>Làm lại</span>
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-indigo-700 mt-2">
                          Click vào các nút bên dưới để chọn câu trả lời. Hệ thống sẽ tự động tính điểm và đưa ra kết luận.
                        </p>
                      </div>

                      {/* Naranjo Interactive Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-3 py-2 text-left w-12">STT</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Câu hỏi đánh giá</th>
                              <th className="border border-gray-300 px-3 py-2 text-center w-20">Có</th>
                              <th className="border border-gray-300 px-3 py-2 text-center w-20">Không</th>
                              <th className="border border-gray-300 px-3 py-2 text-center w-24">Không rõ</th>
                              <th className="border border-gray-300 px-3 py-2 text-center w-20">Điểm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {naranjoQuestions.map((q) => {
                              const answer = naranjoAnswers[q.id]
                              const score = answer === 'yes' ? q.yesScore : answer === 'no' ? q.noScore : answer === 'unknown' ? q.unknownScore : 0
                              
                              return (
                                <tr key={q.id} className={answer ? 'bg-blue-50' : ''}>
                                  <td className="border border-gray-300 px-3 py-2 text-center font-semibold">{q.id}</td>
                                  <td className="border border-gray-300 px-3 py-2">{q.question}</td>
                                  <td className="border border-gray-300 px-2 py-2 text-center">
                                    <button
                                      onClick={() => handleAnswerChange(q.id, 'yes')}
                                      className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        answer === 'yes'
                                          ? 'bg-green-600 text-white'
                                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                                      }`}
                                    >
                                      {q.yesScore >= 0 ? `+${q.yesScore}` : q.yesScore}
                                    </button>
                                  </td>
                                  <td className="border border-gray-300 px-2 py-2 text-center">
                                    <button
                                      onClick={() => handleAnswerChange(q.id, 'no')}
                                      className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        answer === 'no'
                                          ? 'bg-red-600 text-white'
                                          : q.noScore < 0
                                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                      }`}
                                    >
                                      {q.noScore >= 0 ? (q.noScore === 0 ? '0' : `+${q.noScore}`) : q.noScore}
                                    </button>
                                  </td>
                                  <td className="border border-gray-300 px-2 py-2 text-center">
                                    <button
                                      onClick={() => handleAnswerChange(q.id, 'unknown')}
                                      className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        answer === 'unknown'
                                          ? 'bg-gray-600 text-white'
                                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                      }`}
                                    >
                                      {q.unknownScore}
                                    </button>
                                  </td>
                                  <td className="border border-gray-300 px-3 py-2 text-center">
                                    <span className={`font-bold ${answer ? 'text-blue-700' : 'text-gray-400'}`}>
                                      {answer ? (score >= 0 ? `+${score}` : score) : '-'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gradient-to-r from-blue-100 to-indigo-100 font-bold">
                              <td colSpan={5} className="border border-gray-300 px-3 py-3 text-right text-base">
                                Tổng điểm:
                              </td>
                              <td className="border border-gray-300 px-3 py-3 text-center text-lg text-blue-700">
                                {totalScore >= 0 ? `+${totalScore}` : totalScore}
                              </td>
                            </tr>
                            <tr className={`${conclusion.bgColor} border-2`}>
                              <td colSpan={5} className="border border-gray-300 px-3 py-3 text-right font-semibold">
                                Kết luận:
                              </td>
                              <td colSpan={1} className="border border-gray-300 px-3 py-3 text-center">
                                <span className={`font-bold text-base ${conclusion.color}`}>
                                  {conclusion.text}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Naranjo Scoring */}
                      <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-3">Phân loại theo tổng điểm:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="bg-white p-3 rounded-lg border border-green-200">
                            <div className="font-bold text-green-700">≥ 9 điểm</div>
                            <div className="text-gray-600">Chắc chắn</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-blue-200">
                            <div className="font-bold text-blue-700">5 - 8 điểm</div>
                            <div className="text-gray-600">Có khả năng</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-yellow-200">
                            <div className="font-bold text-yellow-700">1 - 4 điểm</div>
                            <div className="text-gray-600">Có thể</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="font-bold text-gray-700">≤ 0 điểm</div>
                            <div className="text-gray-600">Nghi ngờ</div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Important Note */}
                    <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500 mt-6">
                      <h4 className="font-bold text-amber-900 mb-2">⚠️ Lưu ý quan trọng</h4>
                      <p className="text-sm text-amber-800">
                        Việc đánh giá này <strong>không bắt buộc</strong> khi báo cáo phản ứng có hại của thuốc. 
                        Nhân viên y tế, cơ sở khám bệnh, chữa bệnh cần gửi <strong>tất cả các báo cáo về ADR nghi ngờ</strong> do thuốc 
                        mà không cần kèm theo bất kỳ đánh giá nào. Các báo cáo sẽ được các chuyên gia của Trung tâm Quốc gia 
                        và Trung tâm khu vực thẩm định và gửi kết quả phản hồi cho người báo cáo khi cần thiết.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                  <Button
                    onClick={onClose}
                    variant="outline"
                  >
                    Đóng
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

