# CHANGELOG - Tính năng Lịch sử Bổ sung Thẻ Dị Ứng

## 📅 Version 1.0 - 18/11/2024

### ✨ Tính năng mới

#### 1. **Bổ sung thông tin thẻ dị ứng (Public Access)**
- Cho phép bất kỳ ai (sau khi xác thực mã thẻ) bổ sung thông tin vào thẻ dị ứng
- Không cần đăng nhập - phù hợp cho các cơ sở y tế khác nhau
- Trang bổ sung: `/allergy-cards/[id]/add-info`

#### 2. **Lưu lịch sử bổ sung đầy đủ**
- Lưu tất cả các lần bổ sung thông tin
- Bao gồm: người bổ sung, cơ sở y tế, dị ứng mới phát hiện
- Hiển thị dạng timeline trực quan

#### 3. **Tự động cập nhật dị ứng vào thẻ chính**
- Dị ứng được bổ sung tự động thêm vào thẻ chính
- Trigger database tự động xử lý
- Không cần thao tác thủ công

### 🗄️ Database Changes

#### Bảng mới:
1. **`allergy_card_updates`**
   - Lưu thông tin mỗi lần bổ sung
   - Bao gồm: người bổ sung, cơ sở y tế, loại cập nhật, ghi chú
   - Trường `is_verified` cho phép xác minh sau

2. **`update_allergies`**
   - Lưu chi tiết dị ứng được bổ sung trong mỗi lần cập nhật
   - Tự động thêm vào `card_allergies` qua trigger
   - Trường `is_approved` cho phép kiểm soát

#### View mới:
- **`allergy_card_updates_with_details`**
  - Join updates với allergies
  - Hiển thị đầy đủ thông tin cho API

#### Triggers:
- `trigger_auto_add_approved_allergies`: Tự động thêm dị ứng vào thẻ chính
- `trigger_update_allergy_card_updates_timestamp`: Cập nhật timestamp
- `trigger_update_update_allergies_timestamp`: Cập nhật timestamp

### 📝 Type Definitions

Thêm vào `types/allergy-card.ts`:
- `UpdateType`: Loại cập nhật
- `UpdateAllergy`: Dị ứng được bổ sung
- `AllergyCardUpdate`: Bản ghi cập nhật
- `AllergyCardUpdateFormData`: Dữ liệu form
- `AllergyCardUpdateResponse`: Response từ API
- `AllergyCardWithHistory`: Thẻ với lịch sử đầy đủ

### 🔌 API Endpoints

#### `GET /api/allergy-cards/[id]/updates`
- Lấy lịch sử bổ sung của một thẻ
- Public access
- Response: danh sách updates với allergies_added

#### `POST /api/allergy-cards/[id]/updates`
- Bổ sung thông tin mới vào thẻ
- Public access (yêu cầu xác thực card_code)
- Validate: card_code, required fields
- Tự động thêm dị ứng vào thẻ chính

### 🎨 UI/UX Changes

#### Trang chi tiết thẻ (`/allergy-cards/[id]`)
**Thêm:**
- Nút "Bổ sung thông tin" màu xanh nổi bật ở header
- Section "Lịch sử bổ sung" với timeline
- Hiển thị đầy đủ thông tin mỗi lần bổ sung:
  - Người bổ sung (tên, vai trò, tổ chức, liên hệ)
  - Cơ sở y tế nơi bổ sung
  - Loại cập nhật (màu sắc phân biệt)
  - Lý do và ghi chú
  - Dị ứng được bổ sung (nếu có)
  - Trạng thái xác minh

**Icons mới:**
- `PlusCircleIcon`: Nút bổ sung
- `ClockIcon`: Lịch sử
- `CheckCircleIcon`: Timeline dot

#### Trang bổ sung thông tin (`/allergy-cards/[id]/add-info`)
**Tạo mới:**
- Xác thực mã thẻ trước khi truy cập form
- Form bổ sung với các sections:
  1. Thông tin người bổ sung
  2. Thông tin cơ sở y tế
  3. Loại cập nhật và ghi chú
  4. Danh sách dị ứng (nếu chọn loại "new_allergy")
- Thêm/xóa nhiều dị ứng động
- Validation đầy đủ
- Loading states

### 📄 Files Created/Modified

#### Created:
1. `supabase/allergy-card-updates-schema.sql` - Database schema
2. `app/api/allergy-cards/[id]/updates/route.ts` - API endpoints
3. `app/allergy-cards/[id]/add-info/page.tsx` - Trang bổ sung thông tin
4. `docs/ALLERGY-CARD-UPDATE-HISTORY-GUIDE.md` - Hướng dẫn sử dụng
5. `CHANGELOG-ALLERGY-CARD-UPDATE-HISTORY.md` - File này

#### Modified:
1. `types/allergy-card.ts` - Thêm types cho update history
2. `app/allergy-cards/[id]/page.tsx` - Thêm hiển thị lịch sử bổ sung

### 🔒 Security

#### Xác thực mã thẻ:
- Yêu cầu nhập đúng `card_code` trước khi bổ sung
- Validate card_code trong API

#### Thông tin người bổ sung:
- Bắt buộc: Tên, Tổ chức, Cơ sở y tế
- Optional: Vai trò, SĐT, Email (để liên hệ sau)

#### Auto-approve:
- Dị ứng được tự động approve và thêm vào thẻ
- Có thể thay đổi logic nếu cần approval workflow

### 🎯 Use Cases

#### Case 1: Cấp cứu tại bệnh viện khác
Bệnh nhân được đưa đến bệnh viện B (khác với bệnh viện A đã cấp thẻ). Bác sĩ tại B:
1. Quét QR code trên thẻ dị ứng
2. Xem thông tin dị ứng hiện có
3. Phát hiện dị ứng mới (ví dụ: thuốc gây mê)
4. Bổ sung ngay vào thẻ
5. Lịch sử được lưu, bệnh viện A có thể xem sau

#### Case 2: Theo dõi lịch sử y tế
Bệnh nhân/Gia đình có thể:
1. Xem timeline đầy đủ các lần khám
2. Biết bệnh viện nào đã khám/phát hiện dị ứng
3. Thông tin dị ứng được cập nhật liên tục từ nhiều nguồn

### ⚙️ Technical Details

#### Database Triggers:
```sql
-- Auto-add allergies to main card
CREATE TRIGGER trigger_auto_add_approved_allergies
  AFTER INSERT OR UPDATE ON update_allergies
  FOR EACH ROW
  WHEN (NEW.is_approved = TRUE)
  EXECUTE FUNCTION auto_add_approved_allergies();
```

#### API Flow:
1. Verify card exists và card_code khớp
2. Insert update record vào `allergy_card_updates`
3. Insert allergies vào `update_allergies`
4. Trigger tự động insert vào `card_allergies`
5. Update timestamp của thẻ chính
6. Return update với details

### 📊 Data Model

```
allergy_cards (1) ----< (many) allergy_card_updates (1) ----< (many) update_allergies
      |                                                              |
      |                                                              |
      +---------------------< (many) card_allergies <---------------+
                              (auto-added by trigger)
```

### 🚀 Deployment

#### Prerequisites:
1. Supabase database access
2. Service role key trong env

#### Steps:
1. Chạy migration: `allergy-card-updates-schema.sql`
2. Deploy Next.js app
3. Test flow: Tạo thẻ → Bổ sung → Xem lịch sử

### 🐛 Known Issues

Không có issues được báo cáo tại thời điểm này.

### 🔮 Future Enhancements

#### Planned:
1. **Approval Workflow**: Cho phép admin xác minh trước khi approve
2. **Email Notifications**: Gửi email khi có bổ sung mới
3. **Push Notifications**: Thông báo real-time
4. **Statistics**: Báo cáo số lần bổ sung, cơ sở y tế phổ biến
5. **QR Scanner**: Tích hợp camera scan QR trực tiếp trong app
6. **Export History**: Xuất lịch sử bổ sung ra PDF/Excel

#### Under Consideration:
1. **Verify Button**: Nút xác minh cho từng update
2. **Comments**: Cho phép comment trên mỗi update
3. **Photos**: Upload ảnh kết quả xét nghiệm
4. **Multi-language**: Hỗ trợ nhiều ngôn ngữ

### 📚 Documentation

- Chi tiết hướng dẫn: `docs/ALLERGY-CARD-UPDATE-HISTORY-GUIDE.md`
- Database schema: `supabase/allergy-card-updates-schema.sql`

### 👥 Contributors

- AI Assistant - Design & Implementation

### 📝 Notes

- Tính năng này được thiết kế để hoạt động **public** (không cần login)
- Xác thực bằng `card_code` đảm bảo chỉ người có thẻ vật lý mới bổ sung được
- Database triggers đảm bảo dữ liệu luôn đồng bộ
- UI/UX đơn giản, dễ sử dụng ngay cả trong tình huống cấp cứu

---

**Version**: 1.0  
**Date**: 18/11/2024  
**Status**: ✅ Completed

