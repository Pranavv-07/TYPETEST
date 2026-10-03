import React, { useRef, useState } from 'react';
import { StudentCertificate } from '../types';
import {
  X,
  Download,
  Printer,
  Award,
  ShieldCheck,
  CheckCircle2,
  Layout,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Building
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatISTDate } from '../utils/dateUtils';
import { QRCodeSVG } from 'qrcode.react';

interface CertificateModalProps {
  certificate: StudentCertificate | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenVerification?: (certId: string) => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  isOpen,
  onClose,
  onOpenVerification
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimal' | 'corporate'>(
    (certificate?.template as any) || 'modern'
  );
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !certificate) return null;

  const certId = certificate.id || certificate.certificateNumber || certificate.verificationCode;
  const verificationUrl = `${window.location.origin}/#verify-certificate/${encodeURIComponent(certId)}`;

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: template === 'minimal' ? '#0f172a' : '#020617'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${(certificate.studentName || 'Recipient').replace(/\s+/g, '_')}_TYPETEST_Certificate.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyVerificationLink = () => {
    navigator.clipboard.writeText(verificationUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const formattedDate = formatISTDate(certificate.issuedAt);
  const orgName = certificate.organizationName || certificate.issuingAuthority || 'TYPETEST Global Verification Authority';
  const certTitle = certificate.certificateTitle || 'Certificate of Achievement';
  const primarySigner = certificate.primarySignerName || 'Alex Mercer';
  const primaryTitle = certificate.primarySignerTitle || 'Director of Evaluations';
  const secondarySigner = certificate.secondarySignerName || 'TYPETEST Registry';
  const secondaryTitle = certificate.secondarySignerTitle || 'Authenticated Credential Officer';
  const isInstitutional = certificate.certificateType === 'dott_university' || Boolean(certificate.department);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top bar controls */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-slate-200">
              {isInstitutional ? 'Institutional Credential' : 'Official TYPETEST Credential'}
            </span>
          </div>

          {/* Template Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 px-2 text-[10px] uppercase font-bold hidden sm:inline">Theme:</span>
            {(['modern', 'classic', 'minimal', 'corporate'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-colors cursor-pointer ${
                  template === t ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Verify Certificate Button */}
            <button
              onClick={() => {
                if (onOpenVerification) {
                  onOpenVerification(certId);
                } else {
                  window.open(verificationUrl, '_blank');
                }
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify Online</span>
            </button>

            <button
              onClick={handleCopyVerificationLink}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy Public Verification Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating...' : 'PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Rendering Area */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 flex justify-center bg-slate-950/60">
          <div
            ref={certRef}
            id="printable-certificate"
            className={`relative w-full max-w-3xl text-center text-slate-100 shadow-2xl overflow-hidden p-6 sm:p-12 transition-all ${
              template === 'minimal'
                ? 'bg-slate-900 border-2 border-slate-700 rounded-xl'
                : template === 'classic'
                ? 'bg-slate-950 border-[8px] border-amber-600/70 rounded-2xl'
                : template === 'corporate'
                ? 'bg-slate-950 border-4 border-slate-700 rounded-2xl'
                : 'bg-slate-950 border-[6px] border-amber-500/60 rounded-2xl'
            }`}
            style={{
              backgroundImage:
                template === 'classic'
                  ? 'radial-gradient(ellipse at 50% 15%, rgba(245, 158, 11, 0.08) 0%, rgba(2, 6, 23, 0) 75%)'
                  : 'radial-gradient(ellipse at 50% 10%, rgba(16, 185, 129, 0.08) 0%, rgba(2, 6, 23, 0) 70%)'
            }}
          >
            {/* Elegant Inner Frame */}
            <div className="absolute inset-2 sm:inset-3 border border-amber-500/25 rounded-xl pointer-events-none" />

            {/* Corner Accents */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-400/80" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-400/80" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-400/80" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-400/80" />

            {/* Header / Brand */}
            <div className="space-y-1 pt-1">
              <div className="text-xs sm:text-sm font-extrabold tracking-widest text-emerald-400 uppercase font-mono">
                {orgName}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                {isInstitutional && certificate.department
                  ? certificate.department
                  : 'Official Typing Proficiency Credential'}
              </div>
            </div>

            {/* Certificate Title */}
            <div className="my-4 sm:my-5 space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 uppercase font-serif">
                {certTitle}
              </h1>
              <p className="text-xs text-slate-400 italic font-serif">
                This certifies that
              </p>
            </div>

            {/* Candidate Name */}
            <div className="my-2 sm:my-3 inline-block px-8 py-2 border-b-2 border-amber-500/40">
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-400 font-serif tracking-wide">
                {certificate.studentName}
              </div>
              {certificate.rollNo && (
                <div className="text-xs font-mono text-slate-400 mt-1">
                  Candidate ID: <span className="text-amber-300 font-bold">{certificate.rollNo}</span>
                </div>
              )}
            </div>

            {/* Citation */}
            <div className="my-3 sm:my-4 max-w-xl mx-auto space-y-2">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                has successfully established verified proficiency in touch-typing velocity, ergonomic rhythm, and precision accuracy in:
              </p>
              <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 rounded-xl text-emerald-300 font-bold text-xs sm:text-sm tracking-wide">
                {certificate.achievementTitle || certificate.testTitle}
              </div>
            </div>

            {/* Scorecard Strip */}
            <div className="grid grid-cols-2 max-w-xs mx-auto gap-4 my-4 sm:my-5 bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-xl font-mono text-xs">
              <div className="border-r border-slate-800/80 pr-2">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Verified Net Speed</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">{certificate.wpm} WPM</div>
              </div>
              <div className="pl-2">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Verified Accuracy</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">{certificate.accuracy}%</div>
              </div>
            </div>

            {/* Signatures & Verified QR Seal */}
            <div className="pt-6 mt-4 border-t border-slate-800/80 grid grid-cols-3 items-end text-xs text-slate-400 font-mono">
              {/* Primary Signature */}
              <div className="text-left space-y-1">
                <div className="font-serif italic text-slate-200 text-sm">{primarySigner}</div>
                <div className="h-[1px] w-24 bg-slate-700" />
                <div className="text-[11px] text-slate-200 font-bold">{primaryTitle}</div>
                <div className="text-[9px] text-slate-400">{orgName}</div>
              </div>

              {/* Verified Digital Seal with Real QR Code */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="p-1.5 bg-white rounded-lg shadow-md">
                  <QRCodeSVG
                    value={verificationUrl}
                    size={48}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider">
                  Scan to Verify
                </span>
                <span className="text-[8px] text-slate-400 font-mono">{certId}</span>
              </div>

              {/* Secondary Signature */}
              <div className="text-right space-y-1">
                <div className="font-serif italic text-amber-300 text-sm font-semibold">{secondarySigner}</div>
                <div className="h-[1px] w-28 bg-slate-700 ml-auto" />
                <div className="text-[11px] text-slate-200 font-bold">{secondaryTitle}</div>
                <div className="text-[9px] text-emerald-400 font-semibold">TYPETEST Evaluation Board</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
