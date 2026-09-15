# Thiết lập AI Consultant với Gemini 2.5 Pro

AI Consultant mới dùng một API key Gemini của đơn vị trên server. Người dùng không cần và không được nhập API key trong Phần D.

## 1. Chạy migration

Áp dụng migration sau vào Supabase trước khi deploy mã nguồn:

```text
supabase/migrations/20260915090000_rebuild_ai_consultant.sql
```

Migration thêm `client_ref` cho thuốc nghi ngờ và tạo các bảng audit, nguồn, đánh giá theo thuốc, chat cùng database function liên kết phiên AI với báo cáo.

## 2. Biến môi trường

```dotenv
GEMINI_API_KEY=your-paid-gemini-api-key
AI_CONSULTANT_ENABLED=true
AI_CONSULTANT_PUBLIC_ENABLED=false
AI_CONSULTANT_PUBLIC_DAILY_BUDGET_USD=10
AI_PUBLIC_SESSION_SECRET=replace-with-at-least-24-random-characters
CRON_SECRET=replace-with-a-long-random-secret

NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
TURNSTILE_SECRET_KEY=your-cloudflare-turnstile-secret-key
TURNSTILE_ALLOWED_HOSTNAME=your-production-hostname
```

Giữ `AI_CONSULTANT_PUBLIC_ENABLED=false` trong giai đoạn shadow/pilot nội bộ. Chỉ bật public sau khi đã cấu hình Turnstile, ngân sách và hoàn thành đánh giá lâm sàng.

## 3. Trình tự phát hành

1. Áp dụng migration Supabase.
2. Cấu hình key và chỉ bật `AI_CONSULTANT_ENABLED`.
3. Deploy và chạy smoke test bằng một ca đã khử định danh.
4. Kiểm tra audit trong `ai_consultations`, `ai_drug_assessments` và `ai_evidence_sources`.
5. Chạy pilot nội bộ trước khi bật `AI_CONSULTANT_PUBLIC_ENABLED`.

## 4. Kill switch

- Đặt `AI_CONSULTANT_ENABLED=false` để tắt toàn bộ AI nhưng vẫn giữ Phần D thủ công.
- Đặt `AI_CONSULTANT_PUBLIC_ENABLED=false` để chỉ tắt luồng công khai.

Không có fallback tự động sang model hoặc provider khác.

## 5. Dọn dữ liệu nháp hết hạn

`vercel.json` đã cấu hình cron chạy mỗi ngày qua route được bảo vệ bởi `CRON_SECRET`. Route gọi database function:

```sql
select public.cleanup_expired_ai_consultations();
```

Function chỉ xóa phiên công khai chưa gắn báo cáo và đã quá `expires_at`.
