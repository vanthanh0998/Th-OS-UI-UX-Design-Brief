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
} from './lib/types';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_STAFF_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_PROPERTIES,
  INITIAL_DEVICES,
  INITIAL_JOBS,
} from './lib/mock-data';
import { getNextStatus, STATUS_MAP } from './lib/status-machine';
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
import { DesignVariant } from './components/exploration/VisualExplorationSwitcher';
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
  const [designVariant, setDesignVariant] = useState<DesignVariant>('A');
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

  // Payment confirmation - records to payment ledger
  const handleConfirmPayment = (jobId: string, method: 'TIEN_MAT' | 'CHUYEN_KHOAN_QR') => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const newEntry = {
          id: `LEDGER-${Date.now()}`,
          jobId,
          amount: 150000,
          method,
          recordedBy: currentUser.fullName,
          recordedAt: new Date().toISOString(),
        };
        return {
          ...j,
          paymentStatus: 'paid',
          paymentEntries: [...(j.paymentEntries || []), newEntry],
        };
      })
    );
  };

  const handleJobCreated = (newJob: Job) => {
    setJobs([newJob, ...jobs]);
    setCurrentCustomerJobId(newJob.id);
    setActiveTab('CUSTOMER_TRACKING');
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 md:pb-12 font-sans selection:bg-[#0d9488]/20 selection:text-[#0d9488]">
      {/* Offline Status Simulation Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm animate-fadeIn">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            Chế độ ngoại tuyến: Dữ liệu đang được lưu cục bộ trên máy và sẽ tự động đồng bộ khi có mạng.
          </span>
          <button
            type="button"
            onClick={() => setIsOffline(false)}
            className="ml-2 underline text-white hover:text-amber-200"
          >
            Bật lại kết nối
          </button>
        </div>
      )}

      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Org Switcher */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0a1e3f] text-[#14b8a6] flex items-center justify-center shadow-sm">
              <Snowflake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-[#0a1e3f] tracking-tight">ThợOS</span>
                <button
                  type="button"
                  onClick={() => setIsSwitchOrgModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors border border-slate-200"
                >
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span className="truncate max-w-[120px] sm:max-w-[180px]">{currentOrg.name}</span>
                  <span className="text-[10px] text-teal-700 bg-teal-100 px-1 rounded uppercase">
                    {currentOrg.shortCode}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Hệ điều hành đội thợ điện lạnh • Sprint 1 Nền tảng Tổ chức & Tài sản
              </p>
            </div>
          </div>

          {/* Right Controls: Staff Profile & State Testers */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs transition-all shadow-xs"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-[11px]">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-slate-900 leading-none">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-400 capitalize mt-0.5 font-mono">
                  Role: {currentUser.role}
                </div>
              </div>
            </button>

            {/* Offline simulator */}
            <button
              type="button"
              onClick={() => setIsOffline(!isOffline)}
              title="Mô phỏng ngắt kết nối mạng"
              aria-label="Mô phỏng ngắt kết nối mạng"
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                isOffline
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </button>

            {/* Spec button */}
            <button
              type="button"
              onClick={() => setIsSpecModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-[#0f766e] text-xs font-bold flex items-center gap-1 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tokens & Spec</span>
            </button>

            {/* Handover Export Button */}
            <button
              type="button"
              onClick={() => setIsHandoverModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-teal-600 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Archive className="w-3.5 h-3.5 text-teal-200" />
              <span>Bàn Giao v2.1</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-[57px] z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto no-scrollbar gap-1 py-1.5">
          {/* SPRINT 1 PRIMARY TABS */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Sprint 1:
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('CUSTOMERS');
                setFeedbackState('NONE');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-[#0a1e3f] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Khách hàng ({customers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('PROPERTIES');
                setFeedbackState('NONE');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'PROPERTIES'
                  ? 'bg-[#0a1e3f] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Địa điểm ({properties.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('DEVICES');
                setFeedbackState('NONE');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'DEVICES'
                  ? 'bg-[#0a1e3f] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Airplay className="w-3.5 h-3.5" />
              <span>Máy lạnh & QR ({devices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('MEMBERS');
                setFeedbackState('NONE');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'MEMBERS'
                  ? 'bg-[#0a1e3f] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Đội thợ & RBAC</span>
            </button>
          </div>

          {/* SPRINT TIẾP THEO (Gắn nhãn rõ ràng) */}
          <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-slate-200">
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded mr-1">
              Sprint sau:
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('TECHNICIAN_JOBS');
                setFeedbackState('NONE');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'TECHNICIAN_JOBS'
                  ? 'bg-[#0d9488] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Lịch Thợ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('BOOKING_FLOW');
                setFeedbackState('NONE');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'BOOKING_FLOW'
                  ? 'bg-[#0d9488] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Đặt Lịch</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('CUSTOMER_TRACKING');
                setFeedbackState('NONE');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'CUSTOMER_TRACKING'
                  ? 'bg-[#0d9488] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Theo dõi</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMarketplaceModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Marketplace Concept</span>
              <span className="text-[9px] bg-amber-200/80 px-1 rounded font-mono font-bold">FUTURE</span>
            </button>
          </div>
        </div>
      </div>

      {/* State Feedback Selector Toolbar (for QC and Verification) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold">Kiểm tra State Design (Sprint 1):</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFeedbackState(feedbackState === '403_FORBIDDEN' ? 'NONE' : '403_FORBIDDEN')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${
              feedbackState === '403_FORBIDDEN' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-white border-slate-200'
            }`}
          >
            403 No Permission
          </button>
          <button
            type="button"
            onClick={() => setFeedbackState(feedbackState === '409_CONFLICT' ? 'NONE' : '409_CONFLICT')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${
              feedbackState === '409_CONFLICT' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white border-slate-200'
            }`}
          >
            409 Conflict
          </button>
          <button
            type="button"
            onClick={() => setFeedbackState(feedbackState === 'SKELETON_LOADING' ? 'NONE' : 'SKELETON_LOADING')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${
              feedbackState === 'SKELETON_LOADING' ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-white border-slate-200'
            }`}
          >
            Skeleton Loading
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
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
            designVariant={designVariant}
            onChangeDesignVariant={setDesignVariant}
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

        {/* TAB 5: SPRINT TIẾP THEO - TECHNICIAN JOBS */}
        {activeTab === 'TECHNICIAN_JOBS' && (
          <div>
            <div className="mb-3 p-3 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between text-xs text-teal-900">
              <span className="font-bold">Lưu ý nghiệp vụ: Màn hình Vận hành Dịch vụ thuộc Sprint sau (Đã chuẩn hóa DEC-03 & ETA-001)</span>
              <span className="text-[11px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-mono">Future Sprint Scope</span>
            </div>
            <TechnicianDashboard
              jobs={jobs}
              technicianName={currentUser.fullName}
              designVariant={designVariant}
              onChangeDesignVariant={setDesignVariant}
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
          </div>
        )}

        {/* TAB 6: SPRINT TIẾP THEO - BOOKING FLOW */}
        {activeTab === 'BOOKING_FLOW' && (
          <div>
            <div className="mb-3 p-3 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between text-xs text-blue-900">
              <span className="font-bold">Quy tắc DEC-04: Đặt lịch chỉ tạo đơn requested, không tự xác nhận hay gán thợ</span>
              <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">Booking Requested</span>
            </div>
            <BookingWizard
              onJobCreated={handleJobCreated}
              onCancel={() => setActiveTab('CUSTOMER_TRACKING')}
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

      {/* Mobile Ergonomic Bottom Bar */}
      <nav
        aria-label="Thanh điều hướng di động"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-3 flex items-center justify-around md:hidden shadow-lg"
      >
        <button
          type="button"
          onClick={() => setActiveTab('CUSTOMERS')}
          className={`flex flex-col items-center gap-1 py-1 touch-target ${
            activeTab === 'CUSTOMERS' ? 'text-[#0a1e3f] font-black' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Khách hàng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PROPERTIES')}
          className={`flex flex-col items-center gap-1 py-1 touch-target ${
            activeTab === 'PROPERTIES' ? 'text-[#0a1e3f] font-black' : 'text-slate-500'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px]">Địa điểm</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DEVICES')}
          className={`flex flex-col items-center gap-1 py-1 touch-target ${
            activeTab === 'DEVICES' ? 'text-[#0a1e3f] font-black' : 'text-slate-500'
          }`}
        >
          <Airplay className="w-5 h-5" />
          <span className="text-[10px]">Máy lạnh</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex flex-col items-center gap-1 py-1 touch-target ${
            activeTab === 'MEMBERS' ? 'text-[#0a1e3f] font-black' : 'text-slate-500'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px]">Đội thợ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TECHNICIAN_JOBS')}
          className={`flex flex-col items-center gap-1 py-1 touch-target ${
            activeTab === 'TECHNICIAN_JOBS' ? 'text-[#0d9488] font-black' : 'text-slate-500'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px]">Lịch thợ</span>
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

      {/* Switch Organization Tenant Modal */}
      <SwitchOrganizationModal
        isOpen={isSwitchOrgModalOpen}
        onClose={() => setIsSwitchOrgModalOpen(false)}
        organizations={organizations}
        currentOrg={currentOrg}
        onSelectOrg={(org) => setCurrentOrg(org)}
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

      {/* Electronic Invoice & VietQR Payment Modal */}
      <ElectronicInvoiceModal
        job={invoiceJob}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
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
    </div>
  );
}
