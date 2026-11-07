# BÁO CÁO NGHIỆM THU THIẾT KẾ UI/UX — THỢOS
**Tài liệu:** `docs/reviews/UI_REVIEW_LATEST.md`  
**Phiên bản:** v3.0-QC-FOLLOWUP (Bổ sung toàn diện P0-01 QUO-001, P0-02 Transition Guard, P1 Subscription & Technician Scoping)  
**Trạng thái nghiệm thu:** `CHANGES_SUBMITTED_FOR_REVIEW` (Đang chờ BA/PM/QC thẩm định nghiệm thu — Không tự ý đánh dấu ACCEPTED)  
**Ngày thực hiện:** 2026-11-06  
**Nhánh Git:** `feat/visual-refinement-v2.3`  
**Remote Repository:** `https://github.com/vanthanh0998/Th-OS-UI-UX-Design-Brief`  

---

## 1. MA TRẬN PHÂN LOẠI & TRẠNG THÁI HIỆU CHỈNH THEO QC REVIEW FOLLOW-UP

Báo cáo phân định rõ ràng giữa mã nguồn sản phẩm thực tế, kết quả kiểm thử tự động, và các điều kiện nghiệm thu:

| Hạng mục | Yêu cầu nghiệp vụ BA/PM/QC | Mã nguồn triển khai (Real Code) | Bằng chứng kiểm thử tự động | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- |
| **P0-01: QUO-001 Quotation Approval & Waiver** | • Không cho technician tự bấm nút để tạo báo giá ở trạng thái approved.<br>• Snapshot nội dung bất biến, revision number và deterministic hash (`computeQuotationHash`).<br>• Bằng chứng xác nhận khách hàng: `approvedByCustomer: true`, `approverName`, `approvedAt`, `hash`.<br>• Biên bản miễn trừ báo giá hợp lệ (Waiver): `waiverReason`, `customerAcknowledged: true`, `waivedAt`, `waivedBy`.<br>• Chặn chuyển sang `DANG_SUA` nếu chưa có approval hoặc waiver hợp lệ. | `src/components/technician/JobDetailModal.tsx`<br>`src/lib/status-machine.ts`<br>`src/lib/types.ts` | • `src/lib/status-machine.test.ts` (6 tests QUO-001 PASSED):<br>- Hash deterministic & tamper-evident<br>- Chặn `DANG_SUA` khi không có quote<br>- Chặn khi quote đang `pending_homeowner`<br>- Chặn fake approved thiếu bằng chứng<br>- Cho phép khi có approval khách ký<br>- Cho phép khi có waiver hợp lệ | `CHANGES_SUBMITTED_FOR_REVIEW` |
| **P0-02: Unified Job Transition Guard** | • Bỏ chuyển trạng thái nhanh bỏ qua kiểm tra nghiệp vụ.<br>• Dùng chung một transition guard (`validateJobTransition`) cho cả Dashboard và Job Detail Modal.<br>• Kiểm tra quyền, tổ chức, trạng thái job, điều kiện quote/waiver và subscription.<br>• Có unit tests cho tất cả trường hợp không hợp lệ. | `src/lib/status-machine.ts`<br>`src/App.tsx`<br>`src/components/technician/JobDetailModal.tsx` | • `src/lib/status-machine.test.ts` (Tests validateJobTransition PASSED):<br>- Chặn nhảy cóc trạng thái<br>- Chặn cross-tenant transition<br>- Chặn khi thiếu quote/waiver | `CHANGES_SUBMITTED_FOR_REVIEW` |
| **P1: Subscription Write Protection** | • Tenant `read_only` và `suspended` không được thực hiện thao tác ghi trái chính sách.<br>• Áp dụng kiểm tra ở handler (`canPerformWriteOperation`), không chỉ ẩn nút UI.<br>• Viết unit test cho các điều kiện này. | `src/lib/status-machine.ts`<br>`src/App.tsx` | • `src/lib/status-machine.test.ts` (3 tests subscription write lock PASSED):<br>- Chặn transition khi `read_only`<br>- Chặn transition khi `suspended`<br>- Chặn write operations tại handler boundary | `CHANGES_SUBMITTED_FOR_REVIEW` |
| **P1: Technician Job Access Scoping** | • Technician chỉ nhìn thấy và thao tác trên jobs được phân công (`assignedTechnicianId === currentUser.id`).<br>• Owner và Manager quản lý toàn bộ ca trong tenant.<br>• Áp dụng kiểm tra ở handler và view (`getVisibleJobsForUser`). | `src/lib/status-machine.ts`<br>`src/App.tsx` | • `src/lib/status-machine.test.ts` (3 tests technician scoping PASSED):<br>- Chặn thợ thao tác ca người khác (`NOT_ASSIGNED`)<br>- Cho phép Owner thao tác toàn bộ ca<br>- Lọc danh sách ca hiển thị đúng theo thợ | `CHANGES_SUBMITTED_FOR_REVIEW` |
| **Visual Design v3.0 (3 Reference Screens)** | • Customers mobile 390px.<br>• Customers desktop 1280px.<br>• Technician Dashboard mobile 390px.<br>• Phân cấp thị giác rõ nét, tông Navy `#0a1e3f` / Teal `#0d9488`, mật độ thông tin cao, không mang cảm giác demo. | `src/components/customers/CustomersView.tsx`<br>`src/components/technician/TechnicianDashboard.tsx`<br>`src/App.tsx` | • Ảnh chụp thực tế Playwright CLI lưu tại `docs/reviews/screenshots/`:<br>- `customers-desktop-1280.png`<br>- `customers-mobile-390.png`<br>- `technician-dashboard-mobile-390.png` | `CHANGES_SUBMITTED_FOR_REVIEW` |

---

## 2. CHI TIẾT THỰC THI CÁC BẢO VỆ NGHIỆP VỤ

### 2.1. QUO-001 — Chu trình Báo giá, Hash Bất biến & Bằng chứng Khách Duyệt
1. **Khóa nút tự động duyệt:** Loại bỏ hoàn toàn nút technician tự bấm duyệt trực tiếp sang `DANG_SUA`.
2. **Snapshot Bất biến & Băm nội dung:**
   Hàm `computeQuotationHash(revisionNumber, items, total, createdAt)` băm toàn bộ mảng hạng mục và chi phí thành chuỗi mã định danh chuẩn (vd: `#REV1-A7E890B2`). Mọi thay đổi về đơn giá hoặc số lượng đều làm sai lệch hash.
3. **Bằng chứng khách hàng phê duyệt:**
   Chỉ khi khách hàng xác nhận, hệ thống ghi nhận đối tượng `QuotationApprovalEvidence`:
   ```ts
   {
     approvedByCustomer: true,
     approverName: "Chị Mai (Chủ hộ)",
     approvedAt: "2026-11-06T10:15:00Z",
     approvedRevisionNumber: 1,
     hash: "REV1-A7E890B2"
   }
   ```
4. **Biên bản Miễn trừ Báo giá (Waiver):**
   Trong trường hợp bảo trì tiêu chuẩn không phát sinh, hệ thống cho phép lập Waiver với lý do tối thiểu 5 ký tự và xác nhận của khách hàng (`customerAcknowledged: true`), lưu vào `waiverEvidence`.
5. **Khóa cứng bước Sửa chữa (`DANG_SUA`):**
   Hàm `hasValidQuotationAuthorization(job)` kiểm tra bắt buộc phải có ít nhất 1 revision có `status === 'approved'` với đầy đủ bằng chứng HOẶC 1 revision có `status === 'waived'` với xác nhận của khách. Nếu không có, `validateJobTransition` lập tức từ chối với mã lỗi `QUO_001_REQUIRED`.

### 2.2. Unified Business Transition Guard (`validateJobTransition`)
Toàn bộ thao tác chuyển trạng thái trên cả **Dashboard Hiện trường** và **Job Detail Workspace** đều đi qua duy nhất một cổng kiểm soát:
1. **Subscription Policy:** Chặn mọi thao tác ghi nếu tổ chức ở trạng thái `read_only` hoặc `suspended`.
2. **Tenant Isolation:** Ca làm việc phải thuộc tổ chức đang hoạt động (`job.organizationId === currentOrg.id`).
3. **Technician Boundary:** Thợ chỉ được cập nhật ca được phân công cho chính mình.
4. **State Machine Order:** Tuân thủ thứ tự các bước không nhảy cóc.
5. **QUO-001 Invariant:** Bắt buộc có Báo giá được khách duyệt hoặc Waiver trước khi chuyển sang `DANG_SUA`.

### 2.3. Lọc Dữ liệu theo Thợ (`getVisibleJobsForUser`)
Tại `src/App.tsx`, mảng ca làm việc truyền vào `TechnicianDashboard` được lọc động:
- Với role `technician`: Chỉ trả về các ca có `job.assignedTechnicianId === currentUser.id`.
- Với role `owner` hoặc `manager`: Trả về toàn bộ ca trong tổ chức.

---

## 3. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (49/49 TESTS PASSED)

Chạy thực tế qua lệnh: `npx tsx --test src/lib/*.test.ts`:

```text
✔ createBookingRequest from real module creates independent request with requested status
✔ validateBookingRequest enforces required fields and Vietnamese phone format
✔ submitting a booking request does not alter jobs list
✔ validateBookingStep1 detects missing service and invalid quantity
✔ validateBookingStep2 requires preferred date and time slot
✔ validateBookingStep3 validates Vietnamese phone numbers correctly
✔ sortJobs prioritizes active jobs before upcoming jobs and completed jobs
✔ sortJobs with PRIORITY sorts emergency symptom jobs first
✔ INTEGRATION 1: Booking Creation Workflow — creates independent BookingRequest without altering operational jobs
✔ INTEGRATION 2: Organization Switching Workflow — preserves identity, scopes data, resets selected records
✔ INTEGRATION 3: Payment Recording Workflow — Owner records payment, recomputes status dynamically, handles overpayment and refund
✔ INTEGRATION 4: Permission Denial Workflow — blocks unauthorized operations at the core function boundary
✔ getUserMemberships and getAccessibleOrganizations return only organizations with active membership
✔ canSwitchToOrganization allows authorized tenant and rejects unauthorized tenant
✔ switchOrganizationContext preserves user identity and refuses access when membership is missing
✔ calculateTotalPaid accurately sums entries and handles refunds
✔ computePaymentStatusFromLedger computes all 5 statuses: unpaid, partially_paid, paid, overpaid, refunded
✔ validateVNDAmount strictly enforces integer positive VND
✔ canRecordPayment allows Owner and Manager, strictly blocks Technician from confirming ledger
✔ recordPaymentLedgerEntry successfully records full payment, partial payment, and overpayment
✔ recordPaymentLedgerEntry rejects duplicate submission with same idempotencyKey
✔ recordPaymentLedgerEntry enforces refund constraints: mandatory reason and amount bound
✔ reportPaymentByTechnician records report note without confirming ledger
✔ calculateBaseServiceCost calculates single wall aircon cleaning correctly
✔ calculateBaseServiceCost calculates cassette / ceiling aircon cleaning correctly
✔ calculateBaseServiceCost calculates multi-machine bookings accurately without arbitrary discounts
✔ calculateJobTotal calculates subtotal, parts, discount and net total correctly
✔ formatVND formats Vietnamese currency strings properly
✔ status machine allows forward progression
✔ status machine disallows skipping forward without intermediate steps
✔ status machine allows cancellation from in-flight states
✔ getNextStatus returns valid step sequence
✔ STATUS_MAP contains correct standardized labels
✔ computeQuotationHash generates deterministic and tamper-evident hash
✔ QUO-001: blocks transition to DANG_SUA when no quotation revision exists
✔ QUO-001: blocks transition to DANG_SUA when quotation is still pending homeowner approval
✔ QUO-001: blocks transition to DANG_SUA if status is approved but lacks customer confirmation evidence
✔ QUO-001: allows transition to DANG_SUA with verified customer approval evidence
✔ QUO-001: allows transition to DANG_SUA with valid customer-acknowledged quotation waiver
✔ P1: blocks transitions when organization subscription is read_only
✔ P1: blocks transitions when organization subscription is suspended
✔ P1: canPerformWriteOperation strictly enforces subscription write policies
✔ Tenant Guard: blocks transitions for jobs belonging to a different organization
✔ P1: blocks technician from operating on a job assigned to another technician
✔ P1: allows owner and manager to operate on any tenant job
✔ P1: getVisibleJobsForUser filters jobs by assigned technician for tech role
✔ filterByTenant strictly separates data between Org A and Org B
✔ validateCrossTenantLink rejects associating property to a customer from another tenant
✔ validateDeviceTenantLink ensures device, customer, and property share same organizationId

Tổng cộng: 49/49 tests passed (100% thành công)
```

---

## 4. TÀI NGUYÊN BÀN GIAO & LIÊN KẾT TẢI

1. **Git Bundle:** `export/thoos-v2.3-visual-refinement.bundle`
   - URL: `http://localhost:3000/export/thoos-v2.3-visual-refinement.bundle`
2. **Git Patch:** `export/thoos-v2.3-visual-refinement.patch`
   - URL: `http://localhost:3000/export/thoos-v2.3-visual-refinement.patch`
3. **ZIP Handover Package:** `public/thoos-ui-refinement-v2.3-handover.zip`
   - URL: `http://localhost:3000/thoos-ui-refinement-v2.3-handover.zip`
4. **Bộ ảnh Reference Screens (Chụp từ Playwright CLI):**
   - `docs/reviews/screenshots/customers-desktop-1280.png`
   - `docs/reviews/screenshots/customers-mobile-390.png`
   - `docs/reviews/screenshots/technician-dashboard-mobile-390.png`
