# Hướng dẫn sử dụng Rich Text Editor

## Tổng quan
Hệ thống ADR Management đã được nâng cấp với tính năng Rich Text Editor (trình soạn thảo văn bản đầy đủ) cho phần tạo và chỉnh sửa tin tức trong ADR Information. Tính năng này cung cấp các công cụ định dạng văn bản giống như Microsoft Word.

## Các tính năng chính

### 1. Định dạng Font
- **Font chữ**: Chọn từ nhiều font chữ khác nhau
- **Cỡ chữ**: 4 kích cỡ (Small, Normal, Large, Huge)
- **Màu chữ**: Bảng màu đầy đủ để chọn màu văn bản
- **Màu nền**: Tô màu nền cho văn bản

### 2. Định dạng văn bản cơ bản
- **In đậm (Bold)**: Ctrl+B hoặc click nút B
- **In nghiêng (Italic)**: Ctrl+I hoặc click nút I
- **Gạch dưới (Underline)**: Ctrl+U hoặc click nút U
- **Gạch ngang (Strikethrough)**: Gạch ngang văn bản
- **Superscript/Subscript**: Chỉ số trên/dưới (ví dụ: x², H₂O)

### 3. Canh lề và căn chỉnh
- **Căn trái** (mặc định)
- **Căn giữa**: Canh giữa văn bản
- **Căn phải**: Canh phải văn bản
- **Căn đều**: Canh đều hai bên

### 4. Tiêu đề (Headers)
- H1 đến H6: 6 cấp độ tiêu đề khác nhau
- Sử dụng để tổ chức nội dung theo cấu trúc

### 5. Danh sách
- **Danh sách có thứ tự**: Danh sách đánh số (1, 2, 3...)
- **Danh sách không thứ tự**: Danh sách dấu đầu dòng (bullets)
- **Danh sách checkbox**: Danh sách có thể đánh dấu hoàn thành
- **Indent/Outdent**: Thụt lề danh sách

### 6. Chèn nội dung đa phương tiện
- **Link**: Chèn liên kết URL
- **Hình ảnh**: Chèn ảnh từ URL
- **Video**: Nhúng video (YouTube, Vimeo, v.v.)

### 7. Định dạng khác
- **Blockquote**: Trích dẫn văn bản
- **Code Block**: Khối mã nguồn với highlight
- **Clean**: Xóa tất cả định dạng

## Cách sử dụng

### Tạo tin tức mới
1. Truy cập: **Admin** → **ADR Information** → **Tạo tin tức mới**
2. Nhập tiêu đề và thông tin cơ bản
3. Tại phần **Nội dung**, sử dụng thanh công cụ phía trên để định dạng:
   - Chọn văn bản cần định dạng
   - Click vào nút công cụ tương ứng
   - Hoặc sử dụng phím tắt (Ctrl+B, Ctrl+I, Ctrl+U)
4. Xem trước kết quả ngay trong editor
5. Click **Tạo tin tức** để lưu

### Chỉnh sửa tin tức
1. Truy cập: **Admin** → **ADR Information** → Click biểu tượng **Edit**
2. Nội dung hiện tại sẽ hiển thị với đầy đủ định dạng
3. Chỉnh sửa và áp dụng định dạng mới nếu cần
4. Click **Lưu thay đổi**

### Xem tin tức
Khi xem tin tức (cho cả admin và người dùng), nội dung sẽ được hiển thị với:
- Đầy đủ định dạng như đã soạn thảo
- Responsive trên mọi thiết bị
- Style chuyên nghiệp và dễ đọc

## Phím tắt hữu ích

| Phím tắt | Chức năng |
|----------|-----------|
| Ctrl+B | In đậm |
| Ctrl+I | In nghiêng |
| Ctrl+U | Gạch dưới |
| Ctrl+Z | Hoàn tác |
| Ctrl+Y | Làm lại |

## Components được thêm mới

### 1. RichTextEditor (`components/ui/RichTextEditor.tsx`)
Component editor với đầy đủ tính năng định dạng văn bản.

**Props:**
- `value`: string - Nội dung HTML
- `onChange`: (value: string) => void - Callback khi nội dung thay đổi
- `placeholder`: string - Placeholder text
- `height`: string - Chiều cao của editor (mặc định: 400px)

**Sử dụng:**
```tsx
import RichTextEditor from '@/components/ui/RichTextEditor'

<RichTextEditor
  value={content}
  onChange={(value) => setContent(value)}
  placeholder="Nhập nội dung..."
  height="500px"
/>
```

### 2. RichTextDisplay (`components/ui/RichTextDisplay.tsx`)
Component hiển thị nội dung HTML đã được định dạng.

**Props:**
- `content`: string - Nội dung HTML cần hiển thị
- `className`: string - Class CSS tùy chỉnh

**Sử dụng:**
```tsx
import RichTextDisplay from '@/components/ui/RichTextDisplay'

<RichTextDisplay 
  content={htmlContent}
  className="my-custom-class"
/>
```

## Thư viện sử dụng

- **react-quill**: v2.0.0 - Thư viện React wrapper cho Quill.js
- **quill**: v2.0.0 - Core editor engine

## Lưu ý kỹ thuật

### 1. Server-Side Rendering (SSR)
RichTextEditor được import động với `ssr: false` để tránh lỗi SSR trong Next.js:
```tsx
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
```

### 2. Lưu trữ dữ liệu
- Nội dung được lưu dưới dạng HTML trong database
- Trường `content` trong bảng `adr_information` lưu trữ HTML string
- Không cần thay đổi schema database

### 3. Bảo mật
- HTML được sanitize tự động bởi Quill
- Sử dụng `dangerouslySetInnerHTML` một cách an toàn trong RichTextDisplay
- Các thẻ script và iframe được filter

### 4. Performance
- Editor chỉ load khi cần thiết (lazy loading)
- CSS được optimize cho production
- Hỗ trợ tree-shaking để giảm bundle size

## Tùy chỉnh

### Thay đổi toolbar
Chỉnh sửa `modules.toolbar.container` trong `RichTextEditor.tsx`:
```tsx
const modules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    // Thêm hoặc bớt các nút theo nhu cầu
  ]
}
```

### Tùy chỉnh style
Chỉnh sửa CSS trong `<style jsx global>` của các component:
- Màu sắc theme
- Font size
- Spacing
- Border radius

## Troubleshooting

### Lỗi: "document is not defined"
**Nguyên nhân**: SSR issue
**Giải pháp**: Đảm bảo RichTextEditor được import với `dynamic` và `ssr: false`

### Nội dung không hiển thị đúng định dạng
**Nguyên nhân**: Thiếu CSS styles
**Giải pháp**: Kiểm tra import `react-quill/dist/quill.snow.css`

### Editor bị chậm với nội dung dài
**Nguyên nhân**: Too much content
**Giải pháp**: 
- Giới hạn độ dài nội dung
- Sử dụng pagination cho nội dung rất dài
- Enable delta diffing trong Quill config

## Tương lai

Các tính năng có thể được thêm:
- [ ] Upload ảnh trực tiếp (hiện tại chỉ hỗ trợ URL)
- [ ] Chèn bảng (tables)
- [ ] Mention users (@username)
- [ ] Emoji picker
- [ ] Spell checker tiếng Việt
- [ ] Export to PDF/Word
- [ ] Version history
- [ ] Collaborative editing (real-time)

## Liên hệ hỗ trợ

Nếu gặp vấn đề hoặc cần hỗ trợ, vui lòng liên hệ team phát triển.




