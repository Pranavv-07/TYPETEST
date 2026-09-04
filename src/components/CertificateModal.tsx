import React from 'react';
import { StudentCertificate } from '../types';
import { X, Download, Printer, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CertificateModalProps {
  certificate: StudentCertificate | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  isOpen,
  onClose
}) => {
  if (!isOpen || !certificate) return null;

  const handlePrintOrDownload = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top bar controls */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-slate-200">Official Achievement Certificate</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintOrDownload}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Styled for both screen and print) */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1">
          <div
            id="printable-certificate"
            className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-amber-500/40 rounded-2xl p-8 sm:p-12 text-center text-slate-100 shadow-2xl overflow-hidden print:border-amber-600 print:text-black print:bg-white"
          >
            {/* Decorative Corner Borders */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

            {/* Sub-header */}
            <div className="space-y-1">
              <div className="text-[11px] font-mono tracking-[0.25em] text-amber-400 font-bold uppercase">
                {certificate.issuingAuthority}
              </div>
              <div className="text-xs text-slate-400 font-mono tracking-widest uppercase">
                Institutional Speed Assessment Platform
              </div>
            </div>

            {/* Title */}
            <div className="my-6 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 uppercase print:text-amber-600">
                Certificate of Achievement
              </h1>
              <p className="text-xs text-slate-400 italic">
                This official credential certifies that
              </p>
            </div>

            {/* Student Name */}
            <div className="py-2 border-b border-amber-500/30 inline-block px-8 max-w-md mx-auto">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-serif tracking-wide print:text-black">
                {certificate.studentName}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Roll No: <span className="text-slate-200 font-semibold">{certificate.rollNo}</span>
              </div>
            </div>

            {/* Milestone Description */}
            <div className="my-6 max-w-xl mx-auto space-y-3">
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                has successfully established a new institutional benchmark in keyboard ergonomics and speed proficiency, demonstrating extraordinary velocity and accuracy in typing assessment examinations.
              </p>
              <div className="inline-block bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-300 font-bold text-sm tracking-wide">
                {certificate.achievementTitle}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 max-w-xs mx-auto gap-4 my-6 bg-slate-950/60 border border-slate-800 p-4 rounded-xl font-mono text-xs">
              <div>
                <div className="text-slate-500 text-[10px]">VERIFIED SPEED</div>
                <div className="text-2xl font-black text-cyan-400">{certificate.wpm} WPM</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">VERIFIED ACCURACY</div>
                <div className="text-2xl font-black text-emerald-400">{certificate.accuracy}%</div>
              </div>
            </div>

            {/* Signature & Verification Seal Strip */}
            <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400 font-mono">
              <div className="text-left space-y-0.5">
                <div className="text-[10px] text-slate-500 uppercase">Issue Date</div>
                <div className="text-slate-200 font-bold">{certificate.issuedAt}</div>
                <div className="text-[10px] text-slate-600">Issued by {certificate.issuingAuthority}</div>
              </div>

              {/* Verified Badge */}
              <div className="flex flex-col items-center justify-center p-3 rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-400">
                <ShieldCheck className="w-7 h-7" />
                <span className="text-[9px] font-bold mt-0.5 tracking-wider uppercase">Verified</span>
              </div>

              <div className="text-right space-y-0.5">
                <div className="text-[10px] text-slate-500 uppercase">Verification Code</div>
                <div className="text-cyan-400 font-bold tracking-wider">{certificate.verificationCode}</div>
                <div className="text-[10px] text-slate-600">Digitally Authenticated</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
