# Thiết kế xây dựng lại AI Consultant tại Phần D bằng Gemini 2.5 Pro

**Ngày:** 2026-09-15

**Trạng thái:** Đã được người dùng duyệt

**Phạm vi:** Biểu mẫu báo cáo nội bộ và `/public-report`

## 1. Bối cảnh

Phần D hiện có hai luồng chồng lấn:

- “AI Gợi ý” gọi `/api/ai/assessment-suggestion`, nhưng thực tế chỉ chạy bộ luật trong `lib/ai-assessment-service.ts`; nó không gọi mô hình AI.
- “AI Consultant” gọi `/api/ai/chatbot` và hỗ trợ OpenAI/Gemini bằng API key riêng của người dùng. Nhánh Gemini vẫn dò các model Gemini 1.5 cũ và gọi REST API thủ công.

Thiết kế hiện tại có các rủi ro chính:

- Một kết luận chung được dùng cho mọi thuốc nghi ngờ.
- Điểm và “độ tin cậy” được suy ra bằng các heuristic chưa được hiệu chuẩn lâm sàng.
- Thiếu dữ liệu đôi khi bị hiểu thành bằng chứng âm tính hoặc dương tính.
- Kết quả AI dạng văn bản tự do có thể được chèn thẳng vào bình luận chuyên môn.
- Không có schema đầu ra, kiểm tra nguồn, phiên bản prompt/ruleset hoặc audit đầy đủ.
- Rate limit hiện chỉ là stub và route AI đang nằm dưới giới hạn Vercel 10 giây.
- Cơ chế BYOK làm tăng độ phức tạp vận hành và tạo trải nghiệm không đồng nhất.

Tính năng mới hợp nhất hai luồng thành một AI Consultant duy nhất, dùng một API key Gemini trả phí do đơn vị quản lý trên server và cố định model ổn định `gemini-2.5-pro`.

## 2. Mục tiêu

1. Phân tích quan hệ nhân quả riêng cho từng thuốc nghi ngờ theo WHO-UMC và Naranjo.
2. Dùng Gemini 2.5 Pro để nhận diện, tổng hợp và giải thích bằng chứng; không giao cho mô hình quyền tính điểm cuối cùng.
3. Kết hợp bộ tiêu chí nội bộ được kiểm soát với Google Search grounding.
4. Chỉ gửi dữ liệu lâm sàng cần thiết và đã khử định danh tới Gemini.
5. Buộc cán bộ y tế xem xét và xác nhận từng nội dung trước khi ghi vào báo cáo.
6. Lưu đầy đủ dấu vết có thể kiểm toán: input đã khử định danh, nguồn, output, phiên bản model/prompt/ruleset và quyết định của người duyệt.
7. Cho phép sử dụng có kiểm soát ở cả biểu mẫu nội bộ và biểu mẫu công khai.
8. Giữ tương thích với dashboard, email, bản in và các báo cáo cũ.

## 3. Ngoài phạm vi

- AI không chẩn đoán, kê đơn hoặc thay thế quyết định của cán bộ y tế.
- AI không tự ghi hoặc tự gửi báo cáo.
- Không xây dựng chatbot dược lý tổng quát ngoài ngữ cảnh ca ADR.
- Không âm thầm chuyển sang model khác khi Gemini 2.5 Pro không khả dụng.
- Không lưu hoặc hiển thị chuỗi suy nghĩ nội bộ của mô hình.
- Không xây dựng kho vector/RAG tổng quát trong giai đoạn này.
- Không hồi tố tạo đánh giá theo từng thuốc cho báo cáo cũ.

## 4. Các quyết định đã chốt

- Hợp nhất “AI Gợi ý” và “AI Consultant”.
- Dùng API key trả phí do đơn vị quản lý, chỉ tồn tại ở server.
- AI chỉ tạo đề xuất; người dùng phải xác nhận từng thuốc.
- Dùng bộ tiêu chí nội bộ cùng Google Search grounding.
- Lưu audit đầy đủ với dữ liệu đã khử định danh.
- Chỉ gửi danh sách trắng dữ liệu lâm sàng, không gửi thông tin định danh.
- Đánh giá và lưu kết quả riêng cho từng thuốc, đồng thời giữ kết luận tổng hợp của Phần D.
- Cho phép cả người dùng nội bộ và người gửi báo cáo công khai sử dụng.
- Phiên công khai có một lượt phân tích và tối đa ba câu hỏi tiếp theo sau khi xác minh Turnstile.
- Audit có cùng vòng đời với báo cáo; phiên nháp công khai không gắn với báo cáo tự xóa sau 24 giờ.

## 5. Kiến trúc

```text
Biểu mẫu ADR
    -> ClinicalContextBuilder
    -> Data Readiness Gate
    -> GeminiEvidenceService (Gemini 2.5 Pro + Google Search grounding)
    -> Evidence Packet
    -> GeminiAssessmentService (Gemini 2.5 Pro + structured output)
    -> AssessmentSchemaValidator
    -> CausalityRuleEngine
    -> Clinical Review UI
    -> Người dùng xác nhận
    -> Lưu đánh giá theo thuốc + kết luận chung + audit
```

### 5.1 ClinicalContextBuilder

Thành phần này tạo payload duy nhất được phép rời hệ thống. Nó sử dụng allowlist, không dùng cơ chế “loại trừ một số trường” vì cách đó dễ làm rò dữ liệu khi form có thêm trường mới.

Payload cho phép gồm:

- Tuổi tại thời điểm ADR, không gửi ngày sinh đầy đủ.
- Giới tính và cân nặng.
- Tiền sử bệnh, tiền sử ADR/dị ứng nếu được nhập trong trường lâm sàng.
- Mô tả ADR, thời điểm khởi phát, mức độ nghiêm trọng, kết quả và xử trí.
- Xét nghiệm liên quan.
- Thuốc nghi ngờ: tên hoạt chất/tên thuốc, dạng dùng, liều, tần suất, đường dùng, chỉ định, ngày bắt đầu/kết thúc, dechallenge và rechallenge.
- Thuốc dùng đồng thời với các trường lâm sàng tương ứng.

Payload cấm gồm:

- Tên bệnh nhân, ngày sinh đầy đủ, điện thoại, email.
- Mã báo cáo hoặc định danh cơ sở dữ liệu.
- Tên và thông tin liên hệ của người báo cáo.
- Tên tài khoản, user ID, organization ID hoặc API key.

Các đoạn văn tự do được giới hạn độ dài, chuẩn hóa Unicode và đóng gói như dữ liệu. System instruction phải nói rõ không thực thi bất kỳ chỉ dẫn nào xuất hiện bên trong dữ liệu ca bệnh.

Trước khi tạo snapshot, bộ redactor cục bộ phải:

- Xóa khỏi mọi trường tự do các giá trị định danh đã biết từ form, kể cả khi người dùng lặp lại tên, ngày sinh, số liên hệ hoặc mã báo cáo trong phần mô tả.
- Che email, số điện thoại, số giấy tờ và chuỗi có mẫu mã báo cáo bằng quy tắc xác định.
- Gắn cờ các đoạn còn có khả năng chứa định danh. Khi bị gắn cờ, không gọi Gemini cho đến khi người dùng sửa hoặc xác nhận đã loại thông tin nhận dạng.

Không dùng một dịch vụ AI bên ngoài để thực hiện bước khử định danh vì điều đó sẽ làm dữ liệu rời hệ thống trước khi được làm sạch.

### 5.2 Data Readiness Gate

Không gọi Gemini nếu thiếu một trong các dữ liệu tối thiểu:

- Mô tả ADR.
- Ngày hoặc thông tin đủ để xác định ADR xảy ra sau khi bắt đầu ít nhất một thuốc nghi ngờ.
- Ít nhất một thuốc nghi ngờ có tên.
- Dữ liệu thời gian dùng thuốc ở mức có thể đánh giá hoặc được ghi rõ là không biết.

Gate trả danh sách trường thiếu và giải thích tiêu chí nào bị ảnh hưởng. Thiếu dữ liệu không được biến thành câu trả lời “không”.

### 5.3 Pipeline Gemini hai lượt

#### Lượt 1: tìm bằng chứng

`GeminiEvidenceService` gọi `gemini-2.5-pro` với Google Search grounding. Mục tiêu của lượt này là:

- Tìm bằng chứng thuốc-ADR theo từng thuốc.
- Tìm nhãn thuốc, tài liệu quản lý, hướng dẫn và y văn liên quan.
- Nhận diện những luận điểm ủng hộ, phản bác hoặc chưa xác định.
- Thu grounding metadata và citations từ response.

Server chuyển response thành `EvidencePacket` gồm các source ID nội bộ, URL, tiêu đề, tên miền, ngày truy cập, citation spans và tóm tắt luận điểm. Không lưu toàn văn trang nguồn.

#### Lượt 2: chuẩn hóa đánh giá

`GeminiAssessmentService` nhận clinical facts cùng Evidence Packet nhưng không bật search. Nó dùng structured output để trả JSON theo schema cố định. Việc tách lượt là có chủ ý: Gemini 2.5 Pro hỗ trợ grounding và structured output riêng rẽ, trong khi tài liệu hiện tại chỉ công bố khả năng kết hợp structured output với built-in tools trong cùng request cho dòng Gemini 3.

Mô hình không trả điểm Naranjo hoặc kết luận cuối. Nó chỉ trả trạng thái của từng tiêu chí, dữ kiện tham chiếu, source ID, nguyên nhân thay thế, thông tin thiếu và bản nháp nhận xét.

### 5.4 CausalityRuleEngine

Rule engine là code thuần, không gọi AI và phải cho kết quả xác định với cùng input.

Trách nhiệm:

- Tính điểm từng câu Naranjo.
- Phân loại Naranjo từ tổng điểm.
- Áp ruleset WHO-UMC được phiên bản hóa.
- Phát hiện mâu thuẫn giữa câu trả lời và dữ kiện thời gian.
- Không cho đánh giá “certain” khi tiêu chí bắt buộc còn `unknown`.
- Trả danh sách dữ liệu cần bổ sung.

### 5.5 ConsultationOrchestrator

Điều phối trạng thái, quyền truy cập, timeout, idempotency, quota và retry. Mỗi route chỉ thực hiện tối đa một lượt gọi Gemini để tránh một request kéo dài qua cả pipeline.

### 5.6 ClinicalReviewWorkflow

Kết quả AI luôn là bản nháp. Người dùng phải chọn một trong ba hành động cho từng thuốc:

- `accepted`: chấp nhận đề xuất.
- `edited`: chỉnh sửa rồi chấp nhận.
- `rejected`: không sử dụng đề xuất.

Chỉ các kết quả `accepted` hoặc `edited` mới được áp dụng. Kết luận tổng hợp của Phần D do người dùng chọn sau khi xem tất cả thuốc.

### 5.7 FollowUpChatService

Chat chỉ hoạt động trong context của phiên tư vấn hiện tại. Nó có thể giải thích kết quả, đề xuất dữ liệu cần bổ sung hoặc thực hiện lượt grounding mới khi câu hỏi cần nguồn mới. Chat không có tool ghi dữ liệu và không thay đổi kết quả đã xác nhận.

## 6. Structured output contract

Schema logic của lượt 2 có cấu trúc sau:

```text
assessment_version
case_summary
drug_assessments[]
  drug_ref
  timeline_facts[]
    fact_id
    statement
    source: form | evidence
  who_criteria
    temporal_relationship
    alternative_causes_excluded
    dechallenge_response
    known_reaction
    rechallenge_response
    pharmacologic_plausibility
      status: yes | no | unknown
      clinical_fact_ids[]
      source_ids[]
      rationale
  naranjo_answers[10]
    question_id: Q1..Q10
    answer: yes | no | unknown
    clinical_fact_ids[]
    source_ids[]
    rationale
  alternative_causes[]
  missing_information[]
  warnings[]
  draft_comment
overall_missing_information[]
```

Validator từ chối output nếu:

- Có `drug_ref`, `clinical_fact_id` hoặc `source_id` không tồn tại.
- Thiếu hoặc lặp câu Naranjo.
- Có giá trị ngoài enum.
- Thiếu thuốc so với request.
- Output tự thêm thông tin nhận dạng bệnh nhân.
- Rationale khẳng định dữ kiện không có trong form hoặc Evidence Packet.

Schema đúng cú pháp chưa đủ đảm bảo đúng ngữ nghĩa; validator và rule engine vẫn là bắt buộc.

## 7. Quy tắc Naranjo

Mỗi thuốc được chấm độc lập theo bảng cố định:

| Câu | Yes | No | Unknown |
|---|---:|---:|---:|
| Q1. Có báo cáo trước đây về phản ứng này | +1 | 0 | 0 |
| Q2. ADR xuất hiện sau khi dùng thuốc | +2 | -1 | 0 |
| Q3. ADR cải thiện khi ngừng thuốc/đối kháng | +1 | 0 | 0 |
| Q4. ADR tái xuất hiện khi dùng lại | +2 | -1 | 0 |
| Q5. Có nguyên nhân thay thế | -1 | +2 | 0 |
| Q6. ADR tái xuất hiện với placebo | -1 | +1 | 0 |
| Q7. Có nồng độ thuốc ở mức độc | +1 | 0 | 0 |
| Q8. Có quan hệ liều-đáp ứng | +1 | 0 | 0 |
| Q9. Có phản ứng tương tự khi phơi nhiễm trước | +1 | 0 | 0 |
| Q10. Có bằng chứng khách quan | +1 | 0 | 0 |

Phân loại:

- `>= 9`: `certain`.
- `5..8`: `probable`.
- `1..4`: `possible`.
- `<= 0`: `unlikely`.

Giao diện hiển thị tổng điểm không kèm mẫu số `/10`, vì tổng điểm lý thuyết không phải thang 10 điểm.

## 8. Quy tắc WHO-UMC

Ruleset WHO-UMC được lưu dưới dạng cấu hình phiên bản trong code và được kiểm thử bằng các ca chuẩn. Mapping ban đầu:

- `certain`: quan hệ thời gian hợp lý; không thể giải thích hợp lý bằng bệnh hoặc thuốc khác; dechallenge phù hợp; diễn biến có tính dược lý/bệnh lý xác định; rechallenge thỏa đáng khi cần thiết.
- `probable`: quan hệ thời gian hợp lý; ít có khả năng do bệnh hoặc thuốc khác; dechallenge hợp lý; không bắt buộc rechallenge.
- `possible`: quan hệ thời gian hợp lý nhưng bệnh/thuốc khác vẫn có thể giải thích; thông tin dechallenge có thể thiếu hoặc không rõ.
- `unlikely`: quan hệ thời gian làm mối liên quan khó xảy ra và nguyên nhân khác hợp lý hơn.
- `unclassified`: có dữ kiện gợi ý ADR nhưng cần thêm dữ liệu và dữ liệu đó đang có khả năng được bổ sung/xác minh.
- `unclassifiable`: báo cáo không đủ hoặc mâu thuẫn và không thể bổ sung/xác minh để đánh giá.

Không dùng trung bình trọng số giữa WHO-UMC và Naranjo. Hai kết quả được hiển thị song song; người duyệt chọn thang và kết luận tổng hợp phù hợp.

## 9. Kiểm soát nguồn

Nguồn được xếp hạng:

1. WHO, Bộ Y tế/Cục Quản lý Dược, FDA, EMA và nhãn thuốc chính thức.
2. Hướng dẫn chuyên ngành và bài báo bình duyệt.
3. Nguồn tham khảo dược học có biên tập.
4. Nguồn khác.

Server xếp hạng nguồn bằng danh sách domain quản lý được phiên bản hóa và metadata thư mục/bài báo; không dùng cấp nguồn do Gemini tự khai báo. Domain chưa nhận diện mặc định là cấp 4 cho đến khi được quản trị viên chuyên môn phê duyệt. Nguồn cấp 4 không được dùng để nâng mức quan hệ nhân quả. Mỗi luận điểm phải hiển thị nội dung được hỗ trợ, nguồn, cấp nguồn, ngày truy cập và thuốc/tiêu chí liên quan.

Nếu không có nguồn đủ chất lượng, pipeline vẫn được phép đánh giá từ dữ kiện ca bệnh và ruleset nội bộ, nhưng kết quả phải mang nhãn “Chưa xác minh được bằng nguồn ngoài”.

## 10. Giao diện và luồng người dùng

### 10.1 Điểm vào

Hai nút cũ được thay bằng một nút: **Phân tích với AI Consultant**. Nút luôn hiển thị. Nếu chưa đủ dữ liệu, mở panel và hiển thị checklist thay vì bị disable không rõ lý do.

### 10.2 Trạng thái phân tích

Panel hiển thị tuần tự:

1. Kiểm tra dữ liệu.
2. Tìm bằng chứng.
3. Chuẩn hóa đánh giá.
4. Tính điểm và đối chiếu tiêu chí.
5. Sẵn sàng xem xét.

Refresh trang không làm mất phiên đã được lưu. Nếu clinical context hash thay đổi, phiên chuyển sang `stale` và không thể áp dụng cho đến khi phân tích lại.

### 10.3 Thẻ kết quả theo thuốc

Mỗi thuốc có một thẻ chứa:

- Kết luận WHO-UMC.
- Điểm và phân loại Naranjo.
- Timeline.
- Dữ kiện ủng hộ và phản bác.
- Nguyên nhân thay thế.
- Dữ liệu thiếu.
- Nguồn y văn.
- Bản nháp nhận xét.
- Hành động chấp nhận, chỉnh sửa hoặc từ chối.

Không hiển thị phần trăm “độ tin cậy”. Thay vào đó hiển thị `Đủ dữ kiện`, `Còn thiếu dữ kiện` hoặc `Không thể đánh giá`.

- `Không thể đánh giá`: không qua Data Readiness Gate.
- `Còn thiếu dữ kiện`: qua gate nhưng còn ít nhất một tiêu chí bắt buộc ở trạng thái `unknown`.
- `Đủ dữ kiện`: qua gate và không còn tiêu chí bắt buộc ở trạng thái `unknown`; nhãn này không đồng nghĩa kết luận AI là đúng.

### 10.4 Áp dụng vào Phần D

- Người dùng xử lý từng thuốc trước.
- Sau đó chọn kết luận chung và thang đánh giá cho Phần D.
- Nếu `medical_staff_comment` đã có nội dung thủ công, hệ thống không ghi đè; người dùng chọn chèn bản nháp, thay thế hoặc giữ nguyên.
- UI phải phân biệt rõ nội dung AI ban đầu và nội dung cuối do người dùng xác nhận.

### 10.5 Chat tiếp theo

Chat nằm dưới kết quả và cung cấp các câu hỏi nhanh theo context. Câu trả lời có citation khi dùng nguồn ngoài. Một câu chat không được tự thay đổi bất kỳ trường nào.

## 11. Mô hình dữ liệu

### 11.1 `ai_consultations`

- `id UUID PRIMARY KEY`
- `report_id UUID NULL REFERENCES adr_reports(id) ON DELETE CASCADE`
- `actor_type internal|public`
- `user_id UUID NULL`
- `public_session_hash TEXT NULL`
- `status consultation_status`
- `context_snapshot JSONB`
- `context_hash TEXT`
- `model_id TEXT NOT NULL`
- `prompt_version TEXT NOT NULL`
- `ruleset_version TEXT NOT NULL`
- `usage JSONB`
- `error_code TEXT NULL`
- `created_at`, `updated_at`, `completed_at`, `expires_at`

### 11.2 `ai_evidence_sources`

- `id UUID PRIMARY KEY`
- `consultation_id UUID REFERENCES ai_consultations(id) ON DELETE CASCADE`
- `source_key TEXT`
- `url TEXT`, `title TEXT`, `domain TEXT`
- `quality_tier SMALLINT`
- `accessed_at TIMESTAMPTZ`
- `grounding_metadata JSONB`
- `claim_summary TEXT`

### 11.3 `ai_drug_assessments`

- `id UUID PRIMARY KEY`
- `consultation_id UUID REFERENCES ai_consultations(id) ON DELETE CASCADE`
- `drug_client_ref UUID`
- `suspected_drug_id UUID NULL REFERENCES suspected_drugs(id) ON DELETE CASCADE`
- `drug_snapshot JSONB`
- `who_input JSONB`, `who_level causality_assessment`
- `naranjo_answers JSONB`, `naranjo_score INTEGER`, `naranjo_level causality_assessment`
- `alternative_causes JSONB`, `missing_information JSONB`, `warnings JSONB`
- `ai_draft_comment TEXT`
- `review_status pending|accepted|edited|rejected`
- `final_who_level`, `final_naranjo_level`, `final_comment`
- `reviewed_by UUID NULL`, `reviewed_at TIMESTAMPTZ NULL`

### 11.4 `ai_consultation_events`

Append-only events gồm actor, action, metadata không định danh và timestamp. Update/delete trực tiếp bị chặn bằng policy; service chỉ được insert.

### 11.5 `ai_chat_messages`

Lưu role, nội dung đã khử định danh, citations, token usage và timestamp. Bản ghi bị cascade delete theo consultation.

### 11.6 `client_ref` cho thuốc

Thêm `client_ref UUID NOT NULL` vào `suspected_drugs`. Form tạo UUID bằng `crypto.randomUUID()` ngay khi thêm thuốc. Cùng UUID được dùng trong request AI và khi lưu báo cáo, bảo đảm kết quả không bị gán nhầm sau khi thêm, xóa hoặc đổi thứ tự thuốc.

## 12. API và trạng thái

### 12.1 Endpoints

- `POST /api/ai/consultations`: xác thực, Turnstile nếu công khai, sanitize, tạo context hash và consultation.
- `POST /api/ai/consultations/{id}/evidence`: chạy lượt grounding.
- `POST /api/ai/consultations/{id}/assessment`: chạy structured output, validate và tính rules.
- `GET /api/ai/consultations/{id}`: lấy trạng thái/kết quả có quyền truy cập.
- `POST /api/ai/consultations/{id}/reviews`: ghi quyết định từng thuốc.
- `POST /api/ai/consultations/{id}/messages`: hỏi đáp tiếp theo.
- `POST /api/ai/consultations/{id}/attach`: gắn consultation nháp với báo cáo và map drug client refs.

`attach` là idempotent và gọi một database function để map toàn bộ `drug_client_ref`, gắn `report_id` và kiểm tra context hash trong một transaction. Nếu transaction thất bại, báo cáo vẫn giữ kết luận thủ công/legacy đã lưu nhưng không được coi là đã áp dụng đánh giá chi tiết; UI phải cho phép thử lại thao tác liên kết. Server từ chối attach nếu kết luận tổng hợp trong request không khớp với nội dung đã được review.

### 12.2 State transitions

```text
created
  -> retrieving_evidence
  -> evidence_ready
  -> structuring
  -> ready
  -> reviewed
```

Từ trạng thái đang xử lý có thể chuyển sang `failed`. Khi context hash thay đổi, `ready` hoặc `reviewed` chuyển thành `stale`. Chỉ `ready` được review; chỉ kết quả đã review và khớp context hash mới được apply.

### 12.3 Idempotency

Mỗi action dùng idempotency key được ràng buộc với consultation, stage và context hash. Request lặp trả kết quả hiện có thay vì gọi lại Gemini.

### 12.4 Thời gian chạy

`vercel.json` hiện giới hạn `app/api/**` ở 10 giây. Route AI cần cấu hình `maxDuration: 60`. Mỗi endpoint chỉ gọi Gemini một lần và dùng timeout nội bộ ngắn hơn giới hạn hạ tầng. Client gọi tuần tự hai stage và hiển thị tiến độ.

Transport retry tối đa một lần cho timeout, 408 hoặc lỗi 5xx tạm thời. Không tự retry 429, authentication, quota, safety hoặc dữ liệu nghiệp vụ. Với 429, server chuẩn hóa `Retry-After` để UI cho người dùng chủ động thử lại. Schema validation failure không dùng transport retry; nó có đúng một repair request riêng theo mục 14. Retry do server điều phối và không tạo consultation mới.

## 13. Quyền, bảo mật và chống lạm dụng

### 13.1 API key

- Dùng SDK chính thức `@google/genai`.
- Key nằm trong `GEMINI_API_KEY` ở môi trường server.
- Không ghi key vào database, log, response hoặc client bundle.
- Không còn yêu cầu API key cá nhân trong luồng Phần D.
- Không đặt `BLOCK_NONE` để hạ các safety filter của provider. Ứng dụng kiểm tra `promptFeedback`, `finishReason` và safety metadata, đồng thời áp dụng các guardrail lâm sàng của chính hệ thống.

### 13.2 Người dùng nội bộ

- Phải đăng nhập và có quyền tạo/sửa báo cáo hoặc sở hữu draft tương ứng.
- API kiểm tra quyền ở mọi stage, không chỉ lúc tạo consultation.
- Giới hạn khởi tạo mặc định: 10 phân tích/giờ/người dùng.
- Giới hạn chat mặc định: 30 câu/giờ/người dùng.

### 13.3 Người dùng công khai

- Hoàn thành Turnstile trước khi tạo consultation.
- Server cấp cookie HttpOnly, Secure, SameSite=Lax chứa token phiên ngắn hạn; database chỉ lưu hash.
- Một phiên có một phân tích thành công và tối đa ba câu hỏi thành công.
- Mặc định tối đa hai phiên/giờ và năm phiên/ngày trên khóa kết hợp IP hash và user-agent hash.
- Hash dùng secret riêng và xoay theo ngày; không lưu IP thô và không dùng fingerprint xâm nhập.
- Retry kỹ thuật do server thực hiện không trừ lượt hỏi của người dùng.
- Tính năng công khai chỉ bật khi có hard spend cap được cấu hình; thiếu cap thì `AI_CONSULTANT_PUBLIC_ENABLED` phải mặc định là false.
- Câu trả lời công khai chỉ hỗ trợ hoàn thiện báo cáo và giải thích bằng chứng, không đưa chỉ định điều trị cá nhân hóa. Khi dữ liệu cho thấy tình huống khẩn cấp, UI hiển thị thông điệp chuẩn yêu cầu liên hệ cơ sở y tế thay vì để model tự quyết định nội dung.

### 13.4 RLS và truy cập dữ liệu

Các bảng AI bật RLS. Anonymous không được truy cập trực tiếp. Luồng công khai chỉ đi qua server routes và token phiên. Người dùng nội bộ chỉ đọc consultation của mình hoặc của báo cáo mà họ có quyền; admin tuân theo phạm vi tổ chức hiện có.

### 13.5 Kill switches

- `AI_CONSULTANT_ENABLED`: tắt toàn bộ AI nhưng giữ Phần D thủ công.
- `AI_CONSULTANT_PUBLIC_ENABLED`: tắt riêng luồng công khai.

Không có fallback ngầm sang OpenAI, Gemini Flash hoặc bộ heuristic cũ.

## 14. Xử lý lỗi

API dùng mã lỗi ổn định để UI không phụ thuộc message của Google:

- `AI_CONTEXT_INCOMPLETE`
- `AI_CONTEXT_STALE`
- `AI_UNAUTHORIZED`
- `AI_PUBLIC_SESSION_EXPIRED`
- `AI_RATE_LIMITED`
- `AI_BUDGET_EXCEEDED`
- `AI_PROVIDER_TIMEOUT`
- `AI_PROVIDER_UNAVAILABLE`
- `AI_SAFETY_BLOCKED`
- `AI_GROUNDING_UNAVAILABLE`
- `AI_SCHEMA_INVALID`
- `AI_SOURCE_VALIDATION_FAILED`

Hành vi:

- Grounding không có nguồn tốt: tiếp tục đánh giá từ dữ kiện và ruleset, kèm cảnh báo.
- Structured output sai: retry sửa đúng một lần; vẫn sai thì không hiển thị kết quả một phần.
- Provider lỗi: giữ Phần D thủ công hoạt động và cho phép resume đúng stage.
- Safety block: lưu mã lý do/finish reason, không lưu nội dung bị chặn.
- ADR nghiêm trọng/đe dọa tính mạng: UI hiển thị cảnh báo chuẩn hóa do hệ thống quản lý, không dùng nội dung tự sinh.

## 15. Audit, lưu trữ và xóa

Audit lưu:

- Snapshot input đã khử định danh và hash.
- Evidence Packet và citations.
- Structured output đã validate.
- Model ID, prompt version, ruleset version.
- Token/latency theo stage.
- Đề xuất gốc, nội dung chỉnh sửa, quyết định và người xác nhận.
- Lỗi và các lần retry.

Không lưu chain-of-thought. Không đưa nội dung lâm sàng thô vào log tập trung.

Consultation đã gắn báo cáo có cùng vòng đời với báo cáo và bị xóa hoặc ẩn danh theo cùng chính sách. Consultation công khai chưa gắn báo cáo có `expires_at` sau 24 giờ và được cleanup tự động.

## 16. Tương thích hệ thống hiện tại

Ba trường hiện hữu tiếp tục là kết luận tổng hợp:

- `causality_assessment`
- `assessment_scale`
- `medical_staff_comment`

Dashboard, email và bản in tiếp tục đọc các trường này. Kết quả chi tiết theo thuốc đọc từ bảng mới. Báo cáo cũ không có bản ghi chi tiết vẫn hiển thị bình thường.

`lib/ai-assessment-service.ts`, endpoint assessment cũ và nhánh chatbot BYOK được ngừng sử dụng sau khi rollout hoàn tất. Không xóa ngay cho đến khi migration UI và smoke test production đã qua, nhưng không được dùng làm fallback.

## 17. Kiểm thử

### 17.1 Unit

- Allowlist và khử định danh.
- Chronology và context hash.
- Toàn bộ bảng điểm Naranjo.
- Mapping WHO-UMC.
- Source ranking và source-reference validation.
- State machine và idempotency.
- Không ghi đè bình luận thủ công.

### 17.2 Contract/API

- Mock grounded response và structured output; CI không gọi Gemini thật.
- Schema sai, source ID giả, thiếu/lặp thuốc và mâu thuẫn dữ kiện.
- Auth nội bộ, RLS, Turnstile, public session, quota và attach.
- API key không xuất hiện trong response, log hoặc browser bundle.
- Timeout, retry, resume và stale context.

### 17.3 Integration/UI

- Một và nhiều thuốc.
- Chấp nhận, sửa, từ chối từng thuốc.
- Thêm/xóa/đổi thứ tự thuốc sau phân tích.
- Grounding thất bại.
- Refresh giữa các stage.
- Gemini không khả dụng nhưng form thủ công vẫn hoàn tất.
- Báo cáo, dashboard, email và bản in cũ không regression.

### 17.4 Clinical evaluation

Tạo bộ ít nhất 100 ca ADR đã khử định danh, mỗi ca được hai chuyên gia đánh giá độc lập; bất đồng được một chuyên gia thứ ba phân xử để tạo kết luận chuẩn. Điều kiện qua pilot:

- 100% phép tính Naranjo đúng từ answers.
- 0 trường định danh trong outbound payload và log.
- 0 trường hợp AI tự áp dụng kết luận.
- Ít nhất 95% citation thực sự hỗ trợ luận điểm được gắn.
- Đồng thuận kết luận theo thuốc với bộ chuẩn đạt ít nhất 80%.
- Mọi sai lệch có nguy cơ ảnh hưởng xử trí là lỗi chặn phát hành.

## 18. Quan sát vận hành và chi phí

Theo dõi theo stage:

- Latency và timeout.
- Input, output, cached và thinking tokens nếu response cung cấp.
- Chi phí theo tổ chức, actor type và ngày.
- Tỷ lệ không có nguồn chất lượng.
- Tỷ lệ schema fail/retry.
- Tỷ lệ chấp nhận, chỉnh sửa, từ chối và stale.
- Safety, quota, rate-limit và provider errors.

Gemini 2.5 Pro dùng thinking mặc định và thinking tokens được tính vào output usage. Mỗi request phải có giới hạn context/output. Ngưỡng ban đầu được kiểm chứng trên bộ ca chuẩn trước rollout; tăng giới hạn chỉ khi eval cho thấy truncation hoặc suy luận thiếu, không dựa trên cảm nhận.

## 19. Lộ trình phát hành

1. **Nền tảng:** migration, types, context builder, schema validator, rule engine, audit và test fixtures.
2. **Gemini pipeline:** SDK, hai stage, citations, errors và observability.
3. **Shadow nội bộ:** chạy AI nhưng không cho apply; chuyên gia đối chiếu bộ ca thật đã khử định danh.
4. **Pilot nội bộ:** nhóm nhỏ được review/apply; theo dõi chỉnh sửa và lỗi.
5. **Mở rộng nội bộ:** bật theo feature flag sau khi đạt acceptance criteria.
6. **Pilot công khai:** Turnstile, quota, spend cap và ba follow-up questions.
7. **Mở rộng công khai:** chỉ sau khi pilot ổn định và được đơn vị phê duyệt.
8. **Dọn legacy:** bỏ UI/endpoints/service cũ sau một chu kỳ phát hành ổn định.

Trước khi bật production hoặc luồng công khai, đơn vị phải hoàn tất rà soát điều khoản xử lý dữ liệu, billing/spend cap, khu vực xử lý dữ liệu và quy trình ứng phó sự cố với tài khoản Google dùng cho Gemini API.

## 20. Tài liệu kỹ thuật tham chiếu

- [Gemini 2.5 Pro](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro)
- [Gemini API libraries](https://ai.google.dev/gemini-api/docs/libraries)
- [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search)
- [Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini safety settings](https://ai.google.dev/gemini-api/docs/safety-settings)
