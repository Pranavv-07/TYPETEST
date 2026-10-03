import React, { useRef, useState } from 'react';
import { StudentCertificate } from '../../types';
import {
  Award,
  Printer,
  Download,
  X,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatISTDate } from '../../utils/dateUtils';

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
  const [isExporting, setIsExporting] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !certificate) return null;

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#020617'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${(certificate.studentName || 'Learner').replace(/\s+/g, '_')}_TYPETEST_Academy_Certificate.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const formattedDate = formatISTDate(certificate.issuedAt);
  const orgName = certificate.organizationName || certificate.issuingAuthority || 'TYPETEST Touch Typing Academy';
  const primarySigner = certificate.primarySignerName || 'Alex Mercer';
  const primaryTitle = certificate.primarySignerTitle || 'Lead Academy Instructor';
  const secondarySigner = certificate.secondarySignerName || 'TYPETEST Verification Board';
  const secondaryTitle = certificate.secondarySignerTitle || 'Curriculum Director';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-slate-200">
              TYPETEST Touch Typing Academy Credential
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 flex justify-center bg-slate-950/50">
          <div
            ref={certRef}
            id="printable-academy-certificate"
            className="relative w-full max-w-3xl bg-slate-950 border-[6px] border-amber-500/60 rounded-2xl p-8 sm:p-12 text-center text-slate-100 shadow-2xl overflow-hidden print:border-amber-600 print:text-black print:bg-white"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 50% 10%, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0) 70%)'
            }}
          >
            {/* Elegant Double Inner Border */}
            <div className="absolute inset-2 sm:inset-3 border border-amber-500/30 rounded-xl pointer-events-none" />

            {/* Decorative Corner Filigrees */}
            <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-amber-400" />
            <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-amber-400" />
            <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-amber-400" />

            {/* Header / Institutional Branding */}
            <div className="space-y-1.5 pt-2">
              <div className="text-sm sm:text-base font-extrabold tracking-widest text-emerald-400 uppercase font-mono">
                {orgName}
              </div>
              <div className="text-xs sm:text-sm font-semibold tracking-wider text-slate-400 uppercase font-mono">
                Official Typing Proficiency Credential
              </div>
            </div>

            {/* Title */}
            <div className="my-6 space-y-1.5">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 uppercase print:text-amber-700 font-serif">
                Touch Typing Mastery Certificate
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 italic font-serif">
                This official credential certifies that
              </p>
            </div>

            {/* Student Name */}
            <div className="my-4 inline-block px-8 py-2 border-b-2 border-amber-500/40">
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-400 font-serif tracking-wide print:text-emerald-800">
                {certificate.studentName}
              </div>
              {certificate.rollNo && (
                <div className="text-xs sm:text-sm font-mono text-slate-300 mt-1 font-semibold">
                  Identifier: <span className="text-amber-300 font-bold">{certificate.rollNo}</span>
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed my-4">
              has successfully achieved complete touch-typing mastery across progressive curriculum levels, demonstrating exceptional speed, accuracy, and ergonomic tactile key reach discipline.
            </p>

            {/* Benchmark Metrics Display */}
            <div className="grid grid-cols-2 max-w-xs mx-auto gap-4 my-5 bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-xl font-mono text-xs">
              <div className="border-r border-slate-800/80 pr-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Mastery Speed</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{certificate.wpm} WPM</span>
              </div>
              <div className="pl-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Mastery Accuracy</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{certificate.accuracy}%</span>
              </div>
            </div>

            {/* Signatures & Verification Code */}
            <div className="pt-6 mt-4 border-t border-slate-800/80 grid grid-cols-3 items-end text-xs text-slate-400 font-mono">
              <div className="text-left space-y-1">
                <div className="font-serif italic text-slate-200 text-sm">{primarySigner}</div>
                <div className="h-[1px] w-24 bg-slate-700" />
                <div className="text-[11px] text-slate-200 font-bold">{primaryTitle}</div>
                <div className="text-[9px] text-slate-400">{orgName}</div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400/60 bg-amber-500/10 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-bold text-amber-400/90 mt-1 uppercase tracking-wider">
                  Digitally Authenticated
                </span>
                <span className="text-[8px] text-slate-400 font-mono">{certificate.verificationCode}</span>
                <span className="text-[8px] text-slate-400 mt-0.5">{formattedDate}</span>
              </div>

              <div className="text-right space-y-1">
                <div className="font-serif italic text-amber-300 text-sm font-semibold">{secondarySigner}</div>
                <div className="h-[1px] w-28 bg-slate-700 ml-auto" />
                <div className="text-[11px] text-slate-200 font-bold">{secondaryTitle}</div>
                <div className="text-[9px] text-emerald-400 font-semibold">TYPETEST Academic Council</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
