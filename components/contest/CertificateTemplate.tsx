'use client';

import React from 'react';

interface CertificateData {
  fullName: string;
  department: string;
  unit: string;
  contestTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completionTime: string;
  completionDate: string;
}

interface CertificateTemplateProps {
  data: CertificateData;
  onDownload?: () => void;
}

export default function CertificateTemplate({ data, onDownload }: CertificateTemplateProps) {
  const {
    fullName,
    department,
    unit,
    contestTitle,
    score,
    totalQuestions,
    percentage,
    completionTime,
    completionDate
  } = data;

  return (
    <div className="bg-white">
      {/* Certificate Container */}
      <div 
        id="certificate-content"
        className="relative w-[297mm] h-[210mm] mx-auto bg-white overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {/* Decorative Border */}
        <div className="absolute inset-4 border-8 border-yellow-400 rounded-lg">
          <div className="absolute inset-2 border-4 border-yellow-300 rounded-lg">
            
            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center p-12 bg-white/95 rounded-lg">
              
              {/* Header */}
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🏆</div>
                <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-4">
                  CHỨNG NHẬN
                </h1>
                <p className="text-2xl text-gray-600 font-semibold">
                  HOÀN THÀNH XUẤT SẮC
                </p>
              </div>

              {/* Body */}
              <div className="text-center space-y-6 max-w-3xl">
                <p className="text-xl text-gray-700">
                  Chứng nhận người có tên dưới đây đã hoàn thành xuất sắc:
                </p>
                
                {/* Contest Name */}
                <div className="py-4 px-6 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
                  <p className="text-3xl font-bold text-purple-800">
                    {contestTitle}
                  </p>
                </div>

                {/* Participant Name */}
                <div className="my-8">
                  <p className="text-lg text-gray-600 mb-2">Họ và tên:</p>
                  <p className="text-5xl font-bold text-gray-800 border-b-4 border-purple-400 pb-2 inline-block">
                    {fullName}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6 text-left mt-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Đơn vị:</p>
                    <p className="text-lg font-semibold text-gray-800">{department}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Khoa/Phòng:</p>
                    <p className="text-lg font-semibold text-gray-800">{unit}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Điểm số:</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {score}/{totalQuestions} điểm ({percentage}%)
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Thời gian hoàn thành:</p>
                    <p className="text-lg font-semibold text-gray-800">{completionTime}</p>
                  </div>
                </div>

                {/* Achievement Badge */}
                {percentage >= 80 && (
                  <div className="mt-6 inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full">
                    <p className="text-xl font-bold text-white">✨ THÀNH TÍCH XUẤT SẮC ✨</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="absolute bottom-12 left-0 right-0 flex justify-between px-24">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-8">Ngày cấp</p>
                  <p className="text-lg font-semibold text-gray-800">{completionDate}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">BAN GIÁM ĐỐC</p>
                  <p className="text-lg font-bold text-gray-800 italic mt-8">(Đã ký)</p>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-8 left-8 text-6xl opacity-20">🎓</div>
              <div className="absolute top-8 right-8 text-6xl opacity-20">📚</div>
              <div className="absolute bottom-32 left-12 text-4xl opacity-20">⭐</div>
              <div className="absolute bottom-32 right-12 text-4xl opacity-20">⭐</div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      {onDownload && (
        <div className="text-center mt-8 mb-8">
          <button
            onClick={onDownload}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            📥 Tải chứng nhận (PDF)
          </button>
        </div>
      )}
    </div>
  );
}








