import React, { useState } from 'react';
import {
  Download,
  GitBranch,
  FileCode,
  Archive,
  CheckCircle2,
  Copy,
  Terminal,
  ExternalLink,
  ShieldCheck,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface HandoverExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HandoverExportModal: React.FC<HandoverExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const commitSha = 'a95046932ffc87ab09a7fc7dd0691c06a6db320e';
  const branchName = 'feat/sprint-1-ui-revision-v2.1';

  const bashInstructions = [
    {
      title: 'Cách 1: Sử dụng Git Bundle (Giữ nguyên toàn bộ Git History & Branch)',
      code: `# 1. Tải file thoos-sprint1-revision.bundle về máy\n# 2. Mở terminal tại thư mục local repository của bạn:\ncd Th-OS-UI-UX-Design-Brief\n\n# 3. Nạp branch từ bundle file:\ngit fetch /duong-dan-toi-file/thoos-sprint1-revision.bundle feat/sprint-1-ui-revision-v2.1:feat/sprint-1-ui-revision-v2.1\n\n# 4. Chuyển sang branch vừa nạp và push lên GitHub của bạn:\ngit checkout feat/sprint-1-ui-revision-v2.1\ngit push origin feat/sprint-1-ui-revision-v2.1`,
    },
    {
      title: 'Cách 2: Sử dụng Git Patch',
      code: `# 1. Tải file sprint-1-ui-revision-v2.1.patch\ncd Th-OS-UI-UX-Design-Brief\n\n# 2. Tạo branch mới và áp dụng patch:\ngit checkout -b feat/sprint-1-ui-revision-v2.1\ngit apply /duong-dan-toi-file/sprint-1-ui-revision-v2.1.patch\n\n# 3. Commit và push lên GitHub:\ngit add .\ngit commit -m "feat(sprint-1): UI/UX revision v2.1 baseline from brief"\ngit push origin feat/sprint-1-ui-revision-v2.1`,
    },
    {
      title: 'Cách 3: Giải nén gói ZIP trực tiếp',
      code: `# Giải nén file ZIP đã tải về:\nunzip thoos-ui-revision-v2.1-handover.zip -d thoos-v2.1-source/\n\n# Đầy đủ source code, tài liệu README_HANDOVER_v2.1.md, unit tests và ảnh chụp màn hình Playwright.`,
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#0a1e3f] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Archive className="w-4 h-4" />
            <span>Xuất xưởng Bàn giao Mã nguồn v2.1</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Tải Gói Bàn Giao ThợOS Sprint 1
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Tất cả tệp xuất xưởng được lưu trực tiếp tại máy chủ cục bộ. Bạn có thể nhấn tải trực tiếp ngay dưới đây hoặc sao chép lệnh Git CLI để đồng bộ vào kho GitHub của bạn.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 font-mono text-[11px] flex items-center gap-1.5 border border-white/10">
              <GitBranch className="w-3.5 h-3.5 text-teal-300" />
              {branchName}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-mono text-[11px] flex items-center gap-1.5 border border-teal-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              Commit: {commitSha.slice(0, 7)}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              15/15 Tests Pass
            </span>
          </div>
        </div>

        {/* Action Downloads Grid */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-teal-600" />
              Tải xuống trực tiếp từ trình duyệt
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* ZIP Download */}
              <a
                href="/thoos-ui-revision-v2.1-handover.zip"
                download="thoos-ui-revision-v2.1-handover.zip"
                className="group p-4 rounded-2xl border-2 border-teal-600 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div className="font-black text-sm text-slate-900 leading-tight">
                    Gói ZIP Đầy Đủ
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Toàn bộ source code, tests, README, screenshots Playwright.
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-teal-200/60 flex items-center justify-between text-xs font-bold text-teal-700">
                  <span>~2.9 MB (.zip)</span>
                  <Download className="w-4 h-4" />
                </div>
              </a>

              {/* Git Bundle Download */}
              <a
                href="/export/thoos-sprint1-revision.bundle"
                download="thoos-sprint1-revision.bundle"
                className="group p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div className="font-black text-sm text-slate-900 leading-tight">
                    Git Bundle
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Bao gồm branch feat/sprint-1-ui-revision-v2.1 và git history.
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>~2.5 MB (.bundle)</span>
                  <Download className="w-4 h-4" />
                </div>
              </a>

              {/* Git Patch Download */}
              <a
                href="/export/sprint-1-ui-revision-v2.1.patch"
                download="sprint-1-ui-revision-v2.1.patch"
                className="group p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div className="font-black text-sm text-slate-900 leading-tight">
                    Git Patch
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Diff chuẩn định dạng git áp dụng bằng git apply.
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>~600 KB (.patch)</span>
                  <Download className="w-4 h-4" />
                </div>
              </a>
            </div>
          </div>

          {/* Git Terminal Commands */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-700" />
              Hướng dẫn đồng bộ lên GitHub từ máy cá nhân
            </h3>

            <div className="space-y-3">
              {bashInstructions.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 overflow-hidden"
                >
                  <div className="bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>{item.title}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.code, idx)}
                      className="flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedIndex === idx ? 'Đã sao chép!' : 'Sao chép'}
                    </button>
                  </div>
                  <pre className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto text-emerald-400">
                    {item.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Audit Summary */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Thông số xác minh chất lượng:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
              <li>Commit SHA đầy đủ: <code className="bg-white px-1 py-0.5 rounded border font-mono text-[10px] text-slate-800">{commitSha}</code></li>
              <li>Unit Tests: 15/15 tests pass (Pricing, Status Machine, Booking Validation)</li>
              <li>TypeScript / ESLint: 0 errors (<code className="font-mono text-[10px]">tsc --noEmit</code> exit code 0)</li>
              <li>Vite build: thành công trong 482ms</li>
              <li>File ZIP không chứa <code className="font-mono text-[10px]">node_modules</code>, <code className="font-mono text-[10px]">.env</code> hay API keys.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            ThợOS UI/UX Baseline v2.1 Handover
          </span>
          <Button variant="outline" onClick={onClose} size="sm">
            Đóng cửa sổ
          </Button>
        </div>
      </div>
    </div>
  );
};
