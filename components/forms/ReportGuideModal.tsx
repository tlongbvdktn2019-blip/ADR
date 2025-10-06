'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline'

interface ReportGuideModalProps {
  isOpen: boolean
  onClose: () => void
  dontShowAgain?: boolean
  setDontShowAgain?: (value: boolean) => void
}

export default function ReportGuideModal({ isOpen, onClose, dontShowAgain, setDontShowAgain }: ReportGuideModalProps) {
  const showCheckbox = dontShowAgain !== undefined && setDontShowAgain !== undefined

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
          <div className="flex min-h-full items-start justify-center p-4 pt-8 sm:pt-16 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500 transform"
              enterFrom="opacity-0 scale-95 -translate-y-8"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300 transform"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 -translate-y-8"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <BookOpenIcon className="w-7 h-7 text-white" />
                      <div>
                        <Dialog.Title className="text-xl font-bold text-white">
                          Hướng dẫn điền mẫu báo cáo phản ứng có hại của thuốc (ADR)
                        </Dialog.Title>
                        <p className="text-sm text-blue-100 mt-1">Thông tin chi tiết, nguyên tắc và quy trình báo cáo</p>
                      </div>
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
                  <div className="space-y-8">
                    {/* Nguyên tắc chung */}
                    <section>
                      <h2 className="text-2xl font-semibold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4">
                        Nguyên tắc chung
                      </h2>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Hoàn thành mẫu báo cáo với đầy đủ thông tin nhất có được từ bệnh án.</li>
                        <li>Sử dụng một bản báo cáo riêng cho mỗi người bệnh.</li>
                        <li>Trường hợp dùng thuốc để điều trị ADR nhưng lại gây ra một ADR khác, nên tách thành một báo cáo riêng.</li>
                        <li>Chữ viết rõ ràng, viết chính xác tên thuốc, hạn chế viết tắt.</li>
                        <li>Điền thông tin chính xác, thống nhất, tránh mâu thuẫn.</li>
                        <li>Khuyến khích áp dụng công nghệ thông tin trong báo cáo ADR.</li>
                      </ul>
                    </section>

                    {/* Thông tin tối thiểu */}
                    <section>
                      <h2 className="text-2xl font-semibold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4">
                        Các thông tin tối thiểu cần điền
                      </h2>
                      <ul className="list-disc list-inside space-y-3 text-gray-700">
                        <li><strong className="text-blue-800">Thông tin về người bệnh:</strong> họ và tên, tuổi hoặc ngày sinh, giới tính.</li>
                        <li><strong className="text-blue-800">Thông tin về phản ứng có hại:</strong> mô tả chi tiết, ngày xuất hiện, diễn biến sau khi xử trí.</li>
                        <li><strong className="text-blue-800">Thông tin về thuốc nghi ngờ:</strong> tên thuốc, liều dùng, đường dùng, lý do sử dụng, ngày bắt đầu.</li>
                        <li><strong className="text-blue-800">Thông tin về người và đơn vị báo cáo:</strong> tên đơn vị, họ tên người báo cáo, chức vụ, thông tin liên lạc.</li>
                      </ul>
                    </section>

                    {/* Hướng dẫn chi tiết */}
                    <section>
                      <h2 className="text-2xl font-semibold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4">
                        Hướng dẫn chi tiết các thông tin cần điền
                      </h2>
                      
                      <div className="space-y-6">
                        {/* I. Thông tin hành chính */}
                        <div>
                          <h3 className="text-xl font-bold text-blue-800 mb-3">I. Thông tin hành chính</h3>
                          <ul className="list-none space-y-3 pl-4 border-l-2 border-blue-200 text-gray-700">
                            <li><strong>Nơi báo cáo:</strong> Ghi tên khoa/phòng, tên cơ sở khám bệnh, chữa bệnh và tỉnh/thành phố.</li>
                            <li><strong>Mã số báo cáo của đơn vị:</strong> Do cơ sở tự quy định (hoặc dùng mã số bệnh án) để tiện theo dõi.</li>
                            <li><strong>Mã số báo cáo (do Trung tâm Quốc gia):</strong> Phần này do Trung tâm Quốc gia hoặc Trung tâm khu vực điền.</li>
                          </ul>
                        </div>

                        {/* II. Thông tin về người bệnh */}
                        <div>
                          <h3 className="text-xl font-bold text-blue-800 mb-3">II. Thông tin về người bệnh</h3>
                          <ul className="list-none space-y-3 pl-4 border-l-2 border-blue-200 text-gray-700">
                            <li><strong>Mục 1 - Họ và tên:</strong> Điền đầy đủ họ và tên của người bệnh.</li>
                            <li>
                              <strong>Mục 2 - Tuổi:</strong> Điền ngày/tháng/năm sinh hoặc tuổi tại thời điểm xảy ra ADR.
                              <p className="mt-1 bg-blue-50 border-l-4 border-blue-500 p-3 text-sm rounded">
                                <em>Với bệnh nhi dưới 1 tuổi và sơ sinh, cần ghi rõ tháng tuổi hoặc ngày tuổi.</em>
                              </p>
                            </li>
                            <li><strong>Mục 3 - Giới tính:</strong> Đánh dấu (√) vào ô "Nam" hoặc "Nữ".</li>
                            <li><strong>Mục 4 - Cân nặng:</strong> Điền cân nặng của người bệnh (nếu có).</li>
                          </ul>
                        </div>

                        {/* III. Thông tin về phản ứng có hại (ADR) */}
                        <div>
                          <h3 className="text-xl font-bold text-blue-800 mb-3">III. Thông tin về phản ứng có hại (ADR)</h3>
                          <ul className="list-none space-y-3 pl-4 border-l-2 border-blue-200 text-gray-700">
                            <li><strong>Mục 5 - Ngày xuất hiện phản ứng:</strong> Điền ngày/tháng/năm.</li>
                            <li><strong>Mục 6 - Thời gian từ lần dùng cuối:</strong> Khoảng thời gian từ lần dùng thuốc cuối cùng đến khi xuất hiện ADR.</li>
                            <li><strong>Mục 7 - Mô tả biểu hiện ADR:</strong> Mô tả rõ dấu hiệu, triệu chứng cụ thể, diễn biến lâm sàng. Không ghi chung chung (ví dụ: "dị ứng").</li>
                            <li><strong>Mục 8 - Các xét nghiệm liên quan:</strong> Ghi kết quả cận lâm sàng bất thường liên quan đến phản ứng.</li>
                            <li className="bg-blue-50 border-l-4 border-blue-500 p-3 text-sm rounded">
                              <strong>Ghi chú:</strong> Mục 7 và 8 nên do nhân viên y tế trực tiếp chăm sóc điền hoặc kiểm tra lại.
                            </li>
                            <li><strong>Mục 9 - Tiền sử:</strong> Ghi tiền sử ADR, dị ứng, thai nghén, nghiện thuốc lá/rượu, bệnh lý gan, thận.</li>
                            <li><strong>Mục 10 - Cách xử trí phản ứng:</strong> Ghi các biện pháp xử trí, thuốc điều trị đã sử dụng.</li>
                            <li><strong>Mục 11 - Mức độ nghiêm trọng:</strong> Đánh dấu (√) vào mức độ phù hợp (Tử vong, Đe dọa tính mạng, Nhập viện/kéo dài nằm viện, Tàn tật, Dị tật thai nhi, hoặc Không nghiêm trọng).</li>
                            <li><strong>Mục 12 - Kết quả sau xử trí:</strong> Đánh dấu (√) vào kết quả (Tử vong, Chưa hồi phục, Đang hồi phục, Hồi phục có/không có di chứng).</li>
                          </ul>
                        </div>

                        {/* IV. Thông tin về thuốc nghi ngờ gây ADR */}
                        <div>
                          <h3 className="text-xl font-bold text-blue-800 mb-3">IV. Thông tin về thuốc nghi ngờ gây ADR</h3>
                          <ul className="list-none space-y-3 pl-4 border-l-2 border-blue-200 text-gray-700">
                            <li><strong>Mục 13 - Thông tin thuốc nghi ngờ:</strong> Ghi rõ tên thuốc (biệt dược và tên chung), liều, đường dùng, lý do dùng, ngày bắt đầu/kết thúc, nhà sản xuất, số lô.</li>
                            <li><strong>Mục 14 - Diễn biến sau khi ngừng/giảm liều:</strong> ADR có cải thiện không?</li>
                            <li>
                              <strong>Mục 15 - Diễn biến sau khi tái sử dụng:</strong> ADR có xuất hiện lại không?
                              <p className="mt-1 bg-red-50 border-l-4 border-red-500 p-3 text-sm rounded">
                                <em><strong>Chú ý:</strong> Cần thận trọng khi tái sử dụng thuốc nghi ngờ. Chỉ dùng lại khi lợi ích vượt trội nguy cơ.</em>
                              </p>
                            </li>
                            <li><strong>Mục 16 - Các thuốc dùng đồng thời:</strong> Liệt kê các thuốc khác dùng cùng lúc (trừ thuốc điều trị ADR).</li>
                          </ul>
                        </div>

                        {/* V. Phần đánh giá ADR của đơn vị */}
                        <div>
                          <h3 className="text-xl font-bold text-blue-800 mb-3">V. Phần đánh giá ADR của đơn vị</h3>
                          <ul className="list-none space-y-3 pl-4 border-l-2 border-blue-200 text-gray-700">
                            <li><strong>Mục 17, 18 - Thẩm định ADR:</strong> Việc đánh giá mối liên quan là không bắt buộc. Có thể dùng thang của WHO hoặc Naranjo.</li>
                            <li><strong>Mục 19 - Bình luận của cán bộ y tế:</strong> Ghi ý kiến chuyên môn về ca bệnh.</li>
                          </ul>
                        </div>

                        {/* VI. Thông tin về người báo cáo */}
                        <div>
                          <h3 className="text-xl font-bold text-blue-800 mb-3">VI. Thông tin về người báo cáo</h3>
                          <ul className="list-none space-y-3 pl-4 border-l-2 border-blue-200 text-gray-700">
                            <li><strong>Mục 20 - Thông tin:</strong> Ghi đầy đủ họ tên, chức danh, điện thoại, email. Thông tin sẽ được bảo mật.</li>
                            <li><strong>Mục 21 - Chữ ký:</strong> Người báo cáo ký xác nhận.</li>
                            <li><strong>Mục 22 - Dạng báo cáo:</strong> Đánh dấu (√) là "Lần đầu" hay "Bổ sung".</li>
                            <li><strong>Mục 23 - Ngày báo cáo:</strong> Điền ngày/tháng/năm.</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    {/* Hình thức gửi */}
                    <section>
                      <h2 className="text-2xl font-semibold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4">
                        Hình thức gửi báo cáo ADR
                      </h2>
                      <p className="mb-4 text-gray-700">Báo cáo được điền vào mẫu và gửi về Trung tâm Quốc gia hoặc Trung tâm khu vực bằng một trong các hình thức sau:</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                          <strong className="text-blue-800">Cách 1:</strong> Gửi qua bưu điện
                        </div>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                          <strong className="text-blue-800">Cách 2:</strong> Gửi qua thư điện tử (email)
                        </div>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                          <strong className="text-blue-800">Cách 3:</strong> Báo cáo trực tuyến tại{' '}
                          <a href="http://canhgiacduoc.org.vn" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            canhgiacduoc.org.vn
                          </a>
                        </div>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                          <strong className="text-blue-800">Cách 4:</strong> Báo cáo qua điện thoại (trường hợp khẩn cấp) và gửi lại mẫu sau.
                        </div>
                      </div>
                    </section>

                    {/* Nơi nhận */}
                    <section>
                      <h2 className="text-2xl font-semibold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4">
                        Nơi nhận báo cáo
                      </h2>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="border border-blue-200 p-4 rounded-lg">
                          <h3 className="font-bold text-blue-800 mb-2">Trung tâm Quốc gia (Toàn quốc)</h3>
                          <p className="text-gray-700"><strong>Địa chỉ:</strong> Trường Đại học Dược Hà Nội, 13-15 Lê Thánh Tông, Hoàn Kiếm, Hà Nội</p>
                          <p className="text-gray-700"><strong>Điện thoại:</strong> (024) 3933 5618</p>
                          <p className="text-gray-700"><strong>Email:</strong> di.pvcenter@gmail.com</p>
                        </div>
                        <div className="border border-blue-200 p-4 rounded-lg">
                          <h3 className="font-bold text-blue-800 mb-2">Trung tâm khu vực TP.HCM (Từ Đà Nẵng trở vào)</h3>
                          <p className="text-gray-700"><strong>Địa chỉ:</strong> Bệnh viện Chợ Rẫy, 201B Nguyễn Chí Thanh, P.12, Q.5, TP.HCM</p>
                          <p className="text-gray-700"><strong>Điện thoại:</strong> (028) 3855 4137 (Ext: 794)</p>
                          <p className="text-gray-700"><strong>Email:</strong> adrhcm@choray.vn</p>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center">
                    {showCheckbox && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dontShowAgain}
                          onChange={(e) => setDontShowAgain!(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Không hiển thị lại</span>
                      </label>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Đóng
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
