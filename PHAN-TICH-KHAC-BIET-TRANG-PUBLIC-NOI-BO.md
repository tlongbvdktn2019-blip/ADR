# PHÂN TÍCH KHÁC BIỆT GIỮA TRANG PUBLIC VÀ NỘI BỘ

## 📋 TÓM TẮT VẤN ĐỀ

Dữ liệu hiển thị **Thông tin dị ứng** và **Lịch sử bổ sung** giữa trang **public** và trang **nội bộ** có thể khác nhau do cách lấy dữ liệu khác biệt.

---

## 🔍 SO SÁNH CHI TIẾT

### 1. TRANG PUBLIC (Quét QR Code)

#### 📍 Đường dẫn & URL
- **Frontend:** `/allergy-cards/public/[code]`
- **API Endpoint:** `/api/allergy-cards/public/[code]`
- **Ví dụ:** `/allergy-cards/public/AC-2025-123456`

#### 🔓 Xác thực
- **KHÔNG CẦN** authentication
- **Công khai** - bất kỳ ai có mã thẻ đều xem được
- Sử dụng `createAdminClient()` để bypass RLS

#### 🎯 Tham số tra cứu
- Sử dụng **`card_code`** (ví dụ: AC-2025-123456)
- Validate format: `/^AC-\d{4}-\d{6}$/`

#### 📊 Cách lấy dữ liệu

**File:** `app/api/allergy-cards/public/[code]/route.ts`

```typescript
// 1. Lấy thông tin thẻ
const { data: card } = await adminSupabase
  .from('allergy_cards')
  .select(`
    id, card_code, patient_name, patient_gender,
    patient_age, patient_id_number, hospital_name,
    department, doctor_name, doctor_phone,
    issued_date, expiry_date, organization,
    status, notes, created_at
  `)
  .eq('card_code', cardCode)
  .maybeSingle();

// 2. Lấy danh sách dị ứng
const { data: allergies } = await adminSupabase
  .from('card_allergies')
  .select('*')
  .eq('card_id', card.id)
  .order('severity_level', { ascending: false });

// 3. Lấy lịch sử bổ sung (QUAN TRỌNG!)
const { data: updates } = await adminSupabase
  .from('allergy_card_updates_with_details')
  .select('*')
  .eq('card_id', card.id)
  .order('created_at', { ascending: false });

// 4. Trả về tất cả trong 1 response
return NextResponse.json({
  success: true,
  card: {
    ...card,
    allergies: allergies || []
  },
  updates: updates || [],
  total_updates: updates?.length || 0,
  warning
});
```

#### ✅ Đặc điểm
- **Lấy TẤT CẢ dữ liệu trong 1 API call**
- Trả về: card + allergies + updates cùng lúc
- Cache disabled: `Cache-Control: no-store, no-cache, must-revalidate`
- Hiển thị cả thẻ hết hạn/vô hiệu (với warning)

---

### 2. TRANG NỘI BỘ (Đã đăng nhập)

#### 📍 Đường dẫn & URL
- **Frontend:** `/allergy-cards/[id]`
- **API Endpoints:** 
  - Card: `/api/allergy-cards/[id]`
  - Updates: `/api/allergy-cards/[id]/updates`
- **Ví dụ:** `/allergy-cards/550e8400-e29b-41d4-a716-446655440000`

#### 🔒 Xác thực
- **CẦN** authentication (NextAuth session)
- Kiểm tra quyền: Admin hoặc Owner
- Sử dụng `createServerClient()` với RLS

#### 🎯 Tham số tra cứu
- Sử dụng **`id`** (UUID)
- Ví dụ: `550e8400-e29b-41d4-a716-446655440000`

#### 📊 Cách lấy dữ liệu

**File 1:** `app/api/allergy-cards/[id]/route.ts`

```typescript
// 1. Lấy card với allergies từ VIEW
const { data: card } = await supabase
  .from('allergy_cards_with_details')
  .select('*')
  .eq('id', cardId)
  .single();

// View 'allergy_cards_with_details' đã JOIN sẵn với card_allergies
// Nên card.allergies đã có sẵn
```

**File 2:** `app/api/allergy-cards/[id]/updates/route.ts`

```typescript
// 2. Lấy updates riêng biệt (TRONG API KHÁC!)
const { data: updates } = await supabase
  .from('allergy_card_updates_with_details')
  .select('*')
  .eq('card_id', cardId)
  .order('created_at', { ascending: false });
```

**Frontend:** `app/allergy-cards/[id]/page.tsx`

```typescript
// QUAN TRỌNG: Gọi 2 API riêng biệt!
useEffect(() => {
  loadCard();      // API call 1: /api/allergy-cards/[id]
  loadUpdates();   // API call 2: /api/allergy-cards/[id]/updates
}, [params.id]);

const loadCard = async () => {
  const response = await fetch(`/api/allergy-cards/${params.id}`);
  const data = await response.json();
  setCard(data.card);
};

const loadUpdates = async () => {
  const response = await fetch(`/api/allergy-cards/${params.id}/updates`);
  const data = await response.json();
  setUpdates(data.updates || []);
};
```

#### ✅ Đặc điểm
- **Gọi 2 API calls riêng biệt**
- API 1: Card + Allergies (từ view)
- API 2: Updates (riêng biệt)
- Có kiểm tra quyền truy cập
- Chỉ hiển thị thẻ user có quyền xem

---

## ⚠️ NGUYÊN NHÂN DỮ LIỆU KHÁC NHAU

### 🔴 Vấn đề 1: Race Condition
Trang nội bộ gọi 2 API riêng biệt, có thể xảy ra:
- API card load xong trước
- API updates load chậm hơn
- Nếu có lỗi network → updates có thể không load được

### 🔴 Vấn đề 2: State Management
```typescript
const [card, setCard] = useState<AllergyCard | null>(null);
const [updates, setUpdates] = useState<AllergyCardUpdate[]>([]);
const [isLoadingUpdates, setIsLoadingUpdates] = useState(true);
```
- 3 state riêng biệt
- Nếu `loadUpdates()` fail → updates = []
- Không có error handling rõ ràng

### 🔴 Vấn đề 3: View vs Table Query

**Trang nội bộ:** Dùng view `allergy_cards_with_details`
```sql
CREATE VIEW allergy_cards_with_details AS
SELECT 
  ac.*,
  json_agg(ca.*) FILTER (WHERE ca.id IS NOT NULL) as allergies
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ca.card_id = ac.id
GROUP BY ac.id;
```

**Trang public:** Query trực tiếp từ bảng `card_allergies`
```typescript
await adminSupabase
  .from('card_allergies')
  .select('*')
  .eq('card_id', card.id)
```

Nếu view có vấn đề hoặc không được refresh → dữ liệu có thể khác!

### 🔴 Vấn đề 4: Cache & Timing

**Public:**
- Cache explicitly disabled
- Luôn fetch data mới nhất
```typescript
response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
```

**Nội bộ:**
- Không có explicit cache control
- Có thể bị cache bởi browser/Next.js
- 2 API calls có thể cache khác nhau

---

## 🐛 KỊCH BẢN DẪN ĐẾN DỮ LIỆU KHÁC NHAU

### Kịch bản 1: Updates không load được

**Trang nội bộ:**
```typescript
const loadUpdates = async () => {
  try {
    setIsLoadingUpdates(true);
    const response = await fetch(`/api/allergy-cards/${params.id}/updates`);
    
    if (response.ok) {
      const data = await response.json();
      setUpdates(data.updates || []);
    }
  } catch (error) {
    console.error('Load updates error:', error);
    // ⚠️ KHÔNG SET ERROR STATE - updates vẫn là []
  } finally {
    setIsLoadingUpdates(false);
  }
};
```

**Vấn đề:**
- Nếu API `/updates` fail → không có thông báo lỗi
- `updates` vẫn là `[]` → user nghĩ là không có updates
- Nhưng trên trang public (1 API call) → có updates đầy đủ!

### Kịch bản 2: View không cập nhật kịp

Khi có update mới được thêm:
1. Insert vào `allergy_card_updates` ✅
2. Insert vào `update_allergies` ✅
3. Insert vào `card_allergies` ✅
4. View `allergy_cards_with_details` có thể chưa refresh ❌

→ **Trang public:** Query trực tiếp → có dữ liệu mới ✅
→ **Trang nội bộ:** Query từ view → chưa có dữ liệu mới ❌

### Kịch bản 3: Permission/RLS Issues

**Trang public:**
```typescript
const adminSupabase = createAdminClient(); // Bypass RLS
```

**Trang nội bộ:**
```typescript
const supabase = createServerClient(); // Có RLS
```

Nếu RLS có vấn đề → trang nội bộ có thể không lấy được hết dữ liệu!

---

## 🔧 CÁCH KIỂM TRA & DEBUG

### 1. Kiểm tra trực tiếp trong Supabase

```sql
-- Kiểm tra card và allergies
SELECT ac.*, 
       (SELECT json_agg(ca.*) FROM card_allergies ca WHERE ca.card_id = ac.id) as allergies
FROM allergy_cards ac
WHERE ac.card_code = 'AC-2025-123456';

-- Kiểm tra updates
SELECT * FROM allergy_card_updates_with_details
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-123456')
ORDER BY created_at DESC;

-- So sánh view vs query trực tiếp
-- View:
SELECT * FROM allergy_cards_with_details WHERE card_code = 'AC-2025-123456';

-- Direct query:
SELECT ac.*, ca.*
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ca.card_id = ac.id
WHERE ac.card_code = 'AC-2025-123456';
```

### 2. Kiểm tra API responses

**Test công khai:**
```bash
# Public API (không cần auth)
curl https://your-domain.com/api/allergy-cards/public/AC-2025-123456
```

**Test nội bộ:**
```bash
# Internal API (cần auth token)
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  https://your-domain.com/api/allergy-cards/UUID_HERE

curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  https://your-domain.com/api/allergy-cards/UUID_HERE/updates
```

### 3. Kiểm tra trong Browser DevTools

**Trang nội bộ:**
1. Mở DevTools → Network tab
2. Refresh trang
3. Xem 2 API calls:
   - `/api/allergy-cards/[id]` → response có allergies?
   - `/api/allergy-cards/[id]/updates` → response có updates?

**Trang public:**
1. Chỉ có 1 API call: `/api/allergy-cards/public/[code]`
2. Response phải có cả `card`, `allergies`, và `updates`

### 4. Console Logs

Thêm logs vào frontend:

```typescript
// Trang nội bộ
const loadCard = async () => {
  const response = await fetch(`/api/allergy-cards/${params.id}`);
  const data = await response.json();
  console.log('🔵 Card data:', data);
  console.log('🔵 Allergies count:', data.card.allergies?.length);
  setCard(data.card);
};

const loadUpdates = async () => {
  const response = await fetch(`/api/allergy-cards/${params.id}/updates`);
  const data = await response.json();
  console.log('🟢 Updates data:', data);
  console.log('🟢 Updates count:', data.updates?.length);
  setUpdates(data.updates || []);
};
```

---

## ✅ GIẢI PHÁP ĐỀ XUẤT

### Giải pháp 1: Thống nhất API cho trang nội bộ

**Thay đổi:** `/api/allergy-cards/[id]` trả về cả updates

```typescript
// app/api/allergy-cards/[id]/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // ... authentication & permission checks ...

  // 1. Lấy card với allergies
  const { data: card } = await supabase
    .from('allergy_cards_with_details')
    .select('*')
    .eq('id', cardId)
    .single();

  // 2. Lấy updates (THÊM VÀO ĐÂY)
  const { data: updates } = await supabase
    .from('allergy_card_updates_with_details')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false });

  // 3. Trả về cả card VÀ updates
  return NextResponse.json({ 
    card: {
      ...card,
      suspected_drugs: drugs || []
    },
    updates: updates || [],
    total_updates: updates?.length || 0
  });
}
```

**Frontend:**
```typescript
// app/allergy-cards/[id]/page.tsx
useEffect(() => {
  loadCardWithUpdates(); // Chỉ cần 1 API call
}, [params.id]);

const loadCardWithUpdates = async () => {
  try {
    setIsLoading(true);
    const response = await fetch(`/api/allergy-cards/${params.id}`);
    const data = await response.json();
    
    setCard(data.card);
    setUpdates(data.updates || []);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### Giải pháp 2: Cải thiện error handling

```typescript
const loadUpdates = async () => {
  try {
    setIsLoadingUpdates(true);
    const response = await fetch(`/api/allergy-cards/${params.id}/updates`);
    
    if (!response.ok) {
      throw new Error('Không thể tải lịch sử bổ sung');
    }
    
    const data = await response.json();
    setUpdates(data.updates || []);
    
  } catch (error) {
    console.error('Load updates error:', error);
    setError('Không thể tải lịch sử bổ sung. Vui lòng thử lại.');
    toast.error('Không thể tải lịch sử bổ sung');
    // QUAN TRỌNG: Vẫn set empty array nhưng có thông báo
    setUpdates([]);
  } finally {
    setIsLoadingUpdates(false);
  }
};
```

### Giải pháp 3: Disable cache cho API nội bộ

```typescript
// app/api/allergy-cards/[id]/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // ... query logic ...

  const response = NextResponse.json({ card, updates });
  
  // THÊM: Disable cache
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  
  return response;
}
```

### Giải pháp 4: Refresh view sau mỗi update

```typescript
// app/api/allergy-cards/[id]/updates/route.ts (POST)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // ... insert update logic ...

  // THÊM: Force refresh view
  await supabase.rpc('refresh_allergy_cards_view');
  
  // Hoặc query trực tiếp thay vì dùng view
  const { data: card } = await supabase
    .from('allergy_cards')
    .select(`
      *,
      allergies:card_allergies(*)
    `)
    .eq('id', cardId)
    .single();

  return NextResponse.json({ success: true, card, update });
}
```

---

## 📊 BẢNG SO SÁNH TỔNG HỢP

| Tiêu chí | Trang Public | Trang Nội bộ |
|----------|--------------|--------------|
| **URL** | `/allergy-cards/public/[code]` | `/allergy-cards/[id]` |
| **Tham số** | `card_code` (AC-2025-XXXXXX) | `id` (UUID) |
| **Authentication** | ❌ Không cần | ✅ Cần đăng nhập |
| **API Calls** | 1 call duy nhất | 2 calls riêng biệt |
| **Data Source** | Query trực tiếp từ tables | Query từ view + separate call |
| **Cache Control** | Explicitly disabled | Không có |
| **Error Handling** | Tốt (1 try-catch) | Yếu (2 try-catch riêng) |
| **Performance** | Nhanh hơn (1 request) | Chậm hơn (2 requests) |
| **Consistency** | Cao (atomic) | Thấp hơn (2 separate queries) |
| **RLS** | Bypass (admin client) | Có RLS (user client) |

---

## 🎯 KHUYẾN NGHỊ

### 1. Ưu tiên cao (Critical)
- ✅ **Thống nhất API**: Làm cho trang nội bộ trả về updates trong cùng response với card
- ✅ **Cải thiện error handling**: Thông báo rõ ràng khi không load được updates
- ✅ **Disable cache**: Đảm bảo luôn lấy dữ liệu mới nhất

### 2. Ưu tiên trung bình
- 🔄 **Query trực tiếp**: Tránh dùng view có thể không real-time
- 🔄 **Logging**: Thêm logs để debug dễ dàng
- 🔄 **Testing**: Test cả 2 trang với cùng dữ liệu

### 3. Ưu tiên thấp (Nice to have)
- 💡 **SWR/React Query**: Dùng thư viện để manage data fetching
- 💡 **Websocket**: Real-time updates cho trang nội bộ
- 💡 **Optimistic updates**: UI update ngay, không chờ API

---

## 📝 KẾT LUẬN

**Nguyên nhân chính dữ liệu khác nhau:**

1. **Trang nội bộ gọi 2 API riêng biệt** → có thể fail một trong hai
2. **Không có error handling tốt** → user không biết có lỗi
3. **Cache có thể khác nhau** giữa 2 API calls
4. **View vs Direct Query** có thể cho kết quả khác

**Giải pháp tốt nhất:**
- Thống nhất cách lấy dữ liệu: 1 API call cho cả card + updates
- Cải thiện error handling và logging
- Disable cache để đảm bảo consistency

**Testing:**
- So sánh response của 2 API với cùng card_code/id
- Kiểm tra trong Supabase xem dữ liệu có đúng không
- Test các edge cases: update mới, thẻ hết hạn, etc.

