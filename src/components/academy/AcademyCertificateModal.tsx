import React from 'react';
import { StudentCertificate } from '../../types';
import {
  Award,
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

interface AcademyCertificateModalProps {
  certificate: StudentCertificate | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AcademyCertificateModal: React.FC<AcademyCertificateModalProps> = ({
  certificate,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-slate-200">
              Typing Academy Graduation Certificate
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1">
          <div
            id="printable-academy-certificate"
            className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-amber-500/50 rounded-2xl p-8 sm:p-12 text-center text-slate-100 shadow-2xl overflow-hidden print:border-amber-600 print:text-black print:bg-white"
          >
            {/* Decorative Corner Borders */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

            {/* Badge & Authority Header */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-2">
                <GraduationCap className="w-8 h-8" />
              </div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-bold">
                Typing Academy • Institutional Credential
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-slate-100 print:text-black">
                Certificate of Touch Typing Mastery
              </h1>
            </div>

            <p className="text-xs text-slate-400 font-serif italic mb-6">
              This official document certifies that
            </p>

            {/* Student Name */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-4xl font-black text-amber-300 print:text-amber-700 tracking-tight font-sans">
                {certificate.studentName}
              </h2>
              {certificate.rollNo && (
                <span className="text-xs font-mono text-slate-400 block mt-1">
                  Roll / Student ID: {certificate.rollNo}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed mb-6">
              has completed all 7 progressive curriculum levels of the Typing Academy program, satisfying rigorous benchmarks in home-row posture, key reach automaticity, high-cadence sentence flow, and real-world academic and technical typing.
            </p>

            {/* Benchmark Metrics Display */}
            <div className="grid grid-cols-2 max-w-xs mx-auto gap-4 mb-8">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Graduation Speed</span>
                <span className="text-2xl font-black text-cyan-400 font-mono">{certificate.wpm} WPM</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Graduation Accuracy</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{certificate.accuracy}%</span>
              </div>
            </div>

            {/* Signatures & Verification Code */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800 text-xs">
              <div className="text-left space-y-1">
                <span className="text-slate-400 block font-mono text-[11px]">Issued by:</span>
                <span className="font-bold text-slate-200">{certificate.issuingAuthority}</span>
                <span className="text-slate-500 block font-mono text-[10px]">Date: {certificate.issuedAt}</span>
              </div>

              <div className="text-center sm:text-right space-y-1 font-mono">
                <span className="text-slate-400 block text-[11px] flex items-center justify-center sm:justify-end gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Credential
                </span>
                <span className="font-bold text-amber-400 text-sm tracking-wider">
                  {certificate.verificationCode}
                </span>
                <span className="text-slate-500 block text-[10px]">Cert ID: {certificate.certificateNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
