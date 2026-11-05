import React from 'react';

// Self-contained, offline-compatible QR code display with VietQR frame
export const VietQRCode: React.FC<{
  amount: number;
  orderId: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
}> = ({
  amount,
  orderId,
  accountName = 'TRAN VAN HUNG',
  accountNumber = '0938 789 123',
  bankName = 'Vietcombank (VCB)',
}) => {
  return (
    <div className="bg-white p-3 rounded-2xl border-2 border-teal-500/80 shadow-md inline-block max-w-[240px] text-center">
      {/* VietQR Header */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[10px] font-bold">
        <span className="text-blue-900 tracking-wider">VietQR</span>
        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Napas 247</span>
      </div>

      {/* Synthetic Deterministic High-Contrast QR Matrix (SVG) */}
      <svg
        viewBox="0 0 100 100"
        className="w-44 h-44 mx-auto text-slate-900"
        shapeRendering="crispEdges"
      >
        <rect width="100" height="100" fill="#ffffff" />
        {/* Top-left position marker */}
        <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="2" />
        <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="1" />
        <rect x="13" y="13" width="12" height="12" fill="#0f172a" rx="1" />

        {/* Top-right position marker */}
        <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="2" />
        <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="1" />
        <rect x="75" y="13" width="12" height="12" fill="#0f172a" rx="1" />

        {/* Bottom-left position marker */}
        <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="2" />
        <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="1" />
        <rect x="13" y="75" width="12" height="12" fill="#0f172a" rx="1" />

        {/* Alignment pattern */}
        <rect x="70" y="70" width="16" height="16" fill="#0f172a" rx="1" />
        <rect x="74" y="74" width="8" height="8" fill="#ffffff" />
        <rect x="76" y="76" width="4" height="4" fill="#0f172a" />

        {/* Grid data blocks */}
        <rect x="37" y="7" width="4" height="8" fill="#0f172a" />
        <rect x="45" y="5" width="8" height="4" fill="#0f172a" />
        <rect x="57" y="9" width="6" height="6" fill="#0f172a" />
        <rect x="37" y="19" width="6" height="6" fill="#0f172a" />
        <rect x="47" y="15" width="4" height="12" fill="#0f172a" />
        <rect x="55" y="21" width="8" height="4" fill="#0f172a" />

        <rect x="7" y="37" width="12" height="4" fill="#0f172a" />
        <rect x="7" y="47" width="4" height="8" fill="#0f172a" />
        <rect x="15" y="45" width="8" height="8" fill="#0f172a" />
        <rect x="7" y="57" width="10" height="4" fill="#0f172a" />

        {/* Center matrix */}
        <rect x="37" y="37" width="26" height="26" fill="#0d9488" rx="4" />
        {/* Inner snowflake logo in QR center */}
        <circle cx="50" cy="50" r="10" fill="#ffffff" />
        <circle cx="50" cy="50" r="6" fill="#0a1e3f" />

        {/* Bottom-right data dots */}
        <rect x="37" y="67" width="6" height="8" fill="#0f172a" />
        <rect x="47" y="71" width="8" height="6" fill="#0f172a" />
        <rect x="59" y="67" width="6" height="10" fill="#0f172a" />
        <rect x="37" y="79" width="12" height="6" fill="#0f172a" />
        <rect x="53" y="81" width="8" height="8" fill="#0f172a" />
        <rect x="43" y="89" width="14" height="5" fill="#0f172a" />
      </svg>

      {/* Account Info Footer */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-700">
        <div className="font-bold text-slate-900 truncate">{accountName}</div>
        <div className="font-mono text-slate-500 font-medium">{accountNumber} • {bankName}</div>
        <div className="text-[#0d9488] font-bold mt-0.5">Nội dung: ThợOS {orderId}</div>
      </div>
    </div>
  );
};
