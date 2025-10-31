# Dashboard: Hiển thị Panel Cuộc thi Động

## 🎯 Mục tiêu

Cập nhật panel cuộc thi trong Dashboard để hiển thị **tên và mô tả động** từ cuộc thi đã tạo, thay vì text cố định.

## 🔍 Vấn đề trước đây

Panel cuộc thi trong Dashboard hiển thị thông tin **hardcoded**:
- Tên: "Cuộc thi Kiến thức ADR" (cố định)
- Mô tả: "Thử thách bản thân với các câu hỏi hấp dẫn..." (cố định)
- Thông tin: "Nhiều câu hỏi thú vị" (không rõ số lượng)

→ Không phản ánh thông tin thực tế của cuộc thi đã tạo

## ✅ Giải pháp đã triển khai

### **File cập nhật:** `app/dashboard/page.tsx`

### **1. Thêm interface và state**

```typescript
interface ActiveContest {
  id: string;
  title: string;
  description?: string;
  status: string;
  number_of_questions: number;
  time_per_question: number;
}

const [activeContest, setActiveContest] = useState<ActiveContest | null>(null);
```

### **2. Thêm function load cuộc thi active**

```typescript
const loadActiveContest = async () => {
  try {
    const response = await fetch('/api/contest/active');
    const result = await response.json();
    
    if (result.success && result.data) {
      setActiveContest(result.data);
    }
  } catch (error) {
    console.error('Error loading active contest:', error);
  }
};

// Gọi trong useEffect
useEffect(() => {
  // ...
  loadActiveContest();
}, [status, session, router]);
```

### **3. Cập nhật JSX hiển thị động**

**Trước:**
```tsx
<h2>Cuộc thi Kiến thức ADR</h2>
<p>Thử thách bản thân với các câu hỏi hấp dẫn...</p>
<span>Nhiều câu hỏi thú vị</span>
```

**Sau:**
```tsx
{activeContest && (
  <Link href="/contest">
    <h2>{activeContest.title}</h2>
    <p>
      {activeContest.description || 'Thử thách bản thân với các câu hỏi hấp dẫn...'}
    </p>
    <span>{activeContest.number_of_questions} câu hỏi</span>
    <span>{activeContest.time_per_question}s/câu</span>
  </Link>
)}
```

### **4. Hiển thị thông tin chi tiết**

Panel bây giờ hiển thị:
- ✅ **Tên cuộc thi** từ field `title`
- ✅ **Mô tả cuộc thi** từ field `description` (hoặc text mặc định nếu null)
- ✅ **Số câu hỏi** từ `number_of_questions` (VD: "10 câu hỏi")
- ✅ **Thời gian mỗi câu** từ `time_per_question` (VD: "20s/câu")
- ✅ Icon "Đang diễn ra" với animation
- ✅ Icon "Bảng xếp hạng"

## 📊 Kết quả

### **Trước:**
```
Tiêu đề: Cuộc thi Kiến thức ADR (cố định)
Mô tả:   Thử thách bản thân... (cố định)
Info:    Nhiều câu hỏi thú vị (không rõ)
```

### **Sau:**
```
Tiêu đề: [Tên cuộc thi từ database] ✅
Mô tả:   [Mô tả từ database] ✅
Info:    10 câu hỏi, 20s/câu ✅
```

## 🎨 Giao diện

Panel hiển thị:
1. **Trophy icon** với animation
2. **Badge** "Sự kiện đặc biệt"
3. **Tiêu đề** gradient từ purple → pink → red
4. **Mô tả** text màu xám
5. **4 badges thông tin:**
   - 🟢 Đang diễn ra
   - 🎓 X câu hỏi (động)
   - ⏱️ Xs/câu (động)
   - 🏆 Bảng xếp hạng
6. **Button CTA** "Tham gia ngay" với gradient

## 🔄 Luồng hoạt động

1. User truy cập Dashboard
2. Component gọi `loadActiveContest()`
3. API `/api/contest/active` trả về cuộc thi đang active
4. State `activeContest` được cập nhật
5. Panel render với thông tin động
6. Nếu không có cuộc thi active → Panel không hiển thị

## 🎯 Ưu điểm

✅ **Tự động cập nhật:** Khi admin thay đổi tên/mô tả cuộc thi → Dashboard tự động reflect
✅ **Thông tin chính xác:** Hiển thị số câu hỏi và thời gian thực tế
✅ **UX tốt:** Panel chỉ hiện khi có cuộc thi đang diễn ra
✅ **Dễ maintain:** Không cần hardcode, lấy từ database

## 📝 Lưu ý

### **1. Xử lý trường hợp null**
```typescript
{activeContest.description || 'Mô tả mặc định'}
```
→ Nếu admin không điền `description`, hiển thị text mặc định

### **2. Conditional rendering**
```typescript
{activeContest && (
  <Link>...</Link>
)}
```
→ Panel chỉ hiển thị khi có cuộc thi active

### **3. API endpoint**
- Sử dụng `/api/contest/active` (đã được fix ở task trước)
- API tự động lọc cuộc thi `status='active'` và `is_public=true`
- Xử lý `start_date` và `end_date` linh hoạt

## 🧪 Test

### **Scenario 1: Có cuộc thi active**
1. Admin tạo cuộc thi với tên "Thi thử kiến thức ADR 2025"
2. Điền mô tả "Kiểm tra kiến thức về phản ứng có hại của thuốc..."
3. Đặt 15 câu hỏi, 30s/câu
4. Kích hoạt cuộc thi
5. → Dashboard hiển thị đúng thông tin

### **Scenario 2: Không có mô tả**
1. Admin tạo cuộc thi không điền `description`
2. → Dashboard hiển thị text mặc định

### **Scenario 3: Không có cuộc thi active**
1. Không có cuộc thi nào status = 'active'
2. → Panel không hiển thị trên Dashboard

## 📦 Files đã thay đổi

| File | Thay đổi |
|------|----------|
| `app/dashboard/page.tsx` | ✅ Thêm state `activeContest` |
| | ✅ Thêm function `loadActiveContest()` |
| | ✅ Update JSX hiển thị động |
| | ✅ Thêm conditional rendering |

## 🚀 Triển khai

Các thay đổi đã được áp dụng trực tiếp vào code.
Build thành công, không có lỗi.

**Ready to use!** 🎉

---

**Ngày cập nhật:** 31/10/2025
**Version:** 1.0

