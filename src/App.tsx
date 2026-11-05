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
} from 'lucide-react';
import { Job, JobStatus } from './lib/types';
import { INITIAL_JOBS } from './lib/mock-data';
import { getNextStatus, STATUS_MAP } from './lib/status-machine';
import { JobDetailModal } from './components/technician/JobDetailModal';
import { ElectronicInvoiceModal } from './components/technician/ElectronicInvoiceModal';
import { TechnicianDashboard } from './components/technician/TechnicianDashboard';
import { BookingWizard } from './components/customer/BookingWizard';
import { CustomerTrackingView } from './components/customer/CustomerTrackingView';
import { SprintSpecModal } from './components/spec/SprintSpecModal';
import { EmptyState } from './components/ui/EmptyState';
import { Button } from './components/ui/Button';

export default function App() {
  // Load jobs from localStorage or fallback to INITIAL_JOBS
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem('tho_os_jobs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Ignore
    }
    return INITIAL_JOBS;
  });

  // Active Role Mode: 'TECHNICIAN' or 'CUSTOMER'
  const [currentRole, setCurrentRole] = useState<'TECHNICIAN' | 'CUSTOMER'>('TECHNICIAN');

  // Modals state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [invoiceJob, setInvoiceJob] = useState<Job | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);

  // Customer sub-tab: 'BOOKING' | 'TRACKING'
  const [customerTab, setCustomerTab] = useState<'BOOKING' | 'TRACKING'>('BOOKING');
  const [currentCustomerJobId, setCurrentCustomerJobId] = useState<string>('JOB-2026-081');

  // Offline mode simulation
  const [isOffline, setIsOffline] = useState(false);

  // Save to localStorage whenever jobs change
  useEffect(() => {
    try {
      localStorage.setItem('tho_os_jobs', JSON.stringify(jobs));
    } catch (e) {
      // Ignore
    }
  }, [jobs]);

  // Update a job in state
  const handleUpdateJob = (updatedJob: Job) => {
    setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    if (selectedJob && selectedJob.id === updatedJob.id) {
      setSelectedJob(updatedJob);
    }
  };

  // Quick action from JobCard (advancing state to next step)
  const handleQuickAction = (job: Job) => {
    const next = getNextStatus(job.status);
    if (next) {
      const updated: Job = {
        ...job,
        status: next,
        completedAt: next === 'HOAN_THANH' ? new Date().toISOString() : job.completedAt,
      };
      handleUpdateJob(updated);
      if (next === 'HOAN_THANH') {
        setInvoiceJob(updated);
        setIsInvoiceModalOpen(true);
      }
    }
  };

  // Confirm payment in invoice modal
  const handleConfirmPayment = (jobId: string, method: 'TIEN_MAT' | 'CHUYEN_KHOAN_QR') => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'HOAN_THANH', paymentMethod: method } : j))
    );
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob((prev) =>
        prev ? { ...prev, status: 'HOAN_THANH', paymentMethod: method } : null
      );
    }
  };

  // Handle new job created by customer
  const handleJobCreated = (newJob: Job) => {
    setJobs([newJob, ...jobs]);
    setCurrentCustomerJobId(newJob.id);
    setCustomerTab('TRACKING');
  };

  const trackedJob = jobs.find((j) => j.id === currentCustomerJobId) || jobs[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 md:pb-10 font-sans selection:bg-[#0d9488]/20 selection:text-[#0d9488]">
      {/* Offline Status Simulation Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm animate-fadeIn">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            Chế độ ngoại tuyến: Dữ liệu đang được lưu cục bộ trên máy và sẽ tự động đồng bộ khi có mạng!
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0a1e3f] text-[#14b8a6] flex items-center justify-center shadow-sm">
              <Snowflake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-[#0a1e3f] tracking-tight">ThợOS</span>
                <span className="text-[10px] font-extrabold bg-[#0d9488]/10 text-[#0d9488] px-1.5 py-0.5 rounded-md uppercase">
                  Mobile v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Hệ điều hành thực dụng cho thợ điện lạnh & khách đặt lịch
              </p>
            </div>
          </div>

          {/* Role Switcher (Technician vs Customer) */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentRole('TECHNICIAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentRole === 'TECHNICIAN'
                    ? 'bg-[#0a1e3f] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Giao diện Thợ
              </button>
              <button
                type="button"
                onClick={() => setCurrentRole('CUSTOMER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentRole === 'CUSTOMER'
                    ? 'bg-[#0d9488] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Khách đặt lịch
              </button>
            </div>

            {/* Offline Simulator & Sprint Spec Document Buttons */}
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

            <button
              type="button"
              onClick={() => setIsSpecModalOpen(true)}
              aria-label="Xem Specs Design Tokens"
              title="Xem Design Tokens & Wireframe Sprint 1"
              className="px-2.5 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-[#0f766e] text-xs font-bold flex items-center gap-1 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tokens & Wireframe</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5">
        {/* ======================================================== */}
        {/* TECHNICIAN VIEW (Primary Mobile-First Interface for Thợ)  */}
        {/* ======================================================== */}
        {currentRole === 'TECHNICIAN' && (
          <TechnicianDashboard
            jobs={jobs}
            technicianName="Trần Văn Hùng"
            onOpenDetails={(j) => {
              setSelectedJob(j);
              setIsDetailModalOpen(true);
            }}
            onQuickAction={handleQuickAction}
            onOpenInvoice={(j) => {
              setInvoiceJob(j);
              setIsInvoiceModalOpen(true);
            }}
            onCreateJobRequest={() => {
              setCurrentRole('CUSTOMER');
              setCustomerTab('BOOKING');
            }}
          />
        )}

        {/* ======================================================== */}
        {/* CUSTOMER VIEW (Booking & Tracking Aircon Repair)         */}
        {/* ======================================================== */}
        {currentRole === 'CUSTOMER' && (
          <div className="space-y-5">
            {/* Customer Sub-Nav: Booking vs Tracking */}
            <div className="flex justify-center mb-4">
              <div className="bg-slate-200/80 p-1 rounded-2xl flex max-w-sm w-full">
                <button
                  type="button"
                  onClick={() => setCustomerTab('BOOKING')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    customerTab === 'BOOKING'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đặt Thợ Sửa Chữa
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerTab('TRACKING')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    customerTab === 'TRACKING'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo Dõi Lịch Hẹn ({jobs.length})
                </button>
              </div>
            </div>

            {customerTab === 'BOOKING' && (
              <BookingWizard
                onJobCreated={handleJobCreated}
                onCancel={() => setCustomerTab('TRACKING')}
              />
            )}

            {customerTab === 'TRACKING' && (
              <div className="space-y-4">
                {/* Job Selector for Customer */}
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
                  onBookAnother={() => setCustomerTab('BOOKING')}
                  onViewInvoice={(j) => {
                    setInvoiceJob(j);
                    setIsInvoiceModalOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Ergonomic Bottom Bar */}
      <nav
        aria-label="Thanh điều hướng di động"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-6 flex items-center justify-around md:hidden shadow-lg"
      >
        <button
          type="button"
          onClick={() => {
            setCurrentRole('TECHNICIAN');
          }}
          className={`flex flex-col items-center gap-1 py-1 touch-target ${
            currentRole === 'TECHNICIAN' ? 'text-[#0d9488]' : 'text-slate-500'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] font-bold">Lịch Thợ</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentRole('CUSTOMER');
            setCustomerTab('BOOKING');
          }}
          className={`flex flex-col items-center gap-1 py-1 touch-target ${
            currentRole === 'CUSTOMER' && customerTab === 'BOOKING'
              ? 'text-[#0d9488]'
              : 'text-slate-500'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-bold">Đặt Lịch</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentRole('CUSTOMER');
            setCustomerTab('TRACKING');
          }}
          className={`flex flex-col items-center gap-1 py-1 touch-target ${
            currentRole === 'CUSTOMER' && customerTab === 'TRACKING'
              ? 'text-[#0d9488]'
              : 'text-slate-500'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-bold">Đơn Của Tôi</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSpecModalOpen(true)}
          className="flex flex-col items-center gap-1 py-1 touch-target text-slate-500 hover:text-slate-800"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold">Tokens & Spec</span>
        </button>
      </nav>

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
    </div>
  );
}
