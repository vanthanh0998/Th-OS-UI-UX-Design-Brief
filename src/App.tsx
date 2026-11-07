/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Snowflake,
  Calendar,
  User,
  Plus,
  Wifi,
  WifiOff,
  Sparkles,
  Layers,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  BookOpen,
  Building2,
  Users,
  Airplay,
  Shield,
  RotateCcw,
  Archive,
  Sliders,
} from 'lucide-react';
import {
  Job,
  JobStatus,
  StaffRole,
  StaffUser,
  Organization,
  Customer,
  Property,
  Device,
  BookingRequest,
  PaymentLedgerEntry,
  PaymentTransactionType,
} from './lib/types';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_STAFF_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_PROPERTIES,
  INITIAL_DEVICES,
  INITIAL_JOBS,
  INITIAL_BOOKING_REQUESTS,
} from './lib/mock-data';
import { getNextStatus, STATUS_MAP } from './lib/status-machine';
import { calculateJobTotal } from './lib/pricing';
import {
  recordPaymentLedgerEntry,
  reportPaymentByTechnician,
  computePaymentStatusFromLedger,
} from './lib/payment-ledger';
import { filterByTenant } from './lib/tenant-isolation';
import { switchOrganizationContext, INITIAL_MEMBERSHIPS } from './lib/org-membership';
import { JobDetailModal } from './components/technician/JobDetailModal';
import { ElectronicInvoiceModal } from './components/technician/ElectronicInvoiceModal';
import { TechnicianDashboard } from './components/technician/TechnicianDashboard';
import { BookingWizard } from './components/customer/BookingWizard';
import { CustomerTrackingView } from './components/customer/CustomerTrackingView';
import { SprintSpecModal } from './components/spec/SprintSpecModal';
import { AuthModal } from './components/auth/AuthModal';
import { SwitchOrganizationModal } from './components/organization/SwitchOrganizationModal';
import { TeamMembersView } from './components/organization/TeamMembersView';
import { CustomersView } from './components/customers/CustomersView';
import { PropertiesView } from './components/properties/PropertiesView';
import { DevicesView } from './components/devices/DevicesView';
import { MarketplaceConceptModal } from './components/marketplace/MarketplaceConceptModal';
import { HandoverExportModal } from './components/handover/HandoverExportModal';
import { DemoReviewToolsModal } from './components/dev/DemoReviewToolsModal';
import { StateFeedback } from './components/ui/StateFeedback';
import { Button } from './components/ui/Button';

export default function App() {
  // --- Sprint 1 Core State ---
  const [organizations, setOrganizations] = useState<Organization[]>(INITIAL_ORGANIZATIONS);
  const [currentOrg, setCurrentOrg] = useState<Organization>(INITIAL_ORGANIZATIONS[0]);

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(INITIAL_STAFF_USERS);
  const [currentUser, setCurrentUser] = useState<StaffUser>(INITIAL_STAFF_USERS[0]); // Default: Owner

  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);

  // Independent Booking Requests State (P0 Invariant: Never merged into jobs)
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>(INITIAL_BOOKING_REQUESTS);

  // Operational Jobs State
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem('tho_os_jobs_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Ignore
    }
    return INITIAL_JOBS;
  });

  // Navigation Tabs:
  // Sprint 1 Primary Tabs: 'CUSTOMERS' | 'PROPERTIES' | 'DEVICES' | 'MEMBERS'
  // Operational Prototype Tabs: 'TECHNICIAN_JOBS' | 'BOOKING_FLOW' | 'CUSTOMER_TRACKING'
  type MainTab =
    | 'CUSTOMERS'
    | 'PROPERTIES'
    | 'DEVICES'
    | 'MEMBERS'
    | 'TECHNICIAN_JOBS'
    | 'BOOKING_FLOW'
    | 'CUSTOMER_TRACKING';

  const [activeTab, setActiveTab] = useState<MainTab>('CUSTOMERS');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSwitchOrgModalOpen, setIsSwitchOrgModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [invoiceJob, setInvoiceJob] = useState<Job | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isDemoToolsOpen, setIsDemoToolsOpen] = useState(false);
  const [currentCustomerJobId, setCurrentCustomerJobId] = useState<string>('JOB-2026-081');

  // State Feedback Test Mode (for demonstrating 403, 409, loading)
  const [feedbackState, setFeedbackState] = useState<
    'NONE' | '403_FORBIDDEN' | '409_CONFLICT' | 'SKELETON_LOADING'
  >('NONE');

  // Network Offline Indicator
  const [isOffline, setIsOffline] = useState(false);

  // Save jobs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tho_os_jobs_v2', JSON.stringify(jobs));
    } catch (e) {
      // Ignore
    }
  }, [jobs]);

  // Handlers for Jobs
  const handleUpdateJob = (updatedJob: Job) => {
    setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    if (selectedJob && selectedJob.id === updatedJob.id) {
      setSelectedJob(updatedJob);
    }
  };

  // Quick status step advancement
  const handleQuickAction = (job: Job) => {
    const next = getNextStatus(job.status);
    if (next) {
      const updated: Job = {
        ...job,
        status: next,
        completedAt: next === 'HOAN_THANH' ? new Date().toISOString() : job.completedAt,
      };
      handleUpdateJob(updated);
      // NOTE: Hoàn thành kỹ thuật tách biệt với mở phiếu thu DEC-03
    }
  };

  // Dynamic Payment Ledger Confirmation (P0-02 & P0-03)
  const handleConfirmPayment = (
    jobId: string,
    amount: number,
    method: 'TIEN_MAT' | 'CHUYEN_KHOAN_QR',
    type: PaymentTransactionType = 'payment',
    reason?: string,
    notes?: string,
    idempotencyKey?: string
  ): { success: boolean; error?: string } => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) {
      return { success: false, error: 'Không tìm thấy ca làm việc.' };
    }

    const res = recordPaymentLedgerEntry({
      job: targetJob,
      currentUser,
      amount,
      type,
      method,
      reason,
      notes,
      idempotencyKey,
    });

    if (!res.success || !res.updatedJob) {
      return { success: false, error: res.error || 'Ghi nhận sổ cái thất bại.' };
    }

    handleUpdateJob(res.updatedJob);
    if (invoiceJob && invoiceJob.id === jobId) {
      setInvoiceJob(res.updatedJob);
    }
    return { success: true };
  };

  // Technician payment report without direct ledger confirmation (P0-02)
  const handleReportPaymentByTech = (
    jobId: string,
    amount: number,
    method: 'TIEN_MAT' | 'CHUYEN_KHOAN_QR',
    notes?: string
  ) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) {
      return { success: false, message: '', error: 'Không tìm thấy ca làm việc.' };
    }

    const res = reportPaymentByTechnician(targetJob, currentUser, { amount, method, notes });
    if (!res.success) {
      return { success: false, message: '', error: res.error };
    }

    handleUpdateJob(res.job);
    if (invoiceJob && invoiceJob.id === jobId) {
      setInvoiceJob(res.job);
    }
    return { success: true, message: res.message };
  };

  // P0 Invariant: Homeowner booking creates independent BookingRequest with status 'requested'
  // Strictly does NOT create a Job, does NOT assign technician, does NOT auto-confirm schedule
  const handleBookingCreated = (newRequest: BookingRequest) => {
    setBookingRequests((prev) => [newRequest, ...prev]);
  };

  // Handlers for Sprint 1 Entities
  const handleAddCustomer = (c: Customer) => setCustomers([c, ...customers]);
  const handleUpdateCustomer = (c: Customer) =>
    setCustomers(customers.map((cust) => (cust.id === c.id ? c : cust)));
  const handleAddProperty = (p: Property) => setProperties([p, ...properties]);
  const handleAddDevice = (d: Device) => setDevices([d, ...devices]);
  const handleAddMember = (u: StaffUser) => setStaffUsers([...staffUsers, u]);
  const handleUpdateRole = (userId: string, newRole: StaffRole) =>
    setStaffUsers(staffUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

  const trackedJob = jobs.find((j) => j.id === currentCustomerJobId) || jobs[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#0d9488]/20 selection:text-[#0d9488] flex flex-col lg:flex-row">
      {/* 1. DESKTOP MODERN NAVY SIDEBAR (Hidden on mobile < lg) */}
      <aside className="hidden lg:flex w-64 bg-[#0a1e3f] text-slate-300 flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-800/90 select-none z-30 shadow-xl">
        {/* Top: Brand Header & Tenant Switcher Card */}
        <div className="p-4 space-y-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 px-2 pt-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-teal-500/20 shrink-0">
              <Snowflake className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-black text-xl text-white tracking-tight block leading-none">
                ThợOS
              </span>
              <span className="text-[11px] font-semibold text-teal-400 tracking-wider uppercase block mt-1">
                Field Service OS
              </span>
            </div>
          </div>

          {/* Current Tenant Switcher Card */}
          <div
            onClick={() => setIsSwitchOrgModalOpen(true)}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all space-y-1.5"
            title="Bấm để chuyển đổi tổ chức"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                Workspace
              </span>
              <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded border border-teal-500/30">
                {currentOrg.shortCode}
              </span>
            </div>
            <div className="font-bold text-white text-xs truncate flex items-center justify-between">
              <span className="truncate">{currentOrg.name}</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="space-y-6 pt-2">
            {/* Group 1: Vận hành & CRM */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Vận hành & CRM
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('CUSTOMERS')}
                className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'CUSTOMERS'
                    ? 'bg-teal-500/20 text-teal-300 border-l-4 border-teal-400 shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4 text-teal-400" />
                <span>Khách hàng</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('PROPERTIES')}
                className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'PROPERTIES'
                    ? 'bg-teal-500/20 text-teal-300 border-l-4 border-teal-400 shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <MapPin className="w-4 h-4 text-teal-400" />
                <span>Địa điểm & Căn hộ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('DEVICES')}
                className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'DEVICES'
                    ? 'bg-teal-500/20 text-teal-300 border-l-4 border-teal-400 shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Airplay className="w-4 h-4 text-teal-400" />
                <span>Thiết bị & QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('MEMBERS')}
                className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'MEMBERS'
                    ? 'bg-teal-500/20 text-teal-300 border-l-4 border-teal-400 shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="w-4 h-4 text-teal-400" />
                <span>Đội ngũ thợ</span>
              </button>
            </div>

            {/* Group 2: Điều phối & Hiện trường */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Điều phối & Hiện trường
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('TECHNICIAN_JOBS')}
                className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'TECHNICIAN_JOBS'
                    ? 'bg-teal-500/20 text-teal-300 border-l-4 border-teal-400 shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Wrench className="w-4 h-4 text-teal-400" />
                <span>Lịch thợ hôm nay</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('BOOKING_FLOW')}
                className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'BOOKING_FLOW'
                    ? 'bg-teal-500/20 text-teal-300 border-l-4 border-teal-400 shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-4 h-4 text-teal-400" />
                <span>Đặt lịch dịch vụ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CUSTOMER_TRACKING')}
                className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'CUSTOMER_TRACKING'
                    ? 'bg-teal-500/20 text-teal-300 border-l-4 border-teal-400 shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Theo dõi tiến độ</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom: User Profile Pill & Demo Tools Trigger */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {/* User Profile Trigger */}
          <div
            onClick={() => setIsAuthModalOpen(true)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-xs shrink-0 border border-teal-500/30">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-white truncate">{currentUser.fullName}</div>
              <div className="text-[10px] text-teal-300 font-medium capitalize">
                {currentUser.role === 'owner' ? 'Chủ cơ sở (Owner)' : currentUser.role === 'manager' ? 'Quản lý (Manager)' : 'Kỹ thuật viên'}
              </div>
            </div>
          </div>

          {/* Quick Demo & Review Tools Trigger */}
          <button
            type="button"
            onClick={() => setIsDemoToolsOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-slate-400 hover:text-teal-300 rounded-lg transition-colors font-medium"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span>Công cụ Demo & Review</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Offline Status Banner */}
        {isOffline && (
          <div className="bg-amber-600 text-white px-3 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm animate-fadeIn">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Mất kết nối mạng: Bạn đang xem dữ liệu lưu trên thiết bị. Các thao tác ghi cần kết nối Internet.
            </span>
            <button
              type="button"
              onClick={() => setIsOffline(false)}
              className="ml-1 underline text-white hover:text-amber-200 shrink-0"
            >
              Bật lại
            </button>
          </div>
        )}

        {/* Top Bar (Single Sleek Row on Desktop & Mobile) */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Left: Mobile Brand OR Desktop Context Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Mobile Brand (Hidden on Desktop) */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-[#0a1e3f] text-[#14b8a6] flex items-center justify-center shadow-xs shrink-0">
                <Snowflake className="w-4 h-4" />
              </div>
              <span className="font-black text-base text-[#0a1e3f] tracking-tight">ThợOS</span>
              <button
                type="button"
                onClick={() => setIsSwitchOrgModalOpen(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-[11px] font-bold text-teal-800 border border-slate-200"
              >
                <span>{currentOrg.shortCode}</span>
              </button>
            </div>

            {/* Desktop Context Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{currentOrg.name}</span>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-slate-900">
                {activeTab === 'CUSTOMERS'
                  ? 'Danh bạ Khách hàng'
                  : activeTab === 'PROPERTIES'
                  ? 'Địa điểm & Căn hộ'
                  : activeTab === 'DEVICES'
                  ? 'Thiết bị & QR Code'
                  : activeTab === 'MEMBERS'
                  ? 'Đội ngũ thợ'
                  : activeTab === 'TECHNICIAN_JOBS'
                  ? 'Lịch thợ hôm nay'
                  : activeTab === 'BOOKING_FLOW'
                  ? 'Đặt lịch dịch vụ'
                  : 'Theo dõi tiến độ'}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Desktop Organization Switcher Pill */}
            <button
              type="button"
              onClick={() => setIsSwitchOrgModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-800 transition-colors border border-slate-200/80"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span className="truncate max-w-[140px]">{currentOrg.name}</span>
            </button>

            {/* User Profile Avatar */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs transition-all shadow-xs"
              title={`Người dùng: ${currentUser.fullName}`}
            >
              <div className="w-6 h-6 rounded-lg bg-[#0a1e3f] text-teal-300 font-bold flex items-center justify-center text-xs">
                {currentUser.fullName.charAt(0)}
              </div>
              <span className="font-bold text-slate-900 hidden md:inline">{currentUser.fullName}</span>
            </button>

            {/* Demo Tools Button */}
            <button
              type="button"
              onClick={() => setIsDemoToolsOpen(true)}
              title="Công cụ Demo & Review"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Demo Tools</span>
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
        {/* State Feedback Display if Active */}
        {feedbackState !== 'NONE' && (
          <div className="mb-5">
            <StateFeedback
              type={feedbackState}
              onAction={() => setFeedbackState('NONE')}
              actionLabel="Đóng trạng thái kiểm thử"
            />
          </div>
        )}

        {/* TAB 1: SPRINT 1 - CUSTOMERS */}
        {activeTab === 'CUSTOMERS' && (
          <CustomersView
            currentOrg={currentOrg}
            customers={customers}
            properties={properties}
            devices={devices}
            currentUser={currentUser}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
          />
        )}

        {/* TAB 2: SPRINT 1 - PROPERTIES */}
        {activeTab === 'PROPERTIES' && (
          <PropertiesView
            properties={properties}
            customers={customers}
            devices={devices}
            currentUser={currentUser}
            onAddProperty={handleAddProperty}
          />
        )}

        {/* TAB 3: SPRINT 1 - DEVICES & NEUTRAL QR */}
        {activeTab === 'DEVICES' && (
          <DevicesView
            devices={devices}
            customers={customers}
            properties={properties}
            currentUser={currentUser}
            onAddDevice={handleAddDevice}
          />
        )}

        {/* TAB 4: SPRINT 1 - TEAM MEMBERS & RBAC */}
        {activeTab === 'MEMBERS' && (
          <TeamMembersView
            currentOrg={currentOrg}
            currentUser={currentUser}
            staffUsers={staffUsers}
            onAddMember={handleAddMember}
            onUpdateRole={handleUpdateRole}
          />
        )}

        {/* TAB 5: TECHNICIAN DASHBOARD (Filtered by current organization tenant) */}
        {activeTab === 'TECHNICIAN_JOBS' && (
          <TechnicianDashboard
            jobs={filterByTenant(jobs, currentOrg.id)}
            technicianName={currentUser.fullName}
            onOpenDetails={(j) => {
              setSelectedJob(j);
              setIsDetailModalOpen(true);
            }}
            onQuickAction={handleQuickAction}
            onOpenInvoice={(j) => {
              setInvoiceJob(j);
              setIsInvoiceModalOpen(true);
            }}
            onCreateJobRequest={() => setActiveTab('BOOKING_FLOW')}
          />
        )}

        {/* TAB 6: BOOKING FLOW (Independent BookingRequest) */}
        {activeTab === 'BOOKING_FLOW' && (
          <div>
            <div className="mb-3 p-3 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between text-xs text-blue-900">
              <span className="font-bold">Đặt lịch dịch vụ: Tạo yêu cầu hẹn (requested), chờ điều phối viên kiểm tra và cử thợ</span>
              <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">Chờ xác nhận</span>
            </div>
            <BookingWizard
              currentOrgId={currentOrg.id}
              onBookingCreated={handleBookingCreated}
              onCancel={() => setActiveTab('TECHNICIAN_JOBS')}
            />
          </div>
        )}

        {/* TAB 7: SPRINT TIẾP THEO - CUSTOMER TRACKING */}
        {activeTab === 'CUSTOMER_TRACKING' && (
          <div className="space-y-4">
            {jobs.length > 1 && (
              <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Chọn ca theo dõi:</span>
                <select
                  aria-label="Chọn ca sửa chữa đang theo dõi"
                  value={currentCustomerJobId}
                  onChange={(e) => setCurrentCustomerJobId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      #{j.id} - {j.customerName} ({j.brand})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <CustomerTrackingView
              job={trackedJob}
              onBookAnother={() => setActiveTab('BOOKING_FLOW')}
              onViewInvoice={(j) => {
                setInvoiceJob(j);
                setIsInvoiceModalOpen(true);
              }}
            />
          </div>
        )}
        </main>
      </div>

      {/* Mobile Ergonomic Bottom Bar (lg:hidden) */}
      <nav
        aria-label="Thanh điều hướng di động"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-2 flex items-center justify-around lg:hidden shadow-lg"
      >
        <button
          type="button"
          onClick={() => setActiveTab('CUSTOMERS')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'CUSTOMERS' ? 'text-[#0a1e3f] font-black' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[11px] font-bold">Khách hàng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TECHNICIAN_JOBS')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'TECHNICIAN_JOBS' ? 'text-[#0d9488] font-black' : 'text-slate-500'
          }`}
        >
          <Wrench className="w-5 h-5 text-teal-600" />
          <span className="text-[11px] font-bold">Lịch thợ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DEVICES')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'DEVICES' ? 'text-[#0a1e3f] font-black' : 'text-slate-500'
          }`}
        >
          <Airplay className="w-5 h-5" />
          <span className="text-[11px] font-bold">Máy lạnh</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'MEMBERS' ? 'text-[#0a1e3f] font-black' : 'text-slate-500'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[11px] font-bold">Đội thợ</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDemoToolsOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 transition-all"
        >
          <Sliders className="w-5 h-5 text-slate-400" />
          <span className="text-[11px] font-bold">Thêm</span>
        </button>
      </nav>

      {/* Staff Authentication & Role Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        staffUsers={staffUsers}
        currentUser={currentUser}
        onSelectUser={(u) => {
          setCurrentUser(u);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Switch Organization Tenant Modal (P0-01: verifies membership and preserves user identity) */}
      <SwitchOrganizationModal
        isOpen={isSwitchOrgModalOpen}
        onClose={() => setIsSwitchOrgModalOpen(false)}
        organizations={organizations}
        currentOrg={currentOrg}
        currentUser={currentUser}
        onSelectOrg={(org) => {
          const switchResult = switchOrganizationContext({
            currentUser,
            targetOrg: org,
            memberships: INITIAL_MEMBERSHIPS,
          });

          if (!switchResult.success || !switchResult.updatedUser) {
            alert(switchResult.error || 'Từ chối truy cập: Bạn không có tư cách thành viên hợp lệ tại tổ chức này.');
            return;
          }

          setCurrentOrg(org);
          setCurrentUser(switchResult.updatedUser);
          // P0-01: Reset selected records and form state on tenant switch
          setSelectedJob(null);
          setInvoiceJob(null);
          setCurrentCustomerJobId('');
        }}
      />

      {/* Technician Detailed Workspace Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdateJob={handleUpdateJob}
        onOpenInvoice={(job) => {
          setIsDetailModalOpen(false);
          setInvoiceJob(job);
          setIsInvoiceModalOpen(true);
        }}
      />

      {/* Electronic Invoice & Dynamic Payment Ledger Modal */}
      <ElectronicInvoiceModal
        job={invoiceJob}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        currentUser={currentUser}
        onConfirmPayment={handleConfirmPayment}
        onReportPaymentByTech={handleReportPaymentByTech}
      />

      {/* Sprint 1 Design Tokens & Wireframes Documentation Modal */}
      <SprintSpecModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
      />

      {/* Marketplace Future Concept Modal (PO Approved 3 Concepts - Not MVP) */}
      <MarketplaceConceptModal
        isOpen={isMarketplaceModalOpen}
        onClose={() => setIsMarketplaceModalOpen(false)}
      />

      {/* Handover Export & Download Modal */}
      <HandoverExportModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
      />

      {/* Dedicated Demo & Review Tools Modal */}
      <DemoReviewToolsModal
        isOpen={isDemoToolsOpen}
        onClose={() => setIsDemoToolsOpen(false)}
        feedbackState={feedbackState}
        onSetFeedbackState={setFeedbackState}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
        onOpenSpecModal={() => setIsSpecModalOpen(true)}
        onOpenMarketplaceModal={() => setIsMarketplaceModalOpen(true)}
        onOpenHandoverModal={() => setIsHandoverModalOpen(true)}
        onOpenSwitchOrgModal={() => setIsSwitchOrgModalOpen(true)}
        currentOrg={currentOrg}
      />
    </div>
  );
}
