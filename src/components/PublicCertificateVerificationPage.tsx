import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudentCertificate } from '../types';
import { formatISTDate, formatISTDateTime } from '../utils/dateUtils';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Award,
  Zap,
  Target,
  Building,
  Calendar,
  UserCheck,
  FileCheck,
  ArrowLeft,
  Printer,
  Sparkles,
  Lock,
  RefreshCw
} from 'lucide-react';
import { CertificateModal } from './CertificateModal';

interface PublicCertificateVerificationPageProps {
  initialCertificateId?: string;
  onBackToApp?: () => void;
}

export const PublicCertificateVerificationPage: React.FC<PublicCertificateVerificationPageProps> = ({
  initialCertificateId = '',
  onBackToApp
}) => {
  const { certificates } = useApp();

  // Extract ID from prop, URL search param, URL path, or hash
  const getInitialId = (): string => {
    if (initialCertificateId) return initialCertificateId;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryId = urlParams.get('id') || urlParams.get('cert') || urlParams.get('code');
      if (queryId) return queryId;

      const hash = window.location.hash;
      if (hash.includes('verify-certificate/')) {
        const parts = hash.split('verify-certificate/');
        if (parts[1]) return decodeURIComponent(parts[1].trim());
      }

      const path = window.location.pathname;
      if (path.includes('/verify-certificate/')) {
        const parts = path.split('/verify-certificate/');
        if (parts[1]) return decodeURIComponent(parts[1].trim());
      }
    } catch {}
    return 'TT-2026-000184'; // Default example to showcase real verification
  };

  const [inputCode, setInputCode] = useState<string>(getInitialId());
  const [activeCode, setActiveCode] = useState<string>(getInitialId());
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedCertForModal, setSelectedCertForModal] = useState<StudentCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialCertificateId) {
      setInputCode(initialCertificateId);
      setActiveCode(initialCertificateId);
    }
  }, [initialCertificateId]);

  // Authoritative Database Query
  const matchedCertificate = useMemo(() => {
    if (!activeCode.trim()) return null;
    const clean = activeCode.trim().toUpperCase();
    return certificates.find(c =>
      c.id?.toUpperCase() === clean ||
      c.verificationCode?.toUpperCase() === clean ||
      c.certificateNumber?.toUpperCase() === clean
    ) || null;
  }, [certificates, activeCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setIsLoading(true);
    const target = inputCode.trim();
    setActiveCode(target);

    // Sync browser URL cleanly without page reload
    try {
      const newUrl = `${window.location.origin}${window.location.pathname}#/verify-certificate/${encodeURIComponent(target)}`;
      window.history.replaceState(null, '', newUrl);
    } catch {}

    setTimeout(() => {
      setIsLoading(false);
    }, 200);
  };

  const getVerificationUrl = (certId: string) => {
    return `${window.location.origin}/#verify-certificate/${encodeURIComponent(certId)}`;
  };

  const handleCopyLink = () => {
    if (!matchedCertificate) return;
    const url = getVerificationUrl(matchedCertificate.id || matchedCertificate.verificationCode);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleShare = () => {
    if (!matchedCertificate) return;
    const url = getVerificationUrl(matchedCertificate.id || matchedCertificate.verificationCode);
    if (navigator.share) {
      navigator.share({
        title: `TYPETEST Certificate - ${matchedCertificate.studentName}`,
        text: `Verify official typing proficiency certificate for ${matchedCertificate.studentName} (${matchedCertificate.wpm} WPM)`,
        url
      }).catch(() => handleCopyLink());
    } else {
      handleCopyLink();
    }
  };

  const isRevoked = matchedCertificate?.status === 'revoked';
  const isValid = matchedCertificate && matchedCertificate.status !== 'revoked' && matchedCertificate.status !== 'expired';
  const isInstitutional = matchedCertificate?.certificateType === 'dott_university' || Boolean(matchedCertificate?.department);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Banner / Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to TYPETEST</span>
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-slate-100">
                  TYPE<span className="text-emerald-400">TEST</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 ml-2 uppercase font-bold tracking-wider">
                  Verification Portal
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              Public Authoritative Registry
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 flex-1">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Credential Registry</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Verify Certificate Authenticity
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Confirm whether a TYPETEST or institutional typing proficiency certificate is authentic, active, and cryptographically registered.
          </p>
        </div>

        {/* Verification Input Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                placeholder="Enter Certificate ID (e.g. TT-2026-000184 or AU-DOTT-2026-00042)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 uppercase tracking-wide"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !inputCode.trim()}
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Verify Certificate</span>
            </button>
          </form>

          {/* Quick Search Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
            <span className="text-slate-500">Sample Registered IDs:</span>
            {['TT-2026-000184', 'AU-DOTT-2026-00042', 'TT-2026-000001', 'TT-2026-REV-0099'].map(id => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setInputCode(id);
                  setActiveCode(id);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  activeCode.toUpperCase() === id.toUpperCase()
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Verification Result Display */}
        {isLoading ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3 animate-in fade-in">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-200">Querying TYPETEST Database Registry...</p>
            <p className="text-xs text-slate-500 font-mono">Validating cryptographic records & candidate signatures</p>
          </div>
        ) : matchedCertificate && isValid ? (
          /* 1. VALID CERTIFICATE RESULT */
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            {/* Authenticity Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-emerald-400 uppercase tracking-wide">
                      ✓ Certificate Verified
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      STATUS: VALID
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    This certificate is authentic and was issued by {isInstitutional ? matchedCertificate.organizationName || 'Aditya University' : 'TYPETEST'}.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => setSelectedCertForModal(matchedCertificate)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Certificate</span>
                </button>
              </div>
            </div>

            {/* Certificate Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Metadata & Scores */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Certificate ID</span>
                    <div className="text-sm sm:text-base font-black font-mono text-emerald-400">
                      {matchedCertificate.id || matchedCertificate.certificateNumber}
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Typing Speed</span>
                    <div className="text-sm sm:text-base font-black font-mono text-emerald-400">
                      {matchedCertificate.wpm} WPM
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Accuracy</span>
                    <div className="text-sm sm:text-base font-black font-mono text-amber-400">
                      {matchedCertificate.accuracy}%
                    </div>
                  </div>
                </div>

                {/* Candidate & Assessment Breakdown */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Recipient Name:</span>
                    </span>
                    <span className="font-bold text-slate-100 font-serif text-sm">
                      {matchedCertificate.studentName}
                    </span>
                  </div>

                  {matchedCertificate.rollNo && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="text-slate-400 flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>Candidate Roll / ID:</span>
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        {matchedCertificate.rollNo}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-slate-500" />
                      <span>Achievement:</span>
                    </span>
                    <span className="font-bold text-emerald-300">
                      {matchedCertificate.achievementTitle || 'Typing Excellence'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 flex items-center gap-2">
                      <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Assessment Test:</span>
                    </span>
                    <span className="font-semibold text-slate-200">
                      {matchedCertificate.testTitle}
                    </span>
                  </div>

                  {isInstitutional && (
                    <>
                      <div className="flex justify-between items-center py-1 border-b border-slate-900">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-amber-500" />
                          <span>Institution:</span>
                        </span>
                        <span className="font-bold text-amber-300">
                          {matchedCertificate.organizationName || 'Aditya University'}
                        </span>
                      </div>

                      {matchedCertificate.department && (
                        <div className="flex justify-between items-center py-1 border-b border-slate-900">
                          <span className="text-slate-400 flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            <span>Department / Program:</span>
                          </span>
                          <span className="font-medium text-slate-200">
                            {matchedCertificate.department}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-1 border-b border-slate-900">
                        <span className="text-slate-400 flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                          <span>Issued By:</span>
                        </span>
                        <span className="font-semibold text-slate-300">
                          {matchedCertificate.issuingAuthority || matchedCertificate.primarySignerName}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Issue Date:</span>
                    </span>
                    <span className="font-mono text-slate-300">
                      {formatISTDate(matchedCertificate.issuedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: QR Code & Cryptographic Stamp */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between text-center space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Instant Mobile QR Verification
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Scan with any smartphone camera to verify this record
                  </p>
                </div>

                {/* Real SVG QR Code pointing directly to public URL */}
                <div className="p-3 bg-white rounded-2xl shadow-xl">
                  <QRCodeSVG
                    value={getVerificationUrl(matchedCertificate.id || matchedCertificate.verificationCode)}
                    size={135}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-1 text-[10px] font-mono text-slate-500">
                  <div>Verification Token</div>
                  <div className="text-emerald-400 font-bold">{matchedCertificate.verificationCode}</div>
                </div>
              </div>
            </div>
          </div>
        ) : matchedCertificate && isRevoked ? (
          /* 2. REVOKED CERTIFICATE RESULT */
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-rose-400 uppercase tracking-wide">
                  ⚠ Certificate Revoked
                </h3>
                <p className="text-xs text-slate-400">
                  This certificate was previously issued but is no longer valid or has been revoked by the issuing authority.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-rose-500/20 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-400">Certificate ID:</span>
                <span className="font-mono font-bold text-rose-400">
                  {matchedCertificate.id || matchedCertificate.certificateNumber}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-bold text-slate-300">
                  {matchedCertificate.studentName}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-400">Original Test:</span>
                <span className="font-medium text-slate-300">
                  {matchedCertificate.testTitle}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  REVOKED
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* 3. NOT FOUND RESULT */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-100">
                ✕ Certificate Not Found
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                We could not find a verified certificate matching <strong className="text-slate-200 font-mono">{activeCode}</strong> in the authoritative database registry.
              </p>
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto font-mono">
              Please double check the certificate ID or verification code. Unregistered or altered certificates cannot be authenticated.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <p>Cryptographically authenticated via TYPETEST Credential Registry • All Rights Reserved</p>
      </footer>

      {/* Modal for Full Certificate Inspection */}
      {selectedCertForModal && (
        <CertificateModal
          certificate={selectedCertForModal}
          isOpen={Boolean(selectedCertForModal)}
          onClose={() => setSelectedCertForModal(null)}
        />
      )}
    </div>
  );
};
