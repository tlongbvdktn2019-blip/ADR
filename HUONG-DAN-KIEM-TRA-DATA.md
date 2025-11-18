# HƯỚNG DẪN KIỂM TRA VÀ SO SÁNH DỮ LIỆU

## 🎯 Mục đích

Hướng dẫn này giúp bạn kiểm tra và so sánh dữ liệu hiển thị giữa:
- **Trang Public** (quét QR code): `/allergy-cards/public/[code]`
- **Trang Nội bộ** (đã đăng nhập): `/allergy-cards/[id]`

---

## 📚 Các file liên quan

1. **PHAN-TICH-KHAC-BIET-TRANG-PUBLIC-NOI-BO.md**
   - Phân tích chi tiết về sự khác biệt
   - Giải thích nguyên nhân
   - Đề xuất giải pháp

2. **scripts/compare-public-internal-data.js**
   - Script Node.js để so sánh dữ liệu từ API
   - Tự động so sánh allergies và updates

3. **scripts/check-data-consistency.sql**
   - Script SQL để kiểm tra database
   - So sánh view vs direct query
   - Kiểm tra RLS policies

---

## 🚀 CÁCH 1: Kiểm tra qua Browser

### Bước 1: Test trang Public

1. Mở browser và vào: `http://localhost:3000/allergy-cards/public/AC-2025-XXXXXX`
   (Thay `AC-2025-XXXXXX` bằng mã thẻ thực tế)

2. Mở DevTools (F12) → Tab **Network**

3. Tìm request: `/api/allergy-cards/public/AC-2025-XXXXXX`

4. Xem **Response**, ghi chú:
   ```
   - Số lượng allergies: ___
   - Số lượng updates: ___
   - Danh sách allergies: ___________
   ```

### Bước 2: Test trang Nội bộ

1. Đăng nhập vào hệ thống

2. Vào: `http://localhost:3000/allergy-cards/[UUID]`
   (Lấy UUID từ response public API ở trên)

3. Mở DevTools (F12) → Tab **Network**

4. Tìm 2 requests:
   - `/api/allergy-cards/[UUID]` → Xem allergies
   - `/api/allergy-cards/[UUID]/updates` → Xem updates

5. So sánh với kết quả từ Public API

### Bước 3: So sánh

| Tiêu chí | Public | Internal | Khớp? |
|----------|--------|----------|-------|
| Số lượng allergies | ___ | ___ | ☐ |
| Số lượng updates | ___ | ___ | ☐ |
| Tên các allergies | ___ | ___ | ☐ |

---

## 🖥️ CÁCH 2: Dùng Script Node.js

### Bước 1: Cấu hình script

Mở file `scripts/compare-public-internal-data.js` và sửa:

```javascript
const CARD_CODE = 'AC-2025-000001'; // ← Thay bằng mã thẻ của bạn
const CARD_ID = '';                  // ← Lấy từ public API response
const AUTH_TOKEN = '';               // ← Lấy từ browser cookie
```

### Bước 2: Lấy AUTH_TOKEN

1. Mở browser đã đăng nhập
2. Mở DevTools (F12) → Tab **Application**
3. Vào **Storage** → **Cookies** → `http://localhost:3000`
4. Copy giá trị của `next-auth.session-token`
5. Paste vào script

### Bước 3: Chạy script

```bash
cd E:\Codex-ADR
node scripts/compare-public-internal-data.js
```

### Bước 4: Đọc kết quả

Script sẽ hiển thị:
```
🔍 Bắt đầu so sánh dữ liệu...
════════════════════════════════════════════════════════════

📡 Đang lấy dữ liệu từ PUBLIC API...
✅ Public API - Thành công!

📊 Thống kê Public API:
   - Card Code: AC-2025-000001
   - Patient: Nguyễn Văn A
   - Allergies: 3 items
   - Updates: 2 items
   
   🔴 Danh sách dị ứng (Public):
      1. Penicillin (confirmed, severe)
      2. Ibuprofen (confirmed, moderate)
      3. Aspirin (suspected, mild)
...
```

---

## 🗄️ CÁCH 3: Kiểm tra trực tiếp Database

### Bước 1: Kết nối Supabase

1. Vào Supabase Dashboard
2. Chọn project của bạn
3. Vào **SQL Editor**

### Bước 2: Chạy SQL script

1. Copy nội dung file `scripts/check-data-consistency.sql`

2. Sửa dòng đầu tiên:
   ```sql
   \set card_code 'AC-2025-000001'  -- Thay bằng mã thẻ của bạn
   ```

3. Paste vào SQL Editor và Run

### Bước 3: Đọc kết quả

Script sẽ hiển thị 11 bảng kiểm tra:

1. ✅ **Thông tin cơ bản của thẻ**
2. ✅ **Số lượng dị ứng** (Direct Query)
3. ✅ **Danh sách chi tiết dị ứng**
4. ✅ **Số lượng lịch sử bổ sung**
5. ✅ **Danh sách chi tiết updates**
6. ⚠️ **So sánh VIEW vs DIRECT QUERY** ← QUAN TRỌNG!
7. ✅ **Kiểm tra đồng bộ updates → card_allergies**
8. ✅ **Kiểm tra timestamps**
9. ✅ **Kiểm tra RLS policies**
10. ✅ **Định nghĩa view**
11. ✅ **Tổng hợp cuối cùng**

---

## 🔍 Phân tích kết quả

### Trường hợp 1: Số lượng khớp nhau ✅

```
📊 TỔNG HỢP CUỐI CÙNG
════════════════════════════════════════════════════════════
card_code    | patient_name  | Dị ứng (Direct) | Dị ứng (View) | Trạng thái
-------------+---------------+-----------------+---------------+------------
AC-2025-0001 | Nguyễn Văn A  | 3               | 3             | ✅ KHỚP
```

**→ Hệ thống hoạt động tốt!**

### Trường hợp 2: Số lượng KHÔNG khớp ❌

```
📊 TỔNG HỢP CUỐI CÙNG
════════════════════════════════════════════════════════════
card_code    | patient_name  | Dị ứng (Direct) | Dị ứng (View) | Trạng thái
-------------+---------------+-----------------+---------------+---------------
AC-2025-0001 | Nguyễn Văn A  | 5               | 3             | ❌ KHÔNG KHỚP
```

**→ Có vấn đề! Xem mục Khắc phục bên dưới.**

---

## 🔧 Khắc phục các vấn đề thường gặp

### Vấn đề 1: View không cập nhật kịp

**Triệu chứng:**
- Direct Query: 5 allergies
- View: 3 allergies

**Nguyên nhân:**
- View `allergy_cards_with_details` chưa được refresh

**Giải pháp:**

```sql
-- Nếu là MATERIALIZED VIEW
REFRESH MATERIALIZED VIEW allergy_cards_with_details;

-- Hoặc drop và tạo lại
DROP VIEW IF EXISTS allergy_cards_with_details;

CREATE VIEW allergy_cards_with_details AS
SELECT 
  ac.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', ca.id,
        'allergen_name', ca.allergen_name,
        'certainty_level', ca.certainty_level,
        'severity_level', ca.severity_level,
        'clinical_manifestation', ca.clinical_manifestation,
        'reaction_type', ca.reaction_type,
        'created_at', ca.created_at,
        'updated_at', ca.updated_at
      )
    ) FILTER (WHERE ca.id IS NOT NULL),
    '[]'::json
  ) as allergies
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ca.card_id = ac.id
GROUP BY ac.id;
```

### Vấn đề 2: Updates không load được (Frontend)

**Triệu chứng:**
- Public API: 3 updates
- Internal API: 0 updates

**Nguyên nhân:**
- API `/api/allergy-cards/[id]/updates` bị fail
- Không có error handling

**Giải pháp 1: Thống nhất API** (Khuyến nghị)

Sửa file `app/api/allergy-cards/[id]/route.ts`:

```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // ... existing code ...

  // THÊM: Lấy updates cùng với card
  const { data: updates } = await supabase
    .from('allergy_card_updates_with_details')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false });

  return NextResponse.json({ 
    card,
    updates: updates || [],      // ← THÊM VÀO
    total_updates: updates?.length || 0
  });
}
```

Sửa frontend `app/allergy-cards/[id]/page.tsx`:

```typescript
// XÓA loadUpdates() riêng biệt

const loadCard = async () => {
  const response = await fetch(`/api/allergy-cards/${params.id}`);
  const data = await response.json();
  
  setCard(data.card);
  setUpdates(data.updates || []);  // ← Lấy luôn từ response
};

useEffect(() => {
  loadCard();  // Chỉ cần 1 API call
}, [params.id]);
```

**Giải pháp 2: Cải thiện error handling**

Nếu vẫn muốn giữ 2 API calls:

```typescript
const loadUpdates = async () => {
  try {
    setIsLoadingUpdates(true);
    const response = await fetch(`/api/allergy-cards/${params.id}/updates`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    setUpdates(data.updates || []);
    
  } catch (error) {
    console.error('Load updates error:', error);
    setError('Không thể tải lịch sử bổ sung');
    toast.error('Lỗi tải lịch sử bổ sung. Vui lòng thử lại.');
  } finally {
    setIsLoadingUpdates(false);
  }
};
```

### Vấn đề 3: RLS chặn dữ liệu

**Triệu chứng:**
- Public API (admin client): Có đủ dữ liệu
- Internal API (user client): Thiếu dữ liệu

**Kiểm tra:**

```sql
-- Xem RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('allergy_cards', 'card_allergies', 'allergy_card_updates');
```

**Giải pháp:**

```sql
-- Đảm bảo user có quyền đọc dữ liệu của mình
CREATE POLICY "Users can view their own cards"
ON allergy_cards FOR SELECT
USING (
  auth.uid() = issued_by_user_id 
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Tương tự cho card_allergies và allergy_card_updates
```

### Vấn đề 4: Cache cũ

**Giải pháp:**

1. **Clear browser cache:**
   - Ctrl + Shift + Delete
   - Chọn "Cached images and files"
   - Clear

2. **Disable cache trong DevTools:**
   - F12 → Settings (⚙️)
   - ✅ Disable cache (while DevTools is open)

3. **Thêm cache control vào API:**

```typescript
// app/api/allergy-cards/[id]/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // ... query logic ...

  const response = NextResponse.json({ card, updates });
  
  // THÊM: Disable cache
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}
```

---

## 📞 Hỗ trợ

Nếu vẫn gặp vấn đề sau khi thử các bước trên:

1. **Xem file phân tích chi tiết:**
   ```
   PHAN-TICH-KHAC-BIET-TRANG-PUBLIC-NOI-BO.md
   ```

2. **Kiểm tra logs:**
   ```bash
   # Backend logs
   npm run dev
   
   # Database logs
   # Vào Supabase Dashboard → Logs
   ```

3. **Chạy tất cả 3 cách kiểm tra:**
   - Browser DevTools
   - Node.js script
   - SQL script

4. **So sánh kết quả** để tìm pattern

---

## 📊 Checklist kiểm tra

- [ ] Đã chạy script Node.js
- [ ] Đã chạy SQL script
- [ ] Đã kiểm tra trong Browser DevTools
- [ ] Đã so sánh số lượng allergies
- [ ] Đã so sánh số lượng updates
- [ ] Đã kiểm tra view vs direct query
- [ ] Đã kiểm tra RLS policies
- [ ] Đã clear cache và test lại
- [ ] Đã đọc file phân tích chi tiết
- [ ] Đã thử các giải pháp khắc phục

---

## ✅ Kết quả mong đợi

Sau khi hoàn thành các bước trên, bạn sẽ:

1. ✅ **Biết chính xác** dữ liệu có khớp nhau không
2. ✅ **Tìm được nguyên nhân** nếu có sự khác biệt
3. ✅ **Có giải pháp cụ thể** để khắc phục
4. ✅ **Hiểu rõ** cách 2 trang hoạt động khác nhau

**Chúc bạn thành công! 🎉**

