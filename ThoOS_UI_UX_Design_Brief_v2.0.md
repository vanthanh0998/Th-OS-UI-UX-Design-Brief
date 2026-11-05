# THỢOS — UI/UX DESIGN BRIEF
**Bản dành cho Gemini Design · Business baseline v2.0 · 05/11/2026**  
**Tài liệu nguồn:** nhánh `main` đã merge, repository `vanthanh0998/thoos-platform`.  
**Mục đích:** thiết kế giao diện đẹp, dễ dùng, bám đúng nghiệp vụ và đủ rõ để Codex triển khai.  
**Phạm vi ưu tiên:** Sprint 1 / Issue #2; các màn hình Sprint 2–5 chỉ là concept có gắn nhãn, chưa giao lập trình.

> **QUAN TRỌNG:** Đây là bản tóm tắt có chủ đích cho thiết kế UI/UX, không thay thế BRD/PRD/SRS. Khi có xung đột, dùng thứ tự ưu tiên tại `docs/baseline-v2.0/README_START_HERE.md`; không tự sửa quy tắc nghiệp vụ. Các quyết định kỹ thuật, pháp lý, nhà cung cấp chưa duyệt không được thể hiện như chức năng đã sẵn sàng.

## 1. ThợOS là sản phẩm gì?
ThợOS là PWA tiếng Việt, ưu tiên điện thoại, dành cho **đội dịch vụ điện lạnh nhỏ (ban đầu khoảng 2–5 thợ)** và **khách hàng/chủ nhà** của họ. Sản phẩm lưu khách hàng, địa điểm lắp đặt, thiết bị, công việc, báo giá, bàn giao, lịch bảo trì và thông tin bảo hành được chia sẻ có kiểm soát. ThợOS **không phải** sàn tìm thợ, không tự động điều phối hoặc bán dữ liệu khách hàng giữa các đội.

**Mục tiêu UX:** đội trưởng nhìn thấy việc cần xử lý; thợ tại hiện trường thao tác nhanh; chủ nhà đọc được thẻ thiết bị/bảo hành mà không cài app. Giảm nhập liệu, tránh màn hình CRM nặng nề và tạo cảm giác đáng tin cậy.

### Persona và nguyên tắc quyền
- **Chủ đội (`owner`):** điều hành, quyền quản trị tổ chức, thành viên, khách hàng, thiết bị, thanh toán và gói dịch vụ.
- **Quản lý (`manager`):** vận hành phần lớn nghiệp vụ trong tổ chức; một số quyền billing riêng cho owner.
- **Kỹ thuật viên (`technician`):** ưu tiên tác vụ được giao; chỉ được thấy trường thông tin tối thiểu liên quan đến công việc được giao, không tự thấy toàn bộ khách hàng của đội.
- **Chủ nhà (`homeowner`):** truy cập thẻ web riêng tư sau lời mời + OTP + grant hợp lệ, chỉ thấy nội dung được chủ động chia sẻ, có thể giữ nhiều thẻ từ nhiều đội nhưng không gộp hồ sơ riêng giữa các đội.
- **Hỗ trợ nền tảng:** chỉ metadata vận hành, không được mặc nhiên xem dữ liệu khách hàng nội bộ.

## 2. Định hướng thẩm mỹ và trải nghiệm
**Hướng sáng tạo đề xuất, KHÔNG phải quyết định sản phẩm bất biến:** clean, hiện đại, tinh tế, dễ tin cậy; nền sáng, navy đậm, xanh ngọc nhấn hành động, trạng thái màu có ý nghĩa. Có thể đề xuất một hướng khác đẹp hơn nhưng phải nêu rõ lý do và giữ tương phản/tính dùng được.

- **Mobile-first:** thiết kế các kích thước 360, 390/430 px; desktop từ 1280 px. Không cuộn ngang hoặc modal che nút chính trên màn hình nhỏ.
- **Thao tác tại hiện trường:** nút chạm tối thiểu 44×44 px, một hành động chính rõ ràng/màn hình; thanh điều hướng/ngữ cảnh không lấn nội dung; hỗ trợ bàn phím và focus.
- **Ngôn ngữ:** toàn bộ microcopy tiếng Việt thân thiện, ngắn, không dùng từ kỹ thuật thô; ngày `DD/MM/YYYY`, số tiền VND không có phần thập phân, múi giờ hiển thị Việt Nam.
- **Hiệu suất cảm nhận:** skeleton/loading, thao tác lưu nháp, mạng chậm, không mạng và retry an toàn; MVP cần mạng để đồng bộ, **không quảng cáo offline sync**.
- **Điều hướng:** trang đầu trả lời được *công việc hôm nay, khách tới hạn, báo giá chờ duyệt, lịch đang chờ xác nhận*. Nút chính khi tính năng công việc đã có: **“Tạo công việc mới”**.
- **Giao diện không nên:** dashboard quá nhiều biểu đồ; bảng dữ liệu dài trên mobile; menu 3 tầng; hiệu ứng phô trương; thông báo thành công không có bằng chứng; ép tải app native.

### Thiết kế hệ thống tối thiểu cần bàn giao
Bảng màu/tokens, type scale, grid & spacing, radius/shadow, light theme, icon set, navigation mobile/desktop, buttons, input/search, select, stepper, cards, status chip, dialogs, toast, empty/error/loading/permission views, bảng/ danh sách responsive, confirm destructive, form validation. Tên component và quy tắc biến thể rõ ràng để Codex tái sử dụng.

## 3. ƯU TIÊN GIAO NGAY: Sprint 1 / Issue #2
**Phạm vi chính thức Issue #2:** Auth, organizations, roles, customers, properties và tenant-owned devices; mobile-first UI và dữ liệu giả lập. Không thêm chức năng Sprint 2–5 vào PR Sprint 1.

| Màn hình / luồng cần thiết kế | Người dùng | Nội dung và hành động bắt buộc | Cần chú ý |
|---|---|---|---|
| Đăng nhập / quên mật khẩu / đăng xuất | Staff | Email + mật khẩu, trạng thái xác minh, lỗi rõ ràng, bảo vệ phiên | Không nhầm với OTP chủ nhà |
| Thiết lập đội / chuyển đội | Owner / người thuộc nhiều đội | Tên tổ chức, đội hiện hành rõ ràng, chuyển tổ chức tường minh | Không hiển thị lẫn dữ liệu hai đội |
| Quản lý thành viên và vai trò | Owner/manager theo quyền | Danh sách thành viên, mời, trạng thái, vai trò, cảnh báo | Không cho xóa/revoke chủ sở hữu cuối cùng |
| Khung ứng dụng / trang tổng quan ban đầu | Staff | Navigation, tổ chức hiện hành, thông báo và các card trạng thái | Với chức năng Sprint sau, dùng nhãn “Sắp ra mắt”/placeholder hoặc ẩn; không giả bộ dữ liệu đã hoạt động |
| Danh sách khách hàng | Owner/manager | Tìm kiếm, tạo mới, trạng thái archived, khách có nhiều địa điểm | Số điện thoại tùy chọn, **không tự gộp** khách theo số |
| Tạo/sửa khách hàng | Owner/manager | Tên 2–120 ký tự Unicode, số điện thoại không bắt buộc, thông tin riêng tư | Lỗi validation dưới trường, lưu nháp nếu rời màn hình |
| Chi tiết khách hàng | Theo quyền | Thông tin được phép, nhiều địa điểm, danh sách thiết bị | Technician không tự thấy toàn bộ ghi chú/phone |
| Tạo/sửa địa điểm | Owner/manager | Nhãn địa điểm, địa chỉ và khách liên kết, nhiều địa điểm/khách | Không để địa chỉ xuất hiện trên QR công khai |
| Danh sách/chi tiết thiết bị | Theo quyền | Loại, hãng, model, serial (không bắt buộc), địa điểm, trạng thái | Không auto-match giữa 2 org; serial có thể trùng |
| Tạo/sửa thiết bị | Owner/manager | Chọn địa điểm, loại, hãng/model, serial optional, lưu hợp lệ | Chặn liên kết sai tenant; lỗi có hướng dẫn |
| Màn hình quyền hạn / mạng / trống / xung đột | Tất cả staff | 403/404, loading, empty, 409, offline, lỗi server, retry | Không tiết lộ dữ liệu org khác; không nhân đôi bản ghi |

**Definition of UI-ready Sprint 1:** luồng từ đăng nhập → chọn đội → tìm/tạo khách → tạo địa điểm → tạo thiết bị hoàn chỉnh, gồm trạng thái sai lỗi và responsive mobile/desktop. Có ma trận nhìn thấy/chỉnh sửa theo owner/manager/technician, không chỉ một mockup cho mọi role.

**Không triển khai trong Sprint 1:** công việc, báo giá, thu tiền, chứng cứ bàn giao, booking thực, OTP homeowner, QR private card, lịch bảo trì, report billing. Có thể tạo design concepts của các mục này ở bộ riêng cho tương lai, nhưng gắn nhãn **“FUTURE CONCEPT — NOT SPRINT 1”**.

## 4. Bản đồ MVP tổng thể — để giữ thiết kế nhất quán
| Giai đoạn | Màn hình / luồng | Chú ý |
|---|---|---|
| Sprint 1 | Sign-in, switch org, members, customers, properties, devices | Triển khai trước, đầy đủ chi tiết |
| Sprint 2 | Job wizard 5 bước; chi tiết công việc; báo giá/revision; ledger thanh toán | Completed khác paid; quote cần duyệt đúng version |
| Sprint 3 | Ảnh trước/sau, bàn giao; lịch bảo trì và liên hệ thủ công | Không bắt buộc ảnh cho mọi ca; không khẳng định đã gửi tin |
| Sprint 4 | QR public, invite/OTP, homeowner cards; booking/đổi lịch; thợ “Đang đến” | Public QR không lộ PII; requested chưa giữ chỗ; không GPS |
| Sprint 5 | Subscription, report, export, privacy/audit, kiểm tra UX hồi quy | Read-only/export; bảo toàn thẻ đã chia sẻ có điều kiện |
| Sau MVP | Formal warranty claim, referral, AI, GPS, auto SMS/Zalo, marketplace, payment gateway | Không thiết kế như tính năng đã phát hành |

**IA gợi ý của PRD:** `/app/today`, `/app/customers`, `/app/customers/:id`, `/app/devices/:id`, `/app/jobs/new`, `/app/jobs/:id`, `/app/quotes/:id`, `/app/bookings`, `/app/maintenance`, `/app/reports`, `/app/billing`, `/q/:opaque`, `/claim/:invite`, `/home/cards`, `/home/cards/:id`, `/approve/:token`. Đây là khái niệm routes, không bắt buộc bản thiết kế Sprint 1 phải có tất cả.

## 5. Các quyết định nghiệp vụ KHÔNG ĐƯỢC VI PHẠM

### DEC-01 — QR, lời mời, xác minh
- QR công khai chỉ chứa locator ngẫu nhiên, **không** hiển thị tên, số điện thoại, địa chỉ, lịch sử, số serial riêng tư.
- Thẻ riêng tư chỉ mở sau lời mời **một lần / 7 ngày** và OTP đúng số điện thoại đích (**5 phút / tối đa 5 lần thử**), có grant phù hợp.
- OTP xác nhận quyền kiểm soát số điện thoại, **không chứng minh người đó sở hữu thiết bị**. Có luồng tranh chấp hỗ trợ; không hiển thị dữ liệu riêng trước grant.

### DEC-02 — Tenant/organization isolation
- Mỗi đội có hồ sơ khách/thiết bị của riêng đội. Cùng serial không được tự động gộp giữa đội A/B.
- Khi chuyển đội, ngữ cảnh đang chọn phải rõ ràng. Thợ chỉ thấy phần việc được phân công. Chủ nhà có thể thấy nhiều thẻ được cấp riêng lẻ, không có master record xuyên đội.

### DEC-03 — Công việc và tiền tách biệt
- “Hoàn thành công việc” **không có nghĩa** “Đã thanh toán”; quote được duyệt cũng chưa đồng nghĩa đã thu tiền.
- Biên nhận/hoàn tiền/điều chỉnh là ledger bất biến; tổng thực thu phải là số tiền **sau khi trừ hoàn tiền**, có thể thu nhiều lần, hoàn một phần.
- Mọi số tiền là integer VND; không cho sửa trực tiếp giao dịch đã xác nhận. Thiết kế phải có trạng thái unpaid/partial/paid/overpaid là trạng thái suy ra, không giả bộ đã nhận tiền.

### DEC-04 — Đặt lịch và dời lịch
- Khách bấm “Gửi yêu cầu” tạo trạng thái **requested**, **chưa giữ chỗ/chưa xác nhận**.
- Chỉ dispatcher xác nhận và gán thợ sau khi kiểm tra lịch trùng; mặc định dịch vụ 90 phút + buffer di chuyển 30 phút, có cấu hình.
- Khi đề xuất đổi lịch, lịch cũ vẫn giữ cho đến khi chủ nhà chấp nhận thay đổi. `en_route` là trạng thái thủ công, không hứa ETA/GPS.

### DEC-05 — Subscription hết hạn
- Trial 14 ngày; quá hạn ngày 1–7 có cảnh báo nhưng đầy đủ quyền; ngày 8–30 chỉ xem và export; ngày 31+ tạm ngưng thao tác đội, vẫn có luồng hỗ trợ/export.
- Thẻ chủ nhà đã chia sẻ vẫn duy trì ít nhất 12 tháng sau đình chỉ hoặc hết hạn bảo hành đã ghi nhận (lấy thời điểm muộn hơn), trừ lý do pháp lý/quyền riêng tư hợp lệ.
- Đội read-only/suspended **không nhận yêu cầu đặt lịch mới**, thẻ không được thể hiện như dịch vụ còn hoạt động.

### Các scope P0 thêm
- **QUO-001:** báo giá có revision bất biến sau khi gửi; khách xác minh để duyệt đúng revision/hash; nội dung thay đổi cần phê duyệt lại. Nếu miễn báo giá phải có lý do, xác nhận của khách; không gắn nhãn approved.
- **EVD-001:** ảnh trước/sau tùy trường hợp; nếu template bắt buộc thì ít nhất một ảnh mỗi pha hoặc quản lý ghi lý do ngoại lệ. Ảnh private, bản bàn giao cuối là snapshot không sửa âm thầm.
- **ETA-001:** nút “Đang đến” là cập nhật thủ công của thợ được phân công; **không hiển thị bản đồ GPS/lộ trình/ETA tự động**.

## 6. Luồng tham chiếu UX cho các Sprint sau (KHÔNG code sớm)
**J1 — Công việc:** Chọn/tạo khách → địa điểm và thiết bị → mô tả dịch vụ → tạo báo giá revision hoặc waiver có xác nhận → làm việc → bằng chứng nếu áp dụng → bàn giao → ghi nhận thanh toán riêng → cấp lời mời thẻ riêng tư.

**J2 — Chủ nhà & booking:** Quét QR trung tính → nhận invitation → xác minh OTP/grant → chỉ xem thẻ được chia sẻ → gửi yêu cầu lịch `requested` → dispatcher xác nhận/gán thợ → đề xuất đổi lịch cần chủ nhà đồng ý → thợ ấn “Đang đến” thủ công.

**J3 — Nhắc bảo trì:** danh sách đến hạn theo lịch VN → sao chép mẫu tin nhắn → người vận hành liên hệ thủ công → tự đánh dấu `contacted`/`snoozed`/`booked`. Không nói hệ thống đã gửi tin hay khách đã nhận nếu chưa có bằng chứng.

**J4 — Subscription:** hết trial → nhắc thanh toán → grace full access → read-only/export → suspended/export/support; homeowner grant lịch sử vẫn vận hành trong điều kiện giữ dữ liệu hợp lệ.

## 7. State design và microcopy bắt buộc
**Mọi màn hình chức năng** cần nêu đủ: loading, chưa có dữ liệu, không tìm thấy kết quả, mất mạng, không có quyền, lỗi trường nhập, stale edit (409), lỗi server, xác nhận hành động ảnh hưởng dữ liệu, lưu thành công, retry/idempotency. Với ảnh/OTP cần trạng thái đang xử lý, quá hạn, số lần thử còn lại ở mức an toàn.

| Trạng thái | Ví dụ microcopy đúng | Không nên viết |
|---|---|---|
| Booking requested | “Đã gửi yêu cầu. Đội thợ sẽ liên hệ xác nhận lịch.” | “Bạn đã đặt lịch thành công lúc 9h” |
| Thanh toán chưa có xác nhận | “Chưa ghi nhận thanh toán” | “Đã thanh toán” vì job đã hoàn tất |
| Gửi liên hệ thủ công | “Sao chép nội dung nhắn khách” | “Tin nhắn đã gửi” |
| OTP đang xử lý | “Đang yêu cầu mã xác minh…” | “SMS đã giao thành công” khi chưa có xác nhận nhà cung cấp |
| Không có quyền | “Bạn không có quyền xem mục này.” | Hiển thị PII trong thông báo lỗi |
| Chỉnh sửa trùng | “Thông tin đã thay đổi. Tải bản mới nhất trước khi lưu.” | Tự ghi đè bản mới |
| Mất mạng | “Không có kết nối. Kiểm tra mạng rồi thử lại.” | “Dữ liệu đã được đồng bộ ngoại tuyến” |

## 8. Gói bàn giao Gemini → BA/PM/UX-QC → Codex
**Yêu cầu Gemini xuất ra:**
1. **Screen inventory**: tên màn, persona, sprint, user goal, quyền và CTA chính.
2. **User flows**: luồng thành công + thất bại, sơ đồ điều hướng và điểm xác nhận.
3. **High-fidelity UI**: mobile 390px và desktop 1440px; ưu tiên có thêm 360px. Các trạng thái chính được nhìn thấy, không chỉ trang đẹp nhất.
4. **Design system**: font/typography, tokens, spacing, màu, variants, accessibility, iconography.
5. **Component contract**: props/variants, validation, role-gating, loading/empty/error, modal và toast.
6. **Dev handoff**: link prototype/figma hoặc mã UI, assets hợp lệ, mock-data ghi rõ giả lập, cấu trúc navigation, tương tác và responsive rules.
7. **Traceability**: mỗi màn hoặc flow gắn ít nhất một FR/BR/DEC/US; đánh dấu `Sprint 1` vs `Future concept`.
8. **Open questions**: điều gì trong brief không đủ rõ phải hỏi, **không tự chọn quy tắc nghiệp vụ**.

**Cổng review của BA/PM:**
- P0: lộ dữ liệu khác org/QR, sai quyền thợ, `requested` thành confirmed, completed thành paid, quote được duyệt nhầm phiên bản, tự gửi SMS/GPS, màn hình triển khai sai Sprint.
- P1: tác vụ nhiều bước không cần thiết, đọc khó ở 360px, thiếu trạng thái lỗi/không có quyền, validation mơ hồ, nút chính khó thấy.
- P2: chênh lệch spacing/icon, viền, animation, mỹ thuật không gây lỗi thao tác.

**Không được claim:** code từ Figma/prototype = đã chạy nghiệp vụ; screenshot đẹp = đã đạt bảo mật; bộ 72 test case = đã pass. 72 QC cases của baseline ban đầu là *Not Run* đến khi được thực thi ở môi trường phù hợp.

## 9. Prompt làm việc cho Gemini
> Bạn là Senior Product Designer của ThợOS. Hãy đọc toàn bộ brief trước khi dựng giao diện. Đây là bản tóm tắt từ business baseline v2.0 đã merge vào `main`; khi có điểm thiếu, hỏi thay vì tự thay đổi nghiệp vụ. Trước tiên hãy trả lại (A) màn hình Sprint 1, (B) navigation và user flow, (C) design direction + tokens, (D) các quyết định còn hỏi. Sau đó dựng high-fidelity mobile 390px + desktop 1440px cho **Sprint 1**: sign-in, switch org, members, customers, properties, devices, role/empty/error states. Tạo thiết kế đẹp, đơn giản, premium, tiếng Việt, thao tác nhanh cho đội thợ; không code các tính năng Sprint 2–5. Mock data phải gắn nhãn. Bàn giao code/components/prototype và checklist để Codex triển khai mà không phải đoán. Với màn hình future concept, gắn nhãn “NOT SPRINT 1”.

## 10. Nguồn chuẩn và liên kết (đã merge vào `main`)
- [Quy tắc thứ tự ưu tiên của baseline](https://github.com/vanthanh0998/thoos-platform/blob/main/docs/baseline-v2.0/README_START_HERE.md)
- [DEC-01…DEC-05 và phạm vi P0/P1](https://github.com/vanthanh0998/thoos-platform/blob/main/docs/baseline-v2.0/00_DECISIONS_AND_CHANGELOG.md)
- [BRD v2.0](https://github.com/vanthanh0998/thoos-platform/blob/main/docs/baseline-v2.0/01_BRD.md)
- [PRD v2.0](https://github.com/vanthanh0998/thoos-platform/blob/main/docs/baseline-v2.0/02_PRD.md)
- [SRS / Business Rules](https://github.com/vanthanh0998/thoos-platform/blob/main/docs/baseline-v2.0/03_SRS_BUSINESS_RULES.md)
- [Data model và ma trận quyền](https://github.com/vanthanh0998/thoos-platform/blob/main/docs/baseline-v2.0/04_DATA_MODEL.md)
- [Backlog theo Sprint](https://github.com/vanthanh0998/thoos-platform/blob/main/docs/baseline-v2.0/06_BACKLOG.csv)
- [UX Flows tiếng Việt](https://github.com/vanthanh0998/thoos-platform/blob/main/docs/architecture/UX_FLOWS_VI.md)
- [API authorization matrix](https://github.com/vanthanh0998/thoos-platform/blob/main/docs/api/AUTH_MATRIX.md)
- [ADR-0004 Payment Ledger](https://github.com/vanthanh0998/thoos-platform/blob/main/docs/adr/0004-append-only-payment-ledger.md)
- [Open technical decisions](https://github.com/vanthanh0998/thoos-platform/blob/main/docs/pm/OPEN_DECISIONS.md)
- [Sprint 1 — Issue #2](https://github.com/vanthanh0998/thoos-platform/issues/2)

**Tài liệu được chuẩn bị ngày 05/11/2026 từ GitHub `main`.** Nếu yêu cầu thay đổi sau thời điểm này, cập nhật brief theo quyết định được phê duyệt thay vì trộn v1.0/v1.1.
