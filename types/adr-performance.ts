// Types for ADR Performance Assessment Module

export type IndicatorType = 'C' | 'P'; // C: Chỉ tiêu chính, P: Chỉ tiêu phụ
export type CategoryType = 'A' | 'B' | 'C' | 'D' | 'E';
export type AssessmentStatus = 'draft' | 'submitted' | 'final';

export interface ADRPerformanceIndicator {
  code: string; // e.g., "2.2", "2.3"
  type: IndicatorType;
  category: CategoryType;
  categoryName: string;
  question: string;
}

export interface ADRPerformanceAnswer {
  id: string;
  assessment_id: string;
  indicator_code: string;
  indicator_type: IndicatorType;
  category: CategoryType;
  question: string;
  answer: boolean | null; // true = Có, false = Không, null = chưa trả lời
  score: number;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface ADRPerformanceAssessment {
  id: string;
  user_id: string;
  assessment_date: string;
  total_score: number;
  max_score: number;
  percentage: number;
  status: AssessmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data from users table
  answers?: ADRPerformanceAnswer[];
  users?: {
    id: string;
    full_name?: string;
    name?: string;
    email?: string;
    organization?: string;
  };
}

export interface CreateAssessmentRequest {
  assessment_date?: string;
  status?: AssessmentStatus;
  notes?: string;
}

export interface UpdateAssessmentRequest {
  assessment_date?: string;
  status?: AssessmentStatus;
  notes?: string;
}

export interface SaveAnswerRequest {
  indicator_code: string;
  indicator_type: IndicatorType;
  category: CategoryType;
  question: string;
  answer: boolean | null;
  note?: string;
}

export interface AssessmentScoreByCategory {
  category: CategoryType;
  categoryName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  answeredCount: number;
  totalCount: number;
}

// Predefined indicators based on hieuquahoatdong.md
export const ADR_PERFORMANCE_INDICATORS: ADRPerformanceIndicator[] = [
  // A. Cơ cấu tổ chức
  {
    code: '2.2',
    type: 'C',
    category: 'A',
    categoryName: 'Cơ cấu tổ chức',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có văn bản chính thức quy định rõ nhiệm vụ, cơ cấu tổ chức, vai trò, trách nhiệm và phương thức báo cáo của đơn vị giám sát an toàn thuốc không?'
  },
  {
    code: '2.3',
    type: 'P',
    category: 'A',
    categoryName: 'Cơ cấu tổ chức',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có quy trình thao tác chuẩn trong kiểm soát chất lượng thuốc không?'
  },
  {
    code: '2.5',
    type: 'C',
    category: 'A',
    categoryName: 'Cơ cấu tổ chức',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có bản phân công công việc cho nhân viên y tế chịu trách nhiệm về giám sát ADR không?'
  },
  {
    code: '2.8',
    type: 'C',
    category: 'A',
    categoryName: 'Cơ cấu tổ chức',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có quy trình phát hiện và báo cáo ADR không?'
  },
  {
    code: '2.9',
    type: 'C',
    category: 'A',
    categoryName: 'Cơ cấu tổ chức',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có thành lập và triển khai hoạt động của Hội đồng Thuốc và điều trị không?'
  },
  {
    code: '2.14',
    type: 'C',
    category: 'A',
    categoryName: 'Cơ cấu tổ chức',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có văn bản về việc phối hợp các đối tác liên quan trong đơn vị để triển khai hoạt động giám sát ADR không?'
  },
  
  // B. Cơ sở vật chất và nhân lực
  {
    code: '2.1',
    type: 'C',
    category: 'B',
    categoryName: 'Cơ sở vật chất và nhân lực',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có quyết định thành lập đơn vị hay bộ phận chịu trách nhiệm giám sát an toàn thuốc trong đơn vị của mình không?'
  },
  {
    code: '2.4',
    type: 'C',
    category: 'B',
    categoryName: 'Cơ sở vật chất và nhân lực',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có hệ thống dữ liệu lưu trữ thông tin trả lời câu hỏi về ADR và thông tin an toàn của thuốc không?'
  },
  {
    code: '2.6',
    type: 'C',
    category: 'B',
    categoryName: 'Cơ sở vật chất và nhân lực',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có nguồn tài chính cho hoạt động giám sát ADR không?'
  },
  {
    code: '2.7',
    type: 'C',
    category: 'B',
    categoryName: 'Cơ sở vật chất và nhân lực',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có lưu trữ văn bản Hướng dẫn giám sát phản ứng có hại của thuốc và Hướng dân Quốc gia về Cảnh giác Dược không?'
  },
  {
    code: '2.10',
    type: 'C',
    category: 'B',
    categoryName: 'Cơ sở vật chất và nhân lực',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có sẵn các phương tiện công nghệ thông tin để cập nhật và cung cấp thông tin và cảnh báo về thuốc không?'
  },
  {
    code: '2.11',
    type: 'C',
    category: 'B',
    categoryName: 'Cơ sở vật chất và nhân lực',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có các tài liệu tham khảo cơ bản về Thông tin thuốc và Cảnh giác Dược không?'
  },
  {
    code: '2.13',
    type: 'P',
    category: 'B',
    categoryName: 'Cơ sở vật chất và nhân lực',
    question: 'Nhân viên y tế tại cơ sở khám bệnh, chữa bệnh của anh/chị đã tham gia tập huấn về giám sát ADR chưa?'
  },
  
  // C. Triển khai các biểu mẫu báo cáo liên quan ADR
  {
    code: '3.1',
    type: 'C',
    category: 'C',
    categoryName: 'Triển khai các biểu mẫu báo cáo liên quan ADR',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có thu thập và gửi báo cáo tới Trung tâm DI&ADR không?'
  },
  {
    code: '3.2',
    type: 'P',
    category: 'C',
    categoryName: 'Triển khai các biểu mẫu báo cáo liên quan ADR',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có mẫu báo cáo ADR dành cho người bệnh không?'
  },
  {
    code: '3.3',
    type: 'C',
    category: 'C',
    categoryName: 'Triển khai các biểu mẫu báo cáo liên quan ADR',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có mẫu báo cáo phản ứng có hại của thuốc (ADR) không?'
  },
  {
    code: '3.4',
    type: 'C',
    category: 'C',
    categoryName: 'Triển khai các biểu mẫu báo cáo liên quan ADR',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có mẫu báo cáo chất lượng thuốc không?'
  },
  {
    code: '3.5',
    type: 'C',
    category: 'C',
    categoryName: 'Triển khai các biểu mẫu báo cáo liên quan ADR',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có mẫu báo cáo sai sót liên quan đến sử dụng thuốc không?'
  },
  {
    code: '3.6',
    type: 'C',
    category: 'C',
    categoryName: 'Triển khai các biểu mẫu báo cáo liên quan ADR',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có mẫu báo cáo thất bại điều trị không?'
  },
  
  // D. Hoạt động giám sát và nghiên cứu liên quan an toàn thuốc
  {
    code: '4.1',
    type: 'C',
    category: 'D',
    categoryName: 'Hoạt động giám sát và nghiên cứu liên quan an toàn thuốc',
    question: 'Số lượng báo cáo ADR tự nguyện của cơ sở khám bệnh, chữa bệnh có ≥ 100 báo cáo/1 triệu dân/năm không? (trong đó, dân số tính theo địa phương nơi đặt bệnh viện)'
  },
  {
    code: '4.3',
    type: 'P',
    category: 'D',
    categoryName: 'Hoạt động giám sát và nghiên cứu liên quan an toàn thuốc',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có thực hiện và báo cáo kiểm soát chất lượng thuốc không?'
  },
  {
    code: '4.4',
    type: 'P',
    category: 'D',
    categoryName: 'Hoạt động giám sát và nghiên cứu liên quan an toàn thuốc',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có thực hiện đánh giá khả năng phòng tránh được của ADR hoặc các nghiên cứu phát hiện sai sót liên quan tới sử dụng thuốc không?'
  },
  {
    code: '4.5',
    type: 'P',
    category: 'D',
    categoryName: 'Hoạt động giám sát và nghiên cứu liên quan an toàn thuốc',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có thực hiện nghiên cứu đánh giá sử dụng thuốc không?'
  },
  {
    code: '4.6',
    type: 'C',
    category: 'D',
    categoryName: 'Hoạt động giám sát và nghiên cứu liên quan an toàn thuốc',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có thực hiện giám sát tích cực ADR trong 5 năm trở lại đây hay không?'
  },
  {
    code: '4.7',
    type: 'C',
    category: 'D',
    categoryName: 'Hoạt động giám sát và nghiên cứu liên quan an toàn thuốc',
    question: 'Tỷ lệ số người bệnh được ghi nhận gặp biến cố bất lợi liên quan đến thuốc trên tổng số người bệnh điều trị nội trú tại cơ sở khám bệnh, chữa bệnh của anh/chị có ≥ 1% không?'
  },
  
  // E. Hoạt động thông tin và truyền thông
  {
    code: '5.1',
    type: 'P',
    category: 'E',
    categoryName: 'Hoạt động thông tin và truyền thông',
    question: 'Số lượng yêu cầu thông tin về an toàn thuốc đã tiếp nhận và xử lý có ≥ 100 yêu cầu/1 triệu dân/năm không? (trong đó, dân số tính theo địa phương nơi đặt bệnh viện)'
  },
  {
    code: '5.2',
    type: 'P',
    category: 'E',
    categoryName: 'Hoạt động thông tin và truyền thông',
    question: 'Cơ sở khám bệnh, chữa bệnh có xuất bản bản tin về an toàn thuốc (bản tin Thông tin thuốc, Cảnh giác Dược, Dược lâm sàng) theo kế hoạch không?'
  },
  {
    code: '5.3',
    type: 'P',
    category: 'E',
    categoryName: 'Hoạt động thông tin và truyền thông',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có thực hiện và ban hành Hướng dẫn đấu thầu, chính sách đấu thầu thuốc'
  },
  {
    code: '5.6',
    type: 'P',
    category: 'E',
    categoryName: 'Hoạt động thông tin và truyền thông',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có danh mục và hướng dẫn sử dụng thuốc có nguy cơ cao không?'
  },
  {
    code: '5.7',
    type: 'P',
    category: 'E',
    categoryName: 'Hoạt động thông tin và truyền thông',
    question: 'Tỷ lệ truyền tải các cảnh báo an toàn thuốc từ cơ quan quản lý và các vấn đề an toàn thuốc ghi nhận tại cơ sở khám bệnh, chữa bệnh của anh/chị trong năm qua có ≥ 70% không?'
  },
  {
    code: '5.8',
    type: 'C',
    category: 'E',
    categoryName: 'Hoạt động thông tin và truyền thông',
    question: 'Khoảng thời gian trễ (tính từ khi xác định được các vấn đề an toàn thuốc cho tới lúc thông tin được truyền tải cho nhân viên y tế) của mỗi vấn đề an toàn thuốc trong số 70% vấn đề an toàn thuốc đã được truyền tải tại cơ sở khám bệnh, chữa bệnh của anh/chị trong 1 năm qua có được thực hiện trong vòng 3 tuần không?'
  },
  {
    code: '5.9',
    type: 'P',
    category: 'E',
    categoryName: 'Hoạt động thông tin và truyền thông',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có thực hiện tư vấn cho người bệnh về ADR và vấn đề an toàn thuốc không?'
  },
  {
    code: '5.10',
    type: 'P',
    category: 'E',
    categoryName: 'Hoạt động thông tin và truyền thông',
    question: 'Cơ sở khám bệnh, chữa bệnh của anh/chị có thực hiện các hoạt động an toàn thuốc như: truyền thông an toàn thuốc, xây dựng/sửa đổi/cập nhật các hướng dẫn sử dụng thuốc và ra quyết định quản lý nguy cơ trong 1 năm vừa qua không?'
  },
  {
    code: '5.11',
    type: 'C',
    category: 'E',
    categoryName: 'Hoạt động thông tin và truyền thông',
    question: 'Tỷ lệ số cuộc họp của Hội đồng Thuốc và điều trị có đề cập đến hoạt động Cảnh giác Dược hoặc giải quyết vấn đề an toàn thuốc trên tổng số cuộc họp của Hội đồng Thuốc và điều trị trong 1 năm qua có ≥ 70% không?'
  }
];

// Category names
export const CATEGORY_NAMES: Record<CategoryType, string> = {
  A: 'Cơ cấu tổ chức',
  B: 'Cơ sở vật chất và nhân lực',
  C: 'Triển khai các biểu mẫu báo cáo liên quan ADR',
  D: 'Hoạt động giám sát và nghiên cứu liên quan an toàn thuốc',
  E: 'Hoạt động thông tin và truyền thông'
};

// Score calculation helper
export function calculateIndicatorScore(indicatorType: IndicatorType, answer: boolean | null): number {
  if (answer === null) return 0;
  if (answer === true) {
    return indicatorType === 'C' ? 2 : 1;
  }
  return 0;
}

export function getMaxScore(indicatorType: IndicatorType): number {
  return indicatorType === 'C' ? 2 : 1;
}

