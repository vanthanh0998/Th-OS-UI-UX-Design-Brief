# ThợOS — Nền Tảng Điều Hành & Đặt Lịch Sửa Chữa Máy Lạnh
## Bàn Giao Kỹ Thuật Master UI/UX Revision Request v2.1 (Sprint 1)

---

### 1. Thông Tin Bàn Giao & Phiên Bản
- **Phiên bản:** `v2.1-sprint-1-baseline`
- **Git Branch:** `feat/sprint-1-ui-revision-v2.1`
- **Baseline Commit SHA:** `4cc46cb` (Baseline) &rarr; `feat/sprint-1-ui-revision-v2.1`
- **Phạm vi hoàn thành:** Sprint 1 Nền tảng Tổ chức, Thành viên RBAC, Khách hàng, Địa điểm, Thiết bị máy lạnh, Bộ State Design ngoại lệ, và Marketplace Concept (Future Concept — Not MVP).

---

### 2. Danh Sách Màn Hình Sprint 1 Đã Hoàn Thành
1. **Screen 1.1: Staff Authentication & Session:**
   - Đăng nhập xác thực bằng Số điện thoại + Mật khẩu.
   - *Quy tắc RBAC bảo mật:* Vai trò (`owner`, `manager`, `technician`) được suy ra trực tiếp từ dữ liệu membership nội bộ, không yêu cầu người dùng tự chọn vai trò khi đăng nhập.
   - Công cụ chuyển nhanh nhân sự mẫu được gắn nhãn minh bạch `DEMO ONLY` phục vụ kiểm thử.
   - Khôi phục mật khẩu qua OTP (tuân thủ **DEC-01**: OTP hiệu lực 5 phút, giới hạn 5 lần thử sai).
   - Kiểm tra phiên làm việc (Session token, vai trò, Tenant ID).
2. **Screen 1.2: Switch Organization (Multi-tenancy Tenant):**
   - Chuyển đổi linh hoạt giữa các tổ chức/chi nhánh độc lập (**DEC-01 & DEC-02**).
   - Hiển thị nhãn vòng đời thuê bao (**DEC-05**: `active`, `trial`, `grace`, `read_only`, `suspended`).
3. **Screen 1.3: Quản trị Thành viên & Phân quyền RBAC:**
   - Danh sách nhân viên trong đội thợ với các vai trò chuẩn hóa: `owner`, `manager` (kèm trách nhiệm điều phối), `technician`.
   - Phân quyền động: Chỉ Owner/Manager mới có quyền thêm thành viên và đổi vai trò.
4. **Screen 1.4: Danh bạ Khách hàng (Customers Directory):**
   - Tìm kiếm tức thì theo số điện thoại hoặc họ tên.
   - Xem chi tiết danh sách địa điểm và máy lạnh thuộc quyền sở hữu của khách hàng.
   - Thêm mới khách hàng và chức năng Lưu trữ / Khôi phục hồ sơ cũ (Archive / Restore).
5. **Screen 1.5: Địa điểm & Bất động sản (Properties):**
   - Quản lý địa chỉ nhà, căn hộ chung cư của khách hàng.
   - Chỉ dẫn kỹ thuật tiếp cận (thang máy, bảo vệ, thang dây tiếp cận dàn nóng).
6. **Screen 1.6: Hồ sơ Thiết bị Máy lạnh & Neutral QR Code:**
   - Quản lý thông số máy lạnh: Model, hãng, công suất HP, loại gas (R32, R410A, R22), vị trí dàn lạnh/nóng.
   - Modal trình chiếu **Mã QR định danh trung tính (DEC-01 & DEC-02)**: Tuyệt đối không chứa PII, giải thích cơ chế truy cập riêng tư 7 ngày + OTP cho chủ nhà.
7. **Screen 1.7: Bộ State Design Ngoại Lệ:**
   - Tích hợp thanh công cụ trực quan:
     - **403 Forbidden:** Không có quyền truy cập theo RBAC.
     - **409 Conflict:** Xung đột sửa đổi dữ liệu đồng thời (Stale Edit).
     - **Skeleton Loading:** Khung xương tải trang.
     - **Network Offline Banner:** Cảnh báo mất mạng khi đi vào vùng sóng yếu.
8. **Màn Hình Concept Đặc Thù: Marketplace Future Concept (PO Approved):**
   - Đánh dấu nổi bật `FUTURE CONCEPT — NOT MVP`.
   - Ba ý tưởng cốt lõi:
     1. Tìm đội thợ gần nhà theo khu vực phục vụ (Service Area Matching, không dùng GPS nền).
     2. Xem hồ sơ đội thợ và nhân sự được công khai (Trách nhiệm pháp nhân thuộc về đội thợ).
     3. Đặt lại đội thợ và thợ quen đã phục vụ gia đình trước đó.

---

### 3. Bảng Khắc Phục Lỗi Nghiệp Vụ P0
| ID | Lỗi P0 đã sửa | Bằng chứng code đã xác minh |
| :--- | :--- | :--- |
| **P0-1** | Đặt lịch tự xác nhận và tự gán thợ | `/src/components/customer/BookingWizard.tsx`: Tạo đơn mã `REQ-xxxxxx` ở trạng thái `MOI` (requested), `assignedTechnicianId: undefined`, hiển thị "Chờ điều phối chỉ định thợ" theo **DEC-04**. |
| **P0-2** | Hoàn thành kỹ thuật = Đã thu tiền | `/src/App.tsx` & `/src/components/technician/ElectronicInvoiceModal.tsx`: Tách biệt trạng thái `HOAN_THANH` khỏi việc xác nhận thu tiền. Modal đổi thành Sổ cái thu tiền (**Payment Ledger append-only theo DEC-03**). |
| **P0-3** | Công thức hoa hồng tự chế 75% / 30% | `/src/lib/pricing.ts` & Dashboard: Đã xóa toàn bộ công thức `0.75 / 0.3` và biến `technicianPayout`. Đổi thành "Doanh số ca" và "Tổng giá trị hôm nay". |
| **P0-4** | Giả lập khoảng cách GPS "Cách x.x km" | `/src/components/technician/JobCard.tsx`, `JobDetailModal.tsx`: Đã xóa toàn bộ `distanceKm` và chuỗi giả lập. Nút thợ chuẩn hóa thành "Nhận ca & Bấm đang đến (**ETA-001**)". |
| **P0-5** | Mặc định bảo hành 3–6 tháng | `/src/components/customer/BookingWizard.tsx`: Thay bằng cam kết báo giá theo phiên bản (**QUO-001**), thời hạn bảo hành theo tem linh kiện thực tế. |
| **P0-6** | Text tự xưng "đồng bộ ngoại tuyến" | `/src/App.tsx`: Chuyển thành nút mô phỏng ngắt kết nối mạng minh bạch. |

---

### 4. Kết Quả Kiểm Tra Chất Lượng Tự Động
- **TypeScript & Linting:** Đạt 100% (`$ tsc --noEmit` &rarr; exit code 0).
- **Compilation:** Đạt 100% (`vite build` &rarr; build succeeded).
- **Unit Tests (`tsx --test`):** 15/15 unit test passed:
  - `src/lib/pricing.test.ts`: 5 tests pass (chi phí máy đơn, nhiều máy tính thẳng không chiết khấu tùy tiện, clean total, formatVND).
  - `src/lib/status-machine.test.ts`: 5 tests pass (chuyển đổi tuần tự, hủy ca, labels chuẩn Section 7).
  - `src/lib/booking-validation.test.ts`: 5 tests pass (validate Step 1/2/3, sort theo time và emergency symptoms không phụ thuộc distance).

---

### 5. Danh Sách Minh Chứng Ảnh Chụp (Playwright CLI)
Các file ảnh đã được lưu tại `.aistudio/artifacts/computer_use/`:
- `10-sprint1-customers-360px.png`: Màn hình Khách hàng trên viewport hẹp di động 360px.
- `11-sprint1-customers-390px.png`: Màn hình Khách hàng trên viewport iPhone 390px.
- `12-sprint1-desktop-1280px.png`: Màn hình Dashboard trên Desktop 1280x800.
- `13-marketplace-concept-modal.png`: Màn hình Marketplace Future Concept (3 ý tưởng định hướng PO).
- `06-sprint1-state-403.png`: Giao diện 403 No Permission.
- `07-sprint1-state-409.png`: Giao diện 409 Conflict Stale Edit.
- `08-sprint1-auth-modal.png`: Giao diện Modal Đăng nhập nhân sự & DEMO tool.
- `09-sprint1-switch-org-modal.png`: Giao diện Modal Chuyển đổi Tổ chức Tenant.

---

### 6. Danh Mục Thành Phần Chưa Kết Nối Backend (Mock Data)
- **Tổ chức (Organizations):** Đang sử dụng danh sách mẫu 2 tổ chức đại diện `org-dienlanh-saigon` và `org-bacnam-service`.
- **Nhân sự (Staff Users):** 4 nhân viên mẫu đại diện 3 role (`owner`, `manager`, `technician`).
- **Khách hàng, Địa điểm, Thiết bị:** Lưu trữ cục bộ trong state React (`INITIAL_CUSTOMERS`, `INITIAL_PROPERTIES`, `INITIAL_DEVICES`).
- **Gửi SMS OTP:** Mô phỏng qua mã cố định `123456` với bộ đếm 300s và 5 lần thử sai theo DEC-01.
- **Payment Ledger:** Ghi nhận mảng append-only trong state và localStorage.

---

### 7. Tệp Xuất Xưởng & Hướng Dẫn Tải Về Trực Tiếp
Tất cả các tệp sau đã được tạo và lưu trong thư mục `public/` của ứng dụng:
1. **Gói ZIP Toàn Bộ Mã Nguồn:** `thoos-ui-revision-v2.1-handover.zip` (2.9 MB)
   - Đường dẫn HTTP: `/thoos-ui-revision-v2.1-handover.zip`
   - Chứa mã nguồn sạch (không node_modules, không secrets), toàn bộ components, tests và screenshots.
2. **Git Bundle:** `export/thoos-sprint1-revision.bundle` (2.5 MB)
   - Đường dẫn HTTP: `/export/thoos-sprint1-revision.bundle`
   - Đầy đủ git history, commit SHA: `a95046932ffc87ab09a7fc7dd0691c06a6db320e`
3. **Git Patch:** `export/sprint-1-ui-revision-v2.1.patch` (600 KB)
   - Đường dẫn HTTP: `/export/sprint-1-ui-revision-v2.1.patch`

**Lệnh đồng bộ một chạm từ máy cá nhân lên GitHub repository `vanthanh0998/Th-OS-UI-UX-Design-Brief`:**
```bash
git fetch /duong-dan/thoos-sprint1-revision.bundle feat/sprint-1-ui-revision-v2.1:feat/sprint-1-ui-revision-v2.1
git checkout feat/sprint-1-ui-revision-v2.1
git push origin feat/sprint-1-ui-revision-v2.1
```
