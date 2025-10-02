# 📋 TỔNG HỢP HỆ THỐNG QUẢN LÝ ADR

## 📖 Mục lục

1. [Tổng quan hệ thống](#tổng-quan-hệ-thống)
2. [Công nghệ và kiến trúc](#công-nghệ-và-kiến-trúc)
3. [Các tính năng chính](#các-tính-năng-chính)
4. [Cấu trúc dự án](#cấu-trúc-dự-án)
5. [Database Schema](#database-schema)
6. [Hệ thống xác thực và phân quyền](#hệ-thống-xác-thực-và-phân-quyền)
7. [API Endpoints](#api-endpoints)
8. [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
9. [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
10. [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## 🎯 Tổng quan hệ thống

### Giới thiệu

**Hệ thống Quản lý ADR (Adverse Drug Reaction Management System)** là một ứng dụng web toàn diện được xây dựng để quản lý và báo cáo phản ứng có hại của thuốc tại các cơ sở y tế Việt Nam. Hệ thống tuân thủ các quy định của Bộ Y tế Việt Nam và áp dụng các thang đánh giá quốc tế (WHO-UMC, Naranjo).

### Mục đích

- **Quản lý báo cáo ADR**: Thu thập, lưu trữ và quản lý các báo cáo phản ứng có hại của thuốc
- **Thẻ dị ứng điện tử**: Tạo và quản lý thẻ dị ứng với QR code cho bệnh nhân
- **Đào tạo và nâng cao nhận thức**: Hệ thống quiz và training về ADR
- **Hỗ trợ AI**: Tư vấn và đánh giá ADR bằng trí tuệ nhân tạo
- **Phân tích và thống kê**: Dashboard với biểu đồ trực quan
- **Quản lý thông tin**: Chia sẻ kiến thức và tin tức về ADR

### Phiên bản

- **Version**: 2.0 - Camera Scanner Edition
- **Release Date**: 01/10/2025
- **Status**: ✅ Production Ready

---

## 🛠️ Công nghệ và kiến trúc

### Tech Stack

#### Frontend
- **Framework**: Next.js 14.0.0 (App Router)
- **UI Library**: React 18.2.0
- **Styling**: Tailwind CSS 3.3.6
- **UI Components**: 
  - Headless UI 1.7.17
  - Heroicons 2.0.18
- **Forms**: React Hook Form 7.47.0
- **Charts**: Recharts 2.8.0
- **Notifications**: React Hot Toast 2.4.1
- **Date Handling**: date-fns 2.30.0

#### Backend & Database
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Supabase Client 2.38.5
- **Authentication**: NextAuth.js 4.24.5
- **Password Hashing**: bcryptjs 3.0.2

#### PDF & Document Generation
- **PDF Export**: jsPDF 2.5.1
- **HTML to Canvas**: html2canvas 1.4.1
- **DOCX Export**: docx 8.5.0
- **File Saving**: file-saver 2.0.5

#### QR Code Features
- **QR Generation**: qrcode 1.5.4
- **QR Scanning**: html5-qrcode 2.3.8

#### Email
- **Email Service**: Nodemailer 6.10.1

#### Language & Type Safety
- **Language**: TypeScript 5
- **Type Definitions**: Comprehensive TypeScript types

### Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │  Hooks   │  │  Types   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes (Middleware)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Reports  │  │   Quiz   │  │    AI    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                Service Layer (lib/)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Auth Service  │  │  QR Service  │  │ AI Service   │     │
│  │Email Service │  │ Quiz Service │  │ PDF Service  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL + Auth)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Tables  │  │   RLS    │  │ Functions│  │ Triggers │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Deployment

- **Platform**: Vercel (recommended)
- **Database**: Supabase Cloud
- **Environment**: Node.js runtime
- **Domain**: Custom domain support

---

## 🌟 Các tính năng chính

### 1. 📝 Quản lý Báo cáo ADR

#### Mô tả
Hệ thống báo cáo ADR hoàn chỉnh theo tiêu chuẩn Bộ Y tế Việt Nam.

#### Các phần trong form báo cáo:

**Phần A: Thông tin Bệnh nhân**
- Họ tên bệnh nhân
- Ngày sinh (tự động tính tuổi)
- Giới tính
- Cân nặng

**Phần B: Thông tin ADR**
- Ngày xảy ra ADR
- Mô tả phản ứng
- Xét nghiệm liên quan
- Tiền sử bệnh
- Xử trí và kết quả
- Mức độ nghiêm trọng
- Kết quả sau xử trí

**Phần C: Thuốc nghi ngờ**
- Bảng động (thêm/xóa nhiều thuốc)
- Tên thuốc (hoạt chất và thương mại)
- Dạng bào chế
- Nhà sản xuất
- Số lô
- Liều dùng và tần suất
- Đường dùng
- Ngày bắt đầu/kết thúc
- Chỉ định
- Phản ứng có cải thiện khi ngừng thuốc?
- Phản ứng có tái xuất hiện khi dùng lại?

**Phần D: Thuốc dùng đồng thời**
- Danh sách thuốc khác đang dùng
- Thời gian sử dụng

**Phần E: Thẩm định ADR**
- Đánh giá mối liên quan (WHO-UMC)
- Thang đánh giá (Naranjo)
- Bình luận của cán bộ y tế

**Phần F: Thông tin người báo cáo**
- Tên người báo cáo
- Nghề nghiệp
- Đơn vị
- Liên hệ (email, phone)
- Loại báo cáo (tự nguyện/theo yêu cầu)
- Ngày báo cáo

#### Tính năng đặc biệt:
- ✅ Form wizard với progress indicator
- ✅ Validation đầy đủ client-side và server-side
- ✅ Auto-generate mã báo cáo theo năm
- ✅ Lưu draft và tiếp tục sau
- ✅ Preview trước khi submit
- ✅ Export PDF/DOCX
- ✅ Gửi email báo cáo

---

### 2. 🏥 Hệ thống Thẻ Dị Ứng

#### Mô tả
Quản lý thẻ dị ứng điện tử cho bệnh nhân với QR code để tra cứu nhanh.

#### Tính năng:

**Tạo thẻ dị ứng:**
- Thông tin bệnh nhân
- Danh sách dị nguyên/thuốc gây dị ứng
- Mức độ chắc chắn (nghi ngờ/chắc chắn)
- Biểu hiện lâm sàng
- Mức độ nghiêm trọng
- Thông tin bác sĩ xác nhận
- Tự động tạo QR code

**Quét QR code:**
- ✅ Quét bằng camera trực tiếp trên browser
- ✅ Không cần cài đặt app bên ngoài
- ✅ Tự động phát hiện camera (front/back)
- ✅ Chuyển đổi giữa các camera
- ✅ Hỗ trợ nhiều định dạng QR:
  - Mã thẻ: `AC-2024-000001`
  - URL: `https://domain.com/allergy-cards/view/[id]`
  - JSON: `{"type":"allergy_card","code":"..."}`

**Tra cứu thẻ:**
- ✅ Public API (không cần đăng nhập)
- ✅ Tra cứu bằng mã thẻ
- ✅ Hiển thị thông tin dị ứng đầy đủ
- ✅ Cảnh báo thẻ hết hạn

**In thẻ:**
- ✅ Mẫu thẻ theo Thông tư 51/2017/TT-BYT
- ✅ QR code được in trên thẻ
- ✅ Export PDF để in
- ✅ Ba điều cần nhớ về phản vệ

#### Use Cases:

**Use Case 1: Bệnh nhân**
1. Tạo thẻ dị ứng trên hệ thống
2. Nhận QR code
3. In hoặc lưu trên điện thoại
4. Xuất trình khi khám bệnh

**Use Case 2: Y tá/Bác sĩ**
1. Quét QR code của bệnh nhân
2. Xem thông tin dị ứng
3. Kê đơn thuốc an toàn

**Use Case 3: Cấp cứu**
1. Bệnh nhân nhập viện khẩn cấp
2. Quét QR trên thẻ/điện thoại
3. Xem thông tin dị ứng ngay lập tức
4. Điều trị an toàn, tránh thuốc gây dị ứng

---

### 3. 🤖 AI Chatbot Tư vấn ADR

#### Mô tả
Trợ lý AI chuyên về đánh giá và tư vấn ADR, hỗ trợ nhân viên y tế trong quá trình thẩm định.

#### Tính năng:

**AI Consultant:**
- ✅ Phân tích thông tin ADR
- ✅ Đánh giá mối liên quan thuốc-ADR
- ✅ Tính điểm Naranjo tự động
- ✅ Phân loại theo WHO-UMC
- ✅ Gợi ý xử trí lâm sàng
- ✅ Đề xuất xét nghiệm bổ sung

**Conversation Features:**
- ✅ Chat real-time
- ✅ Context awareness (hiểu ngữ cảnh case)
- ✅ Chat history
- ✅ Quick suggestions
- ✅ Apply insights to form

**AI Providers:**
- ChatGPT (OpenAI)
- Gemini (Google AI)
- Có thể chuyển đổi giữa các provider

**System Prompt:**
```
Bạn là một chuyên gia Dược lâm sàng và Pharmacovigilance với 
kinh nghiệm 20+ năm về đánh giá ADR.

NGUYÊN TẮC:
1. Đánh giá theo thang WHO-UMC và Naranjo
2. Phân tích khoa học, có căn cứ
3. Nhấn mạnh clinical judgment
4. Gợi ý cụ thể, có thể thực hiện
5. Cảnh báo limitations

ĐỊNH DẠNG:
- Ngắn gọn, súc tích (<300 từ)
- Bullet points
- Trích dẫn WHO/Naranjo
- Recommended next steps
```

**AI Assessment Service:**
- Tính điểm Naranjo tự động
- Phân loại WHO-UMC
- Phân tích mức độ nghiêm trọng
- Đánh giá causality
- Gợi ý differential diagnosis

---

### 4. 🎮 Hệ thống Quiz & Training

#### Mô tả
Hệ thống đào tạo và kiểm tra kiến thức về ADR cho nhân viên y tế.

#### Tính năng:

**Quiz Categories:**
- WHO-UMC Assessment
- Naranjo Scale
- Drug Knowledge
- Case Studies
- Regulations (Quy định pháp lý)
- General ADR Knowledge

**Quiz Modes:**

1. **Practice Quiz:**
   - Chọn category
   - Chọn difficulty (beginner/intermediate/advanced/expert)
   - Số câu hỏi tùy chọn
   - Không giới hạn thời gian

2. **Daily Challenge:**
   - Thử thách hàng ngày
   - 10 câu hỏi
   - Giới hạn thời gian
   - Bonus points
   - Leaderboard

3. **Timed Quiz:**
   - Quiz có thời gian
   - Đếm ngược
   - Áp lực thời gian

**Question Types:**
- Multiple Choice (4 options)
- True/False
- Case Scenario (đưa ra case và phân tích)

**Quiz Features:**
- ✅ Progress tracking
- ✅ Score calculation
- ✅ Instant feedback
- ✅ Detailed explanations
- ✅ Reference sources
- ✅ Learning points
- ✅ Skip questions
- ✅ Time tracking

**Gamification:**

**Achievements:**
- Score-based (đạt điểm cao)
- Streak-based (chuỗi ngày liên tiếp)
- Category mastery (thành thạo danh mục)
- Speed-based (trả lời nhanh)
- Participation (tham gia đều đặn)

**Leaderboards:**
- Overall ranking
- Category-specific rankings
- Daily/Weekly/Monthly/All-time
- Accuracy percentage
- Average time

**User Stats:**
- Total sessions
- Questions answered
- Correct answers
- Total points
- Average score
- Current streak / Longest streak
- Category statistics
- Time spent
- Current rank / Best rank

**Analytics (Admin):**
- Question difficulty analysis
- Success rate by question
- Popular categories
- User engagement metrics
- Question quality review

---

### 5. 📊 Dashboard & Analytics

#### Mô tả
Dashboard với các biểu đồ và thống kê chi tiết về ADR reports.

#### Biểu đồ chính:

**1. Reports by Date Chart**
- Biểu đồ đường theo thời gian
- Số lượng báo cáo theo ngày/tháng
- Xu hướng tăng/giảm

**2. Top 10 Facilities Chart**
- Top 10 cơ sở báo cáo nhiều nhất
- Bar chart ngang
- Số lượng báo cáo mỗi cơ sở

**3. Top Drugs Chart**
- Thuốc nghi ngờ gây ADR nhiều nhất
- Bar chart
- Tên thuốc và số lần xuất hiện

**4. Occupation Analysis Chart**
- Phân tích theo nghề nghiệp người báo cáo
- Horizontal bar chart
- Bác sĩ, Dược sĩ, Y tá, etc.

**5. Monthly Trends Chart**
- Xu hướng báo cáo theo tháng
- Line chart
- So sánh giữa các tháng

**6. Severity Level Chart**
- Phân bố mức độ nghiêm trọng
- Pie chart
- Mild, Moderate, Severe, Life-threatening

**7. Outcome Distribution Chart**
- Phân bố kết quả sau xử trí
- Donut chart
- Recovered, Recovering, Not recovered, Fatal

**8. Age Distribution Chart**
- Phân bố theo nhóm tuổi
- Bar chart
- 0-18, 19-35, 36-60, 60+

**9. Drug Distribution Chart**
- Phân loại thuốc theo nhóm
- Pie chart
- Antibiotics, Analgesics, etc.

#### Dashboard Stats Cards:

**Tổng quan:**
- Total Reports
- New Reports This Month
- Total Users
- Critical Reports
- Growth Rate

**Real-time Updates:**
- Dữ liệu cập nhật theo thời gian thực
- Refresh button
- Loading states

**Filters:**
- Date range filter
- Organization filter (cho admin)
- Severity filter

---

### 6. 📰 Quản lý Thông tin ADR

#### Mô tả
Chia sẻ kiến thức, tin tức, hướng dẫn về ADR.

#### Loại thông tin:

**Types:**
- News (Tin tức)
- Guidelines (Hướng dẫn)
- Alerts (Cảnh báo)
- Updates (Cập nhật)
- Education (Đào tạo)

**Content Management:**
- Title & Summary
- Full content (rich text)
- Featured image
- Attachments (files)
- Tags
- Target audience
- Priority level (1-5)

**Publishing:**
- Draft/Published status
- Publish date
- Expiry date
- Pin to homepage
- Show on homepage

**Engagement:**
- View count
- Likes count
- Comments (future)
- Share (future)

**SEO:**
- Meta keywords
- Meta description
- URL slug
- Open Graph tags

---

### 7. 🔔 Hệ thống Thông báo

#### Mô tả
Notifications real-time cho users về các sự kiện quan trọng.

#### Notification Types:

**1. New Report**
- Báo cáo mới được tạo
- Người báo cáo → Admin

**2. Report Update**
- Báo cáo được cập nhật
- Admin → Người tạo

**3. Report Approved**
- Báo cáo được duyệt
- Admin → Người tạo

**4. Report Rejected**
- Báo cáo bị từ chối
- Admin → Người tạo

**5. New Comment**
- Bình luận mới trên báo cáo
- Commenter → Report owner

**6. System Announcement**
- Thông báo hệ thống
- Admin → All users

**7. Daily Challenge**
- Daily quiz reminder
- System → All users

**Features:**
- ✅ Real-time notifications
- ✅ Notification bell with count
- ✅ Mark as read
- ✅ Mark all as read
- ✅ Notification list
- ✅ Click to navigate to content
- ✅ Timestamp (relative time)

---

### 8. 👥 Quản lý Người dùng

#### Mô tả
Quản lý tài khoản người dùng và phân quyền.

#### User Roles:

**1. Admin (Sở Y tế)**
- Xem tất cả báo cáo ADR
- Sửa/xóa mọi báo cáo
- Quản lý người dùng
- Quản lý quiz questions
- Truy cập Dashboard
- Quản lý thông tin ADR
- Xem analytics

**2. User (Đơn vị y tế)**
- Tạo báo cáo ADR
- Xem/sửa báo cáo của mình
- Tạo thẻ dị ứng
- Tham gia quiz
- Xem dashboard cơ bản
- Nhận notifications

#### User Management (Admin):

**Features:**
- ✅ Create user
- ✅ Edit user
- ✅ Delete user
- ✅ Change role
- ✅ Reset password
- ✅ View user activity
- ✅ Filter/Search users
- ✅ Export user list

**User Profile:**
- Name
- Email
- Role
- Organization
- Phone
- Created date
- Last login
- Activity stats

**Password Management:**
- ✅ Change password
- ✅ Reset password (email link)
- ✅ Password strength validation
- ✅ Bcrypt hashing
- ✅ Password expiry (optional)

---

### 9. 📧 Email Service

#### Mô tả
Gửi email tự động cho các sự kiện quan trọng.

#### Email Templates:

**1. ADR Report Email**
- HTML template đẹp
- Thông tin báo cáo đầy đủ
- Gửi đến di.pvcenter@gmail.com
- Custom recipient

**2. Welcome Email**
- Chào mừng user mới
- Hướng dẫn sử dụng cơ bản

**3. Password Reset**
- Link reset password
- Token có thời hạn

**4. Report Status Update**
- Thông báo thay đổi trạng thái báo cáo
- Lý do (nếu rejected)

**5. Weekly Digest**
- Tóm tắt hoạt động tuần
- Top reports
- Statistics

**Email Service:**
- SMTP configuration
- Nodemailer
- HTML templates
- Retry logic
- Error handling
- Development mode (Ethereal)
- Production mode (Gmail/Custom SMTP)

---

### 10. 📄 Export PDF/DOCX

#### Mô tả
Xuất báo cáo và thẻ dị ứng ra file PDF hoặc DOCX.

#### Export Types:

**1. ADR Report PDF**
- Phiếu báo cáo đầy đủ
- Format theo Bộ Y tế
- Logo và header
- All sections included
- Signature areas

**2. Allergy Card PDF**
- Mẫu thẻ theo Thông tư 51/2017/TT-BYT
- QR code embedded
- Print-ready
- Two-sided layout option

**3. DOCX Export**
- Editable format
- Template-based
- Standard formatting
- Compatible với MS Word

**Technologies:**
- jsPDF - PDF generation
- html2canvas - HTML to image
- docx - DOCX generation
- file-saver - Download files

---

## 📁 Cấu trúc dự án

```
Codex-ADR/
├── app/                              # Next.js App Router
│   ├── admin/                       # Admin pages
│   │   ├── adr-information/        # Quản lý thông tin ADR
│   │   ├── check-adr/              # Kiểm tra ADR
│   │   ├── quiz/                   # Quản lý quiz
│   │   ├── simple-check/           # Kiểm tra đơn giản
│   │   ├── test-basic/             # Test cơ bản
│   │   └── users/                  # Quản lý người dùng
│   │
│   ├── adr-information/            # Thông tin ADR (public)
│   │   ├── [id]/                   # Chi tiết thông tin
│   │   └── page.tsx                # Danh sách thông tin
│   │
│   ├── allergy-cards/              # Thẻ dị ứng
│   │   ├── [id]/                   # Chi tiết thẻ (authenticated)
│   │   ├── new/                    # Tạo thẻ mới
│   │   ├── scan/                   # Quét QR
│   │   ├── view/[id]/              # Xem thẻ (public)
│   │   └── page.tsx                # Danh sách thẻ
│   │
│   ├── api/                         # API Routes
│   │   ├── admin/                  # Admin APIs
│   │   │   ├── quiz/               # Quiz management APIs
│   │   │   └── users/              # User management APIs
│   │   │
│   │   ├── adr-information/        # ADR Info APIs
│   │   │   ├── [id]/               # Get/Update/Delete info
│   │   │   ├── like/               # Like info
│   │   │   └── route.ts            # List/Create info
│   │   │
│   │   ├── ai/                     # AI APIs
│   │   │   ├── assessment-suggestion/  # AI assessment
│   │   │   └── chatbot/            # AI chatbot
│   │   │
│   │   ├── allergy-cards/          # Allergy card APIs
│   │   │   ├── [id]/               # Get/Update/Delete card
│   │   │   ├── lookup/[code]/      # Lookup by code (public)
│   │   │   └── route.ts            # List/Create card
│   │   │
│   │   ├── auth/                   # NextAuth endpoints
│   │   │   └── [...nextauth]/      # NextAuth config
│   │   │
│   │   ├── dashboard/              # Dashboard APIs
│   │   │   ├── charts/             # Chart data
│   │   │   └── stats/              # Statistics
│   │   │
│   │   ├── notifications/          # Notification APIs
│   │   │   ├── [id]/mark-read/    # Mark as read
│   │   │   └── route.ts            # List notifications
│   │   │
│   │   ├── quiz/                   # Quiz APIs
│   │   │   ├── categories/         # Quiz categories
│   │   │   ├── daily-challenges/   # Daily challenges
│   │   │   ├── leaderboards/       # Leaderboards
│   │   │   ├── questions/          # Quiz questions
│   │   │   └── sessions/           # Quiz sessions
│   │   │
│   │   └── reports/                # ADR report APIs
│   │       ├── [id]/               # Get/Update/Delete report
│   │       ├── email/              # Send report email
│   │       └── route.ts            # List/Create report
│   │
│   ├── auth/                        # Auth pages
│   │   ├── login/                  # Login page
│   │   └── register/               # Register page
│   │
│   ├── check-adr-system/           # System check
│   ├── dashboard/                  # Dashboard page
│   ├── notifications/              # Notifications page
│   ├── profile/                    # User profile
│   │   └── change-password/        # Change password
│   │
│   ├── reports/                    # ADR Reports
│   │   ├── [id]/                   # Report detail
│   │   ├── new/                    # Create report
│   │   └── page.tsx                # Report list
│   │
│   ├── test-adr/                   # Test pages
│   ├── training/                   # Quiz & Training
│   ├── unauthorized/               # Unauthorized page
│   │
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Homepage
│   └── providers.tsx               # Context providers
│
├── components/                      # React Components
│   ├── admin/                      # Admin components
│   │   ├── PasswordManagement.tsx
│   │   ├── QuizManagement.tsx
│   │   ├── UserForm.tsx
│   │   └── UserList.tsx
│   │
│   ├── ai/                         # AI components
│   │   └── AIChatbot.tsx          # AI Chatbot UI
│   │
│   ├── charts/                     # Chart components
│   │   ├── AgeDistributionChart.tsx
│   │   ├── DashboardCharts.tsx
│   │   ├── DrugDistributionChart.tsx
│   │   ├── MonthlyTrendsChart.tsx
│   │   ├── OccupationAnalysisChart.tsx
│   │   ├── OutcomeDistributionChart.tsx
│   │   ├── ReportsByDateChart.tsx
│   │   ├── SeverityLevelChart.tsx
│   │   ├── Top10FacilitiesChart.tsx
│   │   └── TopDrugsChart.tsx
│   │
│   ├── dashboard/                  # Dashboard components
│   │   └── DashboardClient.tsx
│   │
│   ├── forms/                      # Form components
│   │   ├── ADRDetailsSection.tsx   # Phần B
│   │   ├── AssessmentSection.tsx   # Phần E
│   │   ├── PatientInfoSection.tsx  # Phần A
│   │   ├── ReporterInfoSection.tsx # Phần F
│   │   └── SuspectedDrugsSection.tsx # Phần C
│   │
│   ├── layout/                     # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   │
│   ├── quiz/                       # Quiz components
│   │   ├── QuizGame.tsx           # Quiz gameplay
│   │   └── QuizHub.tsx            # Quiz hub/menu
│   │
│   ├── reports/                    # Report components
│   │   ├── ReportCard.tsx
│   │   ├── ReportDetail.tsx
│   │   ├── ReportFilters.tsx
│   │   └── ReportList.tsx
│   │
│   └── ui/                         # UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── LoadingSpinner.tsx
│       ├── Modal.tsx
│       ├── QRScanner.tsx          # QR Scanner component
│       ├── Select.tsx
│       ├── Table.tsx
│       ├── Tabs.tsx
│       └── Toast.tsx
│
├── hooks/                          # Custom React hooks
│   └── useNotifications.ts        # Notifications hook
│
├── lib/                            # Service & Utility libraries
│   ├── adr-quiz-service.ts        # Quiz service
│   ├── ai-assessment-service.ts   # AI assessment
│   ├── ai-chatbot-service.ts      # AI chatbot
│   ├── allergy-card-pdf-service.ts # PDF generation
│   ├── allergy-card-print-template.ts # Print template
│   ├── auth-config.ts             # NextAuth config
│   ├── config.ts                  # App config
│   ├── email-service.ts           # Email service
│   ├── qr-card-service.ts         # QR service
│   ├── qr-drive-service.ts        # Google Drive service
│   └── supabase.ts                # Supabase client
│
├── middleware.ts                   # Next.js middleware (auth)
│
├── public/                         # Static files
│   ├── favicon.ico
│   └── Logo.png
│
├── scripts/                        # Utility scripts
│   ├── admin-api-examples.js
│   ├── ai-question-generator.py
│   ├── check-env-variables.js
│   ├── quiz-question-generator.js
│   ├── system-check.js
│   └── test-*.js                  # Test scripts
│
├── supabase/                       # Database schemas & migrations
│   ├── schema.sql                 # Main schema
│   ├── adr-training-quiz-schema.sql
│   ├── demo-users.sql
│   ├── demo-reports.sql
│   ├── FIX-ALL-ALLERGY-ERRORS.sql
│   └── *.sql                      # Other migrations
│
├── types/                          # TypeScript types
│   ├── adr-information.ts
│   ├── allergy-card.ts
│   ├── concurrent-drug.ts
│   ├── next-auth.d.ts
│   ├── notification.ts
│   ├── quiz.ts
│   ├── report.ts
│   ├── supabase.ts
│   └── user.ts
│
├── .env.local                      # Environment variables
├── next.config.js                  # Next.js config
├── package.json                    # Dependencies
├── tailwind.config.js              # Tailwind config
├── tsconfig.json                   # TypeScript config
└── vercel.json                     # Vercel config
```

---

## 💾 Database Schema

### Bảng chính (Main Tables)

#### 1. **users** - Người dùng
```sql
- id: UUID (PK)
- email: VARCHAR (UNIQUE, NOT NULL)
- name: VARCHAR (NOT NULL)
- role: user_role ('admin' | 'user')
- organization: VARCHAR
- phone: VARCHAR
- password_hash: VARCHAR
- reset_token: VARCHAR
- reset_token_expires: TIMESTAMP
- password_updated_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. **adr_reports** - Báo cáo ADR
```sql
- id: UUID (PK)
- report_code: VARCHAR (UNIQUE, AUTO-GEN)
- reporter_id: UUID (FK → users)
- organization: VARCHAR

-- Phần A: Thông tin bệnh nhân
- patient_name: VARCHAR
- patient_birth_date: DATE
- patient_age: INTEGER
- patient_gender: gender ('male' | 'female' | 'other')
- patient_weight: NUMERIC

-- Phần B: Thông tin ADR
- adr_occurrence_date: DATE
- adr_description: TEXT
- related_tests: TEXT
- medical_history: TEXT
- treatment_response: TEXT
- severity_level: severity_level
- outcome_after_treatment: outcome
- reaction_onset_time: TEXT

-- Phần E: Thẩm định
- causality_assessment: causality
- assessment_scale: assessment_scale
- medical_staff_comment: TEXT

-- Phần F: Người báo cáo
- reporter_name: VARCHAR
- reporter_profession: VARCHAR
- reporter_phone: VARCHAR
- reporter_email: VARCHAR
- report_type: report_type
- report_date: DATE

- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. **suspected_drugs** - Thuốc nghi ngờ (Phần C)
```sql
- id: UUID (PK)
- report_id: UUID (FK → adr_reports)
- drug_name: VARCHAR
- commercial_name: VARCHAR
- dosage_form: VARCHAR
- manufacturer: VARCHAR
- batch_number: VARCHAR
- dosage_and_frequency: TEXT
- route_of_administration: VARCHAR
- start_date: DATE
- end_date: DATE
- indication: TEXT
- reaction_improved_after_stopping: yes_no_unknown
- reaction_reoccurred_after_rechallenge: yes_no_unknown
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 4. **concurrent_drugs** - Thuốc dùng đồng thời (Phần D)
```sql
- id: UUID (PK)
- report_id: UUID (FK → adr_reports)
- drug_name: TEXT
- dosage_form_strength: TEXT
- start_date: DATE
- end_date: DATE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 5. **allergy_cards** - Thẻ dị ứng
```sql
- id: UUID (PK)
- card_code: VARCHAR (UNIQUE, AUTO-GEN: AC-YYYY-XXXXXX)
- report_id: UUID (FK → adr_reports, nullable)

-- Thông tin bệnh nhân
- patient_name: VARCHAR
- patient_gender: VARCHAR
- patient_age: INTEGER
- patient_id_number: VARCHAR

-- Thông tin cơ sở y tế
- hospital_name: VARCHAR
- department: VARCHAR
- doctor_name: VARCHAR
- doctor_phone: VARCHAR

-- Thông tin thẻ
- issued_date: DATE
- issued_by_user_id: UUID (FK → users)
- organization: VARCHAR
- qr_code_data: TEXT (nullable)
- qr_code_url: TEXT
- google_drive_url: TEXT
- status: VARCHAR ('active' | 'inactive' | 'expired')
- expiry_date: DATE
- notes: TEXT

- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 6. **card_allergies** - Dị ứng trên thẻ
```sql
- id: UUID (PK)
- card_id: UUID (FK → allergy_cards)
- allergen_name: VARCHAR (tên dị nguyên/thuốc)
- certainty_level: VARCHAR ('suspected' | 'confirmed')
- clinical_manifestation: TEXT (biểu hiện lâm sàng)
- severity_level: VARCHAR ('mild' | 'moderate' | 'severe' | 'life_threatening')
- reaction_type: VARCHAR
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Bảng Quiz & Training

#### 7. **quiz_categories** - Danh mục quiz
```sql
- id: UUID (PK)
- name: VARCHAR
- category_key: quiz_category
- description: TEXT
- icon_name: VARCHAR
- color_scheme: VARCHAR
- total_questions: INTEGER
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 8. **quiz_questions** - Câu hỏi quiz
```sql
- id: UUID (PK)
- category_id: UUID (FK → quiz_categories)
- question_text: TEXT
- question_type: quiz_question_type ('multiple_choice' | 'true_false' | 'case_scenario')
- difficulty: quiz_difficulty ('beginner' | 'intermediate' | 'advanced' | 'expert')
- options: JSONB (array of options)
- correct_answer: VARCHAR
- explanation: TEXT
- reference_source: TEXT
- learning_points: TEXT[]
- estimated_time_seconds: INTEGER
- points_value: INTEGER
- times_answered: INTEGER
- times_correct: INTEGER
- is_active: BOOLEAN
- created_by: UUID (FK → users)
- reviewed_by: UUID (FK → users)
- review_status: VARCHAR
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 9. **quiz_sessions** - Phiên quiz
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- category_id: UUID (FK → quiz_categories)
- session_name: VARCHAR
- difficulty_level: quiz_difficulty
- total_questions: INTEGER
- time_limit_seconds: INTEGER
- questions_answered: INTEGER
- correct_answers: INTEGER
- total_score: INTEGER
- time_taken_seconds: INTEGER
- completion_percentage: DECIMAL
- status: VARCHAR ('in_progress' | 'completed' | 'abandoned')
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- created_at: TIMESTAMP
```

#### 10. **quiz_answers** - Câu trả lời
```sql
- id: UUID (PK)
- session_id: UUID (FK → quiz_sessions)
- question_id: UUID (FK → quiz_questions)
- selected_answer: VARCHAR
- is_correct: BOOLEAN
- points_earned: INTEGER
- time_taken_seconds: INTEGER
- was_skipped: BOOLEAN
- hint_used: BOOLEAN
- explanation_viewed: BOOLEAN
- answered_at: TIMESTAMP
```

#### 11. **user_quiz_stats** - Thống kê quiz của user
```sql
- id: UUID (PK)
- user_id: UUID (FK → users, UNIQUE)
- total_sessions: INTEGER
- total_questions_answered: INTEGER
- total_correct_answers: INTEGER
- total_points_earned: INTEGER
- average_score: DECIMAL
- category_stats: JSONB
- current_streak: INTEGER
- longest_streak: INTEGER
- last_activity_date: DATE
- total_time_spent_seconds: INTEGER
- average_time_per_question: DECIMAL
- current_rank: INTEGER
- best_rank: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 12. **quiz_achievements** - Thành tích
```sql
- id: UUID (PK)
- achievement_key: VARCHAR (UNIQUE)
- name: VARCHAR
- description: TEXT
- achievement_type: achievement_type
- criteria: JSONB
- points_reward: INTEGER
- badge_icon: VARCHAR
- badge_color: VARCHAR
- is_active: BOOLEAN
- rarity: VARCHAR
- created_at: TIMESTAMP
```

#### 13. **user_achievements** - Thành tích của user
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- achievement_id: UUID (FK → quiz_achievements)
- earned_from_session: UUID (FK → quiz_sessions)
- points_earned: INTEGER
- progress: JSONB
- is_notified: BOOLEAN
- earned_at: TIMESTAMP
```

#### 14. **quiz_daily_challenges** - Thử thách hàng ngày
```sql
- id: UUID (PK)
- challenge_date: DATE (UNIQUE)
- title: VARCHAR
- description: TEXT
- category_id: UUID (FK → quiz_categories)
- difficulty: quiz_difficulty
- question_count: INTEGER
- time_limit_seconds: INTEGER
- base_points: INTEGER
- bonus_multiplier: DECIMAL
- selected_questions: UUID[]
- participants_count: INTEGER
- completions_count: INTEGER
- average_score: DECIMAL
- is_active: BOOLEAN
- created_at: TIMESTAMP
```

#### 15. **user_challenge_participation** - Tham gia thử thách
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- challenge_id: UUID (FK → quiz_daily_challenges)
- session_id: UUID (FK → quiz_sessions)
- score: INTEGER
- completion_time_seconds: INTEGER
- rank_in_challenge: INTEGER
- bonus_points: INTEGER
- completed_at: TIMESTAMP
```

#### 16. **quiz_leaderboards** - Bảng xếp hạng
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- leaderboard_type: VARCHAR
- category_id: UUID (FK → quiz_categories, nullable)
- time_period: VARCHAR
- total_score: INTEGER
- questions_answered: INTEGER
- accuracy_percentage: DECIMAL
- average_time: DECIMAL
- rank_position: INTEGER
- rank_change: INTEGER
- calculated_at: TIMESTAMP
```

### Bảng Thông tin ADR

#### 17. **adr_information** - Thông tin ADR
```sql
- id: UUID (PK)
- title: VARCHAR
- summary: TEXT
- content: TEXT
- type: information_type ('news' | 'guidelines' | 'alerts' | 'updates' | 'education')
- priority: INTEGER (1-5)
- tags: TEXT[]
- featured_image_url: TEXT
- attachments: JSONB
- status: information_status ('draft' | 'published' | 'archived')
- published_at: TIMESTAMP
- expires_at: TIMESTAMP
- created_by_user_id: UUID (FK → users)
- author_name: VARCHAR
- author_organization: VARCHAR
- target_audience: TEXT[]
- is_pinned: BOOLEAN
- show_on_homepage: BOOLEAN
- view_count: INTEGER
- likes_count: INTEGER
- meta_keywords: VARCHAR
- meta_description: VARCHAR
- slug: VARCHAR (UNIQUE)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 18. **information_views** - Lượt xem thông tin
```sql
- id: UUID (PK)
- information_id: UUID (FK → adr_information)
- user_id: UUID (FK → users, nullable)
- user_ip: VARCHAR
- viewed_at: TIMESTAMP
- read_duration_seconds: INTEGER
```

#### 19. **information_likes** - Lượt thích
```sql
- id: UUID (PK)
- information_id: UUID (FK → adr_information)
- user_id: UUID (FK → users)
- liked_at: TIMESTAMP
```

### Bảng Notifications

#### 20. **notifications** - Thông báo
```sql
- id: UUID (PK)
- recipient_id: UUID (FK → users)
- sender_id: UUID (FK → users, nullable)
- type: notification_type
- title: TEXT
- message: TEXT
- data: JSONB (additional data)
- read: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Enum Types

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Gender
CREATE TYPE gender AS ENUM ('male', 'female', 'other');

-- Severity levels
CREATE TYPE severity_level AS ENUM (
  'mild',
  'moderate', 
  'severe',
  'life_threatening'
);

-- Outcomes
CREATE TYPE outcome AS ENUM (
  'recovered',
  'recovering',
  'not_recovered',
  'recovered_with_sequelae',
  'fatal',
  'unknown'
);

-- Causality assessment (WHO-UMC)
CREATE TYPE causality AS ENUM (
  'certain',
  'probable',
  'possible',
  'unlikely',
  'unassessable',
  'unclassifiable'
);

-- Assessment scales
CREATE TYPE assessment_scale AS ENUM (
  'who_umc',
  'naranjo',
  'both'
);

-- Report types
CREATE TYPE report_type AS ENUM (
  'spontaneous',
  'solicited',
  'study',
  'literature'
);

-- Yes/No/Unknown
CREATE TYPE yes_no_unknown AS ENUM ('yes', 'no', 'unknown');

-- Quiz difficulty
CREATE TYPE quiz_difficulty AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

-- Quiz categories
CREATE TYPE quiz_category AS ENUM (
  'who_umc',
  'naranjo',
  'drug_knowledge',
  'case_studies',
  'regulations',
  'general'
);

-- Quiz question types
CREATE TYPE quiz_question_type AS ENUM (
  'multiple_choice',
  'true_false',
  'case_scenario'
);

-- Achievement types
CREATE TYPE achievement_type AS ENUM (
  'score_based',
  'streak_based',
  'category_mastery',
  'speed_based',
  'participation'
);

-- Information types
CREATE TYPE information_type AS ENUM (
  'news',
  'guidelines',
  'alerts',
  'updates',
  'education'
);

-- Information status
CREATE TYPE information_status AS ENUM (
  'draft',
  'published',
  'archived'
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'new_report',
  'report_update',
  'report_approved',
  'report_rejected',
  'new_comment',
  'system_announcement',
  'daily_challenge',
  'achievement_earned'
);
```

### Database Functions & Triggers

**1. Auto-generate Report Code**
```sql
-- Format: ADR-YYYY-NNNNNN
-- Example: ADR-2025-000001
```

**2. Auto-generate Card Code**
```sql
-- Format: AC-YYYY-NNNNNN
-- Example: AC-2025-000001
```

**3. Update Timestamps**
```sql
-- Auto-update updated_at on row changes
```

**4. Update Quiz Statistics**
```sql
-- Auto-update user_quiz_stats after quiz session
```

**5. Update Information Counts**
```sql
-- Auto-update view_count and likes_count
```

### Row Level Security (RLS)

**Enabled on all tables với policies:**

**users:**
- Users can view their own data
- Admins can view all users

**adr_reports:**
- Users can view/edit their own reports
- Admins can view/edit all reports

**allergy_cards:**
- Users can view/edit their own cards
- Admins can view/edit all cards
- Public can view via QR lookup

**quiz_* tables:**
- Users can view/edit their own quiz data
- Admins can view all quiz data

**notifications:**
- Users can view their own notifications
- System can create notifications

---

## 🔐 Hệ thống Xác thực và Phân quyền

### NextAuth.js Configuration

**Provider:** Credentials Provider (email/password)

**Session Strategy:** JWT (JSON Web Tokens)

**Session Duration:** 24 hours

### Authentication Flow

```
1. User nhập email/password
   ↓
2. NextAuth gửi đến authorize() function
   ↓
3. Query Supabase để lấy user by email
   ↓
4. Verify password với bcrypt
   ↓
5. Trả về user object (id, email, name, role, organization)
   ↓
6. JWT token được tạo với user info
   ↓
7. Session được lưu trong cookie
   ↓
8. Client có thể access session via useSession()
```

### Middleware Protection

**File:** `middleware.ts`

**Protected Routes:**
- `/admin/*` - Admin only
- `/dashboard/*` - Admin & User
- `/reports/*` - Admin & User
- `/allergy-cards/*` - Admin & User (except /view/[id])
- `/training/*` - Admin & User
- `/profile/*` - Admin & User

**Public Routes:**
- `/auth/login`
- `/auth/register`
- `/allergy-cards/view/[id]` - Public QR lookup
- `/api/allergy-cards/view/[id]` - Public API

**Unauthorized:**
- Redirect to `/auth/login`
- Or `/unauthorized` if logged in but no permission

### Role-based Access Control (RBAC)

#### Admin Role
```typescript
role: 'admin'

Permissions:
- View all ADR reports
- Edit/Delete any report
- View all allergy cards
- Manage users (CRUD)
- Manage quiz questions
- View analytics
- Access admin dashboard
- Manage ADR information
- Send notifications
```

#### User Role
```typescript
role: 'user'

Permissions:
- Create ADR reports
- View/Edit own reports
- Create allergy cards
- View/Edit own cards
- Participate in quiz
- View basic dashboard
- View ADR information
- Receive notifications
```

### Password Security

**Hashing:** bcrypt (salt rounds: 10)

**Requirements:**
- Minimum 8 characters
- Mix of letters and numbers (recommended)
- Special characters (recommended)

**Features:**
- Password reset via email
- Reset token expiry (1 hour)
- Password change in profile
- Password updated timestamp

### API Protection

**All API routes check session:**
```typescript
const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Admin-only APIs:**
```typescript
if (session.user?.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Row-level checks:**
```typescript
// Users can only access their own data
if (session.user?.role !== 'admin' && resource.user_id !== session.user?.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## 🔌 API Endpoints

### Authentication

#### `POST /api/auth/login`
Login user
- Body: `{ email, password }`
- Returns: Session token

#### `POST /api/auth/register`
Register new user
- Body: `{ name, email, password, organization, phone }`
- Returns: User object

#### `POST /api/auth/logout`
Logout user
- Clears session

### ADR Reports

#### `GET /api/reports`
List reports
- Query: `?page=1&limit=10&search=&severity=`
- Auth: Required
- Returns: Paginated list of reports

#### `POST /api/reports`
Create new report
- Body: Complete ADR report data
- Auth: Required
- Returns: Created report with ID

#### `GET /api/reports/[id]`
Get report detail
- Auth: Required
- Permission: Own report or Admin
- Returns: Full report data with drugs

#### `PUT /api/reports/[id]`
Update report
- Body: Updated report data
- Auth: Required
- Permission: Own report or Admin
- Returns: Updated report

#### `DELETE /api/reports/[id]`
Delete report
- Auth: Required
- Permission: Own report or Admin
- Returns: Success message

#### `POST /api/reports/email`
Send report via email
- Body: `{ reportId, recipientEmail }`
- Auth: Required
- Returns: Success message

### Allergy Cards

#### `GET /api/allergy-cards`
List allergy cards
- Query: `?page=1&limit=10`
- Auth: Required
- Returns: Paginated list of cards

#### `POST /api/allergy-cards`
Create new allergy card
- Body: Card data with allergies
- Auth: Required
- Returns: Created card with QR code

#### `GET /api/allergy-cards/[id]`
Get card detail
- Auth: Required
- Permission: Own card or Admin
- Returns: Full card data

#### `GET /api/allergy-cards/lookup/[code]` ⭐
Lookup card by code (PUBLIC)
- No auth required
- Returns: Card data for QR scanning

#### `PUT /api/allergy-cards/[id]`
Update card
- Body: Updated card data
- Auth: Required
- Permission: Own card or Admin
- Returns: Updated card

#### `DELETE /api/allergy-cards/[id]`
Delete card
- Auth: Required
- Permission: Own card or Admin
- Returns: Success message

### AI Services

#### `POST /api/ai/chatbot`
Chat with AI consultant
- Body: `{ message, context, provider, chatHistory }`
- Auth: Required
- Returns: AI response

#### `POST /api/ai/assessment-suggestion`
Get AI assessment suggestion
- Body: ADR report data
- Auth: Required
- Returns: Naranjo score and WHO-UMC classification

#### `GET /api/ai/assessment-suggestion`
Get capabilities
- Auth: Required
- Returns: Available AI features

### Quiz & Training

#### `GET /api/quiz/categories`
List quiz categories
- Auth: Required
- Returns: List of categories with stats

#### `POST /api/quiz/sessions`
Start quiz session
- Body: `{ categoryId, difficulty, questionCount, timeLimit }`
- Auth: Required
- Returns: Session with questions

#### `POST /api/quiz/sessions/[id]/answers`
Submit answer
- Body: `{ questionId, selectedAnswer, timeTaken }`
- Auth: Required
- Returns: Answer result with points

#### `POST /api/quiz/sessions/[id]/complete`
Complete quiz session
- Auth: Required
- Returns: Final score and stats

#### `GET /api/quiz/leaderboards`
Get leaderboards
- Query: `?type=overall&period=all-time&category=`
- Auth: Required
- Returns: Ranked list of users

#### `GET /api/quiz/daily-challenges`
Get daily challenge
- Auth: Required
- Returns: Today's challenge

### Dashboard

#### `GET /api/dashboard/stats`
Get dashboard statistics
- Auth: Required
- Returns: Total reports, users, critical reports, growth rate

#### `GET /api/dashboard/charts`
Get chart data
- Auth: Required
- Returns: Data for all charts

### Admin

#### `GET /api/admin/users`
List all users
- Auth: Admin only
- Returns: List of users with stats

#### `POST /api/admin/users`
Create user
- Body: User data
- Auth: Admin only
- Returns: Created user

#### `PUT /api/admin/users/[id]`
Update user
- Body: Updated user data
- Auth: Admin only
- Returns: Updated user

#### `DELETE /api/admin/users/[id]`
Delete user
- Auth: Admin only
- Returns: Success message

#### `POST /api/admin/users/[id]/reset-password`
Reset user password
- Auth: Admin only
- Returns: New password or reset link

#### `GET /api/admin/quiz/analytics`
Get quiz analytics
- Auth: Admin only
- Returns: Comprehensive quiz statistics

### ADR Information

#### `GET /api/adr-information`
List ADR information
- Query: `?type=&featured=&limit=`
- Public or Auth
- Returns: List of information articles

#### `POST /api/adr-information`
Create information
- Body: Information data
- Auth: Admin only
- Returns: Created information

#### `GET /api/adr-information/[id]`
Get information detail
- Public
- Returns: Full information with related data

#### `PUT /api/adr-information/[id]`
Update information
- Body: Updated data
- Auth: Admin only
- Returns: Updated information

#### `DELETE /api/adr-information/[id]`
Delete information
- Auth: Admin only
- Returns: Success message

#### `POST /api/adr-information/[id]/like`
Like information
- Auth: Required
- Returns: Updated like count

### Notifications

#### `GET /api/notifications`
Get user notifications
- Auth: Required
- Returns: List of notifications

#### `POST /api/notifications/[id]/mark-read`
Mark notification as read
- Auth: Required
- Returns: Updated notification

#### `POST /api/notifications/mark-all-read`
Mark all as read
- Auth: Required
- Returns: Success message

---

## 📥 Hướng dẫn cài đặt

### Yêu cầu hệ thống

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **PostgreSQL**: 14.x or higher (via Supabase)
- **Git**: Latest version

### Bước 1: Clone Repository

```bash
git clone <repository-url>
cd Codex-ADR
```

### Bước 2: Cài đặt Dependencies

```bash
npm install
```

### Bước 3: Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục root:

```bash
# ============================================
# SUPABASE (Required)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ============================================
# NEXTAUTH (Required)
# ============================================
NEXTAUTH_SECRET=your_random_secret_at_least_32_characters
NEXTAUTH_URL=http://localhost:3000

# ============================================
# EMAIL (Optional - for email features)
# ============================================
EMAIL_FROM=noreply@adrsystem.gov.vn
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# ============================================
# AI SERVICES (Optional - for AI features)
# ============================================
OPENAI_API_KEY=your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# ============================================
# GOOGLE DRIVE (Optional - for QR storage)
# ============================================
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@...
GOOGLE_PRIVATE_KEY=your_private_key
```

### Bước 4: Setup Supabase Database

#### 4.1. Tạo Supabase Project

1. Truy cập [supabase.com](https://supabase.com)
2. Tạo project mới
3. Copy URL và Keys vào `.env.local`

#### 4.2. Chạy Database Migrations

1. Vào Supabase Dashboard → SQL Editor
2. Chạy các file SQL theo thứ tự:

```sql
-- 1. Main schema
supabase/schema.sql

-- 2. Quiz system
supabase/adr-training-quiz-schema.sql

-- 3. Demo users
supabase/demo-users.sql

-- 4. Demo data (optional)
supabase/demo-reports.sql

-- 5. Fixes (if needed)
supabase/FIX-ALL-ALLERGY-ERRORS.sql
```

#### 4.3. Cấu hình Authentication

1. Supabase Dashboard → Authentication → Providers
2. Enable Email provider
3. Disable "Confirm email" (hoặc cấu hình SMTP)

#### 4.4. Cấu hình Storage (Optional)

1. Supabase Dashboard → Storage
2. Create bucket: `allergy-cards`
3. Set public access policies

### Bước 5: Tạo NEXTAUTH_SECRET

```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Paste vào .env.local
NEXTAUTH_SECRET=<generated_secret>
```

### Bước 6: Chạy Development Server

```bash
npm run dev
```

Mở browser: `http://localhost:3000`

### Bước 7: Test Login

**Admin account:**
- Email: `admin@soyte.gov.vn`
- Password: `admin123`

**User account:**
- Email: `user@benhvien.gov.vn`
- Password: `user123`

### Bước 8: Kiểm tra hệ thống

```bash
# Run system check script
node scripts/system-check.js
```

### Troubleshooting

#### Lỗi: "Cannot connect to Supabase"
```bash
✅ Check SUPABASE_URL và SUPABASE_ANON_KEY
✅ Verify Supabase project is active
✅ Check network connection
```

#### Lỗi: "Users table does not exist"
```bash
✅ Chạy lại schema.sql trong SQL Editor
✅ Check table đã được tạo trong Table Editor
```

#### Lỗi: "Login failed"
```bash
✅ Chạy demo-users.sql để tạo test accounts
✅ Check password_hash column exists
✅ Verify bcrypt is working
```

#### Lỗi: "Module not found"
```bash
✅ Xóa node_modules và package-lock.json
✅ npm install lại
✅ Restart dev server
```

---

## 📖 Hướng dẫn sử dụng

### Cho Admin (Sở Y tế)

#### 1. Đăng nhập Admin
1. Truy cập `/auth/login`
2. Email: `admin@soyte.gov.vn`
3. Password: `admin123`

#### 2. Quản lý Users
1. Sidebar → Admin → Users
2. Xem danh sách users
3. Tạo user mới
4. Sửa/xóa user
5. Reset password
6. Thay đổi role

#### 3. Xem tất cả Reports
1. Sidebar → Reports
2. Xem tất cả báo cáo ADR từ mọi đơn vị
3. Filter theo severity, date, organization
4. Search theo mã, tên bệnh nhân, thuốc
5. Click vào report để xem chi tiết
6. Sửa/xóa report
7. Export PDF/DOCX
8. Gửi email

#### 4. Xem Dashboard
1. Sidebar → Dashboard
2. Xem overview statistics
3. Xem tất cả biểu đồ:
   - Reports by Date
   - Top 10 Facilities
   - Top Drugs
   - Occupation Analysis
   - Monthly Trends
   - Severity Distribution
   - Outcome Distribution
   - Age Distribution
   - Drug Distribution

#### 5. Quản lý Quiz
1. Sidebar → Admin → Quiz Management
2. Tab Questions:
   - Xem danh sách câu hỏi
   - Tạo câu hỏi mới
   - Sửa/xóa câu hỏi
   - Review questions
   - Filter by category, difficulty
3. Tab Categories:
   - Xem categories
   - Create/Edit categories
4. Tab Analytics:
   - Question performance
   - User engagement
   - Success rates

#### 6. Quản lý ADR Information
1. Sidebar → Admin → ADR Information
2. Tạo tin tức/hướng dẫn mới
3. Set priority, tags, target audience
4. Upload featured image
5. Publish hoặc save draft
6. Pin to homepage
7. Set expiry date

#### 7. Gửi Notifications
1. Tạo system announcement
2. Target specific users hoặc all
3. Set notification type
4. Include data/links

### Cho User (Đơn vị Y tế)

#### 1. Đăng nhập User
1. Truy cập `/auth/login`
2. Email: `user@benhvien.gov.vn`
3. Password: `user123`

#### 2. Tạo báo cáo ADR
1. Sidebar → Reports → New Report
2. Form wizard 6 bước:
   
   **Step 1: Thông tin bệnh nhân**
   - Nhập họ tên, ngày sinh (tự động tính tuổi)
   - Chọn giới tính
   - Nhập cân nặng

   **Step 2: Thông tin ADR**
   - Chọn ngày xảy ra ADR
   - Mô tả phản ứng chi tiết
   - Xét nghiệm liên quan
   - Tiền sử bệnh
   - Xử trí
   - Mức độ nghiêm trọng
   - Kết quả

   **Step 3: Thuốc nghi ngờ**
   - Click "Thêm thuốc"
   - Nhập thông tin thuốc
   - Thêm nhiều thuốc nếu cần
   - Xóa thuốc bằng nút X

   **Step 4: Thuốc dùng đồng thời**
   - Liệt kê thuốc khác đang dùng
   - Thời gian sử dụng

   **Step 5: Thẩm định**
   - Chọn đánh giá mối liên quan
   - Chọn thang đánh giá
   - Bình luận (optional)
   - Dùng AI Chatbot để tư vấn

   **Step 6: Người báo cáo**
   - Tên, nghề nghiệp
   - Liên hệ
   - Loại báo cáo
   - Ngày báo cáo

3. Preview
4. Submit

#### 3. Xem Reports của mình
1. Sidebar → Reports
2. Xem danh sách báo cáo đã tạo
3. Click để xem chi tiết
4. Sửa report (nếu cần)
5. Export PDF
6. Gửi email

#### 4. Tạo Thẻ dị ứng
1. Sidebar → Allergy Cards → New Card
2. Nhập thông tin bệnh nhân
3. Nhập thông tin bệnh viện
4. Thêm dị nguyên:
   - Tên dị nguyên/thuốc
   - Mức độ chắc chắn
   - Biểu hiện lâm sàng
   - Mức độ nghiêm trọng
5. Submit
6. Hệ thống tự động tạo QR code
7. Download thẻ PDF để in

#### 5. Quét QR Thẻ dị ứng
1. Sidebar → Allergy Cards → Scan QR
2. Click "Bật camera"
3. Cho phép quyền camera
4. Đưa QR code vào khung hình
5. Hệ thống tự động quét
6. Hiển thị thông tin dị ứng

Hoặc:
- Nhập mã thẻ thủ công: `AC-2024-000001`
- Dán link từ QR

#### 6. Tham gia Quiz
1. Sidebar → Training
2. Chọn Category:
   - WHO-UMC Assessment
   - Naranjo Scale
   - Drug Knowledge
   - Case Studies
   - Regulations
   - General
3. Chọn Difficulty:
   - Beginner
   - Intermediate
   - Advanced
   - Expert
4. Click Start Quiz
5. Trả lời câu hỏi:
   - Chọn đáp án
   - Submit answer
   - Xem explanation
   - Next question
6. Hoàn thành quiz
7. Xem score và statistics

#### 7. Daily Challenge
1. Training Hub → Daily Challenge
2. Start Today's Challenge
3. 10 câu hỏi, giới hạn thời gian
4. Hoàn thành để nhận bonus points
5. Xem rank trong leaderboard

#### 8. Xem Leaderboard
1. Training Hub → Leaderboard
2. Xem ranking của mình
3. So sánh với users khác
4. Filter by:
   - Overall
   - Category-specific
   - Time period

#### 9. Xem Dashboard cá nhân
1. Sidebar → Dashboard
2. Xem statistics của mình:
   - Total reports created
   - Quiz stats
   - Current rank
   - Activity summary

#### 10. AI Chatbot
Khi tạo/sửa báo cáo ADR:
1. Click nút "AI Consultant" 
2. AI phân tích case tự động
3. Đặt câu hỏi:
   - "Đánh giá mối liên quan thuốc-ADR này?"
   - "Tính điểm Naranjo cho case này?"
   - "Xét nghiệm nào cần làm thêm?"
   - "Xử trí lâm sàng như thế nào?"
4. Nhận gợi ý từ AI
5. Apply insights vào form

#### 11. Đổi mật khẩu
1. Sidebar → Profile → Change Password
2. Nhập old password
3. Nhập new password
4. Confirm new password
5. Submit

#### 12. Xem Notifications
1. Click vào chuông 🔔 ở header
2. Xem danh sách notifications
3. Click notification để đi đến nội dung
4. Mark as read
5. Mark all as read

---

## 📚 Tài liệu tham khảo

### Documentation Files

1. **README.md** - Overview và quick start
2. **APP-FEATURES-SUMMARY.md** - Tổng hợp tính năng QR Scanner
3. **SUMMARY-QR-CARD-SYSTEM.md** - Hệ thống thẻ QR
4. **database.md** - Database schema details
5. **capthe.md** - Mẫu thẻ dị ứng HTML
6. **thangdanhgia.md** - Thang đánh giá WHO và Naranjo

### Key Technical Files

**Config:**
- `lib/config.ts` - App configuration
- `lib/auth-config.ts` - NextAuth setup
- `middleware.ts` - Route protection
- `next.config.js` - Next.js config
- `tailwind.config.js` - Tailwind config
- `tsconfig.json` - TypeScript config

**Services:**
- `lib/adr-quiz-service.ts` - Quiz logic
- `lib/ai-assessment-service.ts` - AI assessment
- `lib/ai-chatbot-service.ts` - AI chatbot
- `lib/allergy-card-pdf-service.ts` - PDF generation
- `lib/email-service.ts` - Email sending
- `lib/qr-card-service.ts` - QR generation/parsing
- `lib/supabase.ts` - Supabase client

**Types:**
- `types/report.ts` - ADR report types
- `types/allergy-card.ts` - Allergy card types
- `types/quiz.ts` - Quiz types
- `types/user.ts` - User types
- `types/notification.ts` - Notification types

### Scripts

**Setup:**
- `scripts/system-check.js` - System health check
- `scripts/check-env-variables.js` - Env validation

**Testing:**
- `scripts/test-allergy-api.js` - Test allergy API
- `scripts/test-qr-card-lookup.js` - Test QR lookup
- `scripts/test-user-management.js` - Test user APIs

**Data:**
- `scripts/add-sample-adr-data.sql` - Sample ADR data
- `scripts/add-sample-questions-example.sql` - Sample quiz questions
- `scripts/quiz-question-generator.js` - Generate quiz questions

### Thang đánh giá ADR

#### WHO-UMC Scale

| Mức độ | Tiêu chuẩn |
|--------|-----------|
| **Chắc chắn (Certain)** | - Mối liên hệ chặt chẽ về thời gian<br>- Không giải thích bằng bệnh lý hoặc thuốc khác<br>- Cải thiện khi ngừng thuốc<br>- Là tác dụng phụ đặc trưng<br>- Tái xuất hiện khi dùng lại |
| **Có khả năng (Probable)** | - Mối liên hệ hợp lý về thời gian<br>- Không chắc chắn có liên quan bệnh lý khác<br>- Cải thiện khi ngừng thuốc<br>- Không cần thông tin tái sử dụng |
| **Có thể (Possible)** | - Mối liên hệ hợp lý về thời gian<br>- Có thể giải thích bằng bệnh lý hoặc thuốc khác<br>- Thiếu thông tin về ngừng thuốc |
| **Không chắc chắn (Unlikely)** | - Mối liên hệ không rõ ràng về thời gian<br>- Có thể giải thích bằng nguyên nhân khác |
| **Chưa phân loại** | - Cần thêm thông tin để đánh giá |
| **Không thể phân loại** | - Thông tin không đầy đủ hoặc không thống nhất |

#### Naranjo Scale

| STT | Câu hỏi | Có | Không | Không biết |
|-----|---------|----|----|------------|
| 1 | Phản ứng có được mô tả trước đó trong y văn? | +1 | 0 | 0 |
| 2 | Phản ứng có xuất hiện sau khi dùng thuốc? | +2 | -1 | 0 |
| 3 | Phản ứng có cải thiện khi ngừng thuốc? | +1 | 0 | 0 |
| 4 | Phản ứng có tái xuất hiện khi dùng lại? | +2 | -1 | 0 |
| 5 | Có nguyên nhân khác gây ra phản ứng? | -1 | +2 | 0 |
| 6 | Phản ứng có xuất hiện khi dùng giả dược? | -1 | +1 | 0 |
| 7 | Nồng độ thuốc có ở ngưỡng gây độc? | +1 | 0 | 0 |
| 8 | Phản ứng nghiêm trọng hơn khi tăng liều? | +1 | 0 | 0 |
| 9 | Người bệnh có gặp phản ứng tương tự trước đó? | +1 | 0 | 0 |
| 10 | Phản ứng có được xác nhận bằng bằng chứng khách quan? | +1 | 0 | 0 |

**Phân loại điểm:**
- ≥ 9: Chắc chắn (Certain)
- 5-8: Có khả năng (Probable)
- 1-4: Có thể (Possible)
- ≤ 0: Nghi ngờ (Doubtful)

### External Links

**Frameworks & Libraries:**
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Supabase](https://supabase.com/docs)

**ADR Resources:**
- [WHO Pharmacovigilance](https://www.who.int/teams/regulation-prequalification/pharmacovigilance)
- [Uppsala Monitoring Centre](https://www.who-umc.org)

**Quy định Việt Nam:**
- Thông tư 51/2017/TT-BYT - Hướng dẫn Pharmacovigilance
- Quyết định về báo cáo ADR

---

## 🎉 Kết luận

### Tổng kết

Hệ thống Quản lý ADR là một giải pháp toàn diện cho việc:
- ✅ Thu thập và quản lý báo cáo phản ứng có hại của thuốc
- ✅ Quản lý thẻ dị ứng điện tử với QR code
- ✅ Đào tạo nhân viên y tế về ADR qua quiz
- ✅ Hỗ trợ đánh giá ADR bằng AI
- ✅ Phân tích và thống kê dữ liệu ADR
- ✅ Chia sẻ thông tin và kiến thức về ADR

### Ứng dụng thực tế

**Cho bệnh nhân:**
- Quản lý thông tin dị ứng cá nhân
- Truy cập nhanh trong trường hợp khẩn cấp
- Chia sẻ an toàn với nhân viên y tế

**Cho nhân viên y tế:**
- Báo cáo ADR dễ dàng và nhanh chóng
- Truy cập thông tin dị ứng bệnh nhân
- Học tập và nâng cao kiến thức ADR
- Được hỗ trợ bởi AI trong đánh giá

**Cho Sở Y tế:**
- Quản lý tập trung các báo cáo ADR
- Phân tích xu hướng và thống kê
- Giám sát an toàn thuốc
- Ra quyết định dựa trên dữ liệu

### Tính năng nổi bật

1. **QR Code Scanner** - Quét trực tiếp trên browser, không cần app
2. **AI Chatbot** - Tư vấn chuyên gia 24/7
3. **Quiz System** - Gamification với achievements và leaderboards
4. **Dashboard** - 9 loại biểu đồ trực quan
5. **Real-time** - Thông báo và cập nhật tức thì

### Tech Highlights

- **Modern Stack**: Next.js 14, React 18, TypeScript
- **Database**: PostgreSQL với Row Level Security
- **Authentication**: Secure với NextAuth.js
- **AI Integration**: OpenAI & Google AI
- **Mobile-First**: Responsive design
- **Production Ready**: Deployed on Vercel

### Roadmap tương lai

**Phase 2:**
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Multi-language support
- [ ] Advanced analytics with ML
- [ ] Integration với HIS systems
- [ ] Blockchain for audit trail

**Phase 3:**
- [ ] Voice input for reports
- [ ] OCR for prescription scanning
- [ ] Predictive ADR alerts
- [ ] International reporting (WHO VigiBase)
- [ ] Telemedicine integration

---

**Phiên bản tài liệu:** 1.0  
**Ngày cập nhật:** 01/10/2025  
**Trạng thái:** ✅ Hoàn thành  

**Liên hệ hỗ trợ:**  
- Email: support@adrsystem.gov.vn  
- Documentation: [GitHub Wiki](#)  
- Issues: [GitHub Issues](#)

---

**© 2025 Hệ thống Quản lý ADR - Bộ Y tế Việt Nam**






