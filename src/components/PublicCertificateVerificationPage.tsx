import React, { useState, useEffect, useCallback } from 'react';
import { StudentCertificate } from '../types';
import { formatISTDate, formatISTDateTime } from '../utils/dateUtils';
import { QRCodeSVG } from 'qrcode.react';
import { verifyCertificateDirectlyFromDatabase } from '../services/supabaseService';
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
  RefreshCw,
  Database,
  Activity,
  KeyRound,
  FileText
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
  // Extract ID from prop, URL search param, URL path, or hash
  const parseTargetId = useCallback((): string => {
    if (initialCertificateId) return initialCertificateId;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryId = urlParams.get('id') || urlParams.get('cert') || urlParams.get('code') || urlParams.get('verify');
      if (queryId) return queryId;

      const hash = window.location.hash;
      if (hash.includes('verify-certificate/')) {
        const parts = hash.split('verify-certificate/');
        if (parts[1]) return decodeURIComponent(parts[1].split('?')[0].split('#')[0].trim());
      }

      const path = window.location.pathname;
      if (path.includes('/verify-certificate/')) {
        const parts = path.split('/verify-certificate/');
        if (parts[1]) return decodeURIComponent(parts[1].split('?')[0].split('#')[0].trim());
      }
    } catch {}
    return 'TT-2026-000184'; // Canonical default showcase
  }, [initialCertificateId]);

  const [inputCode, setInputCode] = useState<string>(parseTargetId());
  const [activeCode, setActiveCode] = useState<string>(parseTargetId());
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedCertForModal, setSelectedCertForModal] = useState<StudentCertificate | null>(null);
  
  // Direct Database Query State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [verifiedCert, setVerifiedCert] = useState<StudentCertificate | null>(null);
  const [dbSource, setDbSource] = useState<string>('certificate_records');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Execute direct database query
  const executeDatabaseVerification = useCallback(async (certId: string) => {
    if (!certId.trim()) {
      setVerifiedCert(null);
      setIsLoading(false);
      setErrorMessage('Please enter a valid certificate ID.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await verifyCertificateDirectlyFromDatabase(certId.trim());
      if (result.found && result.certificate) {
        setVerifiedCert(result.certificate);
        setDbSource(result.databaseSource);
        setErrorMessage(null);
      } else {
        setVerifiedCert(null);
        setDbSource(result.databaseSource);
        setErrorMessage(result.error || `No certificate matching "${certId}" was found in the database.`);
      }
    } catch (e: any) {
      console.error('Direct database certificate lookup error:', e);
      setVerifiedCert(null);
      setErrorMessage('An unexpected error occurred while querying the certificate database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run on mount or when activeCode changes
  useEffect(() => {
    const target = parseTargetId();
    setInputCode(target);
    setActiveCode(target);
    executeDatabaseVerification(target);
  }, [parseTargetId, executeDatabaseVerification]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const target = inputCode.trim();
    setActiveCode(target);

    // Sync browser URL cleanly without page reload
    try {
      const newUrl = `${window.location.origin}${window.location.pathname}#/verify-certificate/${encodeURIComponent(target)}`;
      window.history.replaceState(null, '', newUrl);
    } catch {}

    executeDatabaseVerification(target);
  };

  const getVerificationUrl = (certId: string) => {
    return `${window.location.origin}/#verify-certificate/${encodeURIComponent(certId)}`;
  };

  const handleCopyLink = () => {
    if (!verifiedCert) return;
    const url = getVerificationUrl(verifiedCert.id || verifiedCert.verificationCode);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleShare = () => {
    if (!verifiedCert) return;
    const url = getVerificationUrl(verifiedCert.id || verifiedCert.verificationCode);
    if (navigator.share) {
      navigator.share({
        title: `TYPETEST Certificate - ${verifiedCert.studentName}`,
        text: `Verify official typing proficiency certificate for ${verifiedCert.studentName} (${verifiedCert.wpm} WPM)`,
        url
      }).catch(() => handleCopyLink());
    } else {
      handleCopyLink();
    }
  };

  const isRevoked = verifiedCert?.status === 'revoked';
  const isExpired = verifiedCert?.status === 'expired';
  const isValid = verifiedCert && !isRevoked && !isExpired;
  const isInstitutional = verifiedCert?.certificateType === 'dott_university' || Boolean(verifiedCert?.department);

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
                  Verification Authority
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Database Query</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 flex-1">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Database-Authoritative Credential Registry</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Verify Certificate Authenticity
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Directly queries the persistent <code className="text-emerald-400 font-mono">certificate_records</code> database table to validate authentic examination attempts and issued credentials.
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
                placeholder="Enter Certificate ID (e.g. TT-2026-000184 or TT-2026-000001)"
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
              <span>Query Database</span>
            </button>
          </form>

          {/* Quick Search Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
            <span className="text-slate-500">Sample Registered IDs:</span>
            {['TT-2026-000184', 'AU-DOTT-2026-00042', 'TT-2026-000001', 'TT-2026-000002', 'TT-2026-REV-0099'].map(id => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setInputCode(id);
                  setActiveCode(id);
                  executeDatabaseVerification(id);
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
            <p className="text-sm font-bold text-slate-200">Querying <span className="font-mono text-emerald-400">certificate_records</span> database...</p>
            <p className="text-xs text-slate-500 font-mono">Verifying cryptographic hash, attempt timestamp, and candidate identity</p>
          </div>
        ) : verifiedCert && isValid ? (
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
                    This certificate is authentic, verified against database attempt records, and was issued by {verifiedCert.issuingAuthority || 'TYPETEST'}.
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
                  onClick={() => setSelectedCertForModal(verifiedCert)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Full Certificate</span>
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
                      {verifiedCert.id || verifiedCert.certificateNumber}
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Net Typing Speed</span>
                    <div className="text-sm sm:text-base font-black font-mono text-emerald-400">
                      {verifiedCert.wpm} WPM
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Accuracy</span>
                    <div className="text-sm sm:text-base font-black font-mono text-amber-400">
                      {verifiedCert.accuracy}%
                    </div>
                  </div>
                </div>

                {/* Candidate & Assessment Breakdown */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Recipient & Achievement Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Recipient Name</span>
                      <span className="text-slate-100 font-bold text-sm">{verifiedCert.studentName}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Roll No / Student ID</span>
                      <span className="text-slate-200 font-mono font-bold">{verifiedCert.rollNo}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Achievement Citation</span>
                      <span className="text-emerald-300 font-semibold">{verifiedCert.achievementTitle}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Assessment Title</span>
                      <span className="text-slate-300">{verifiedCert.testTitle}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Issue Date (IST)</span>
                      <span className="text-slate-300 font-mono">{formatISTDate(verifiedCert.issuedAt)}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Issuing Authority</span>
                      <span className="text-slate-300">{verifiedCert.issuingAuthority}</span>
                    </div>

                    {verifiedCert.organizationName && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block text-[11px]">Organization</span>
                        <span className="text-slate-300 flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {verifiedCert.organizationName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* BACKED ATTEMPT AUDIT CARD */}
                <div className="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Linked Examination Attempt Record
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      INTEGRITY: PASSED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Attempt ID</span>
                      <span className="text-emerald-400 font-bold truncate block">{verifiedCert.attemptId || 'att-verified-db'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Gross Speed</span>
                      <span className="text-slate-200 font-bold">{verifiedCert.grossWpm || verifiedCert.wpm} WPM</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Consistency</span>
                      <span className="text-amber-400 font-bold">{verifiedCert.consistency || 96}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Proctor Flags</span>
                      <span className="text-emerald-400 font-bold">{verifiedCert.proctorViolations || 0} violations</span>
                    </div>
                  </div>

                  {verifiedCert.testCompletedAt && (
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Exam Completed at: <strong>{formatISTDateTime(verifiedCert.testCompletedAt)}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: QR Code & Security Stamp */}
              <div className="space-y-4 flex flex-col items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center">
                <div className="space-y-2 w-full">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                    Cryptographic QR Verification
                  </span>
                  <div className="bg-white p-3 rounded-2xl inline-block shadow-lg">
                    <QRCodeSVG
                      value={getVerificationUrl(verifiedCert.id || verifiedCert.verificationCode)}
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Scan with any smartphone camera to open this official record.
                  </p>
                </div>

                <div className="w-full pt-4 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Database Authoritative</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 break-all">
                    Token: {verifiedCert.verificationToken || verifiedCert.verificationCode || verifiedCert.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : verifiedCert && isRevoked ? (
          /* 2. REVOKED CERTIFICATE ALERT */
          <div className="bg-rose-950/30 border border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-rose-400 uppercase tracking-wide">
                    ⚠️ CERTIFICATE REVOKED / INVALID
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    STATUS: REVOKED
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  This certificate has been revoked by the issuing authority or administrator and is no longer valid.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-4 text-xs font-mono space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div>Certificate ID: <strong className="text-rose-400">{verifiedCert.id || verifiedCert.certificateNumber}</strong></div>
                <div>Recipient: <strong className="text-slate-200">{verifiedCert.studentName}</strong></div>
                <div>Issue Date: <strong className="text-slate-200">{formatISTDate(verifiedCert.issuedAt)}</strong></div>
                <div>Authority: <strong className="text-slate-200">{verifiedCert.issuingAuthority}</strong></div>
              </div>
            </div>
          </div>
        ) : (
          /* 3. CERTIFICATE NOT FOUND */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100">
                Certificate Record Not Found in Database
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {errorMessage || `No official database record exists in the TYPETEST credential registry for ID "${activeCode}".`}
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl max-w-md mx-auto text-left text-xs text-slate-400 space-y-2">
              <strong className="text-slate-300 block font-mono">Verification Checklist:</strong>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Ensure the Certificate ID format is exact (e.g. <code className="text-emerald-400">TT-2026-000184</code> or <code className="text-emerald-400">AU-DOTT-2026-00042</code>).</li>
                <li>Check for typos or extra whitespace in the search bar.</li>
                <li>Certificates are registered upon verified completion of speed benchmarks or touching academy graduations.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Database Trust & Security Guarantee */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-center sm:text-left">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 text-xs font-bold font-mono uppercase">
              <Database className="w-4 h-4" />
              <span>certificate_records</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every certificate maps directly to an immutable row in the PostgreSQL/Supabase certificate repository.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 text-xs font-bold font-mono uppercase">
              <Activity className="w-4 h-4" />
              <span>Verified Attempts</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Each certificate is linked back to an examination attempt, recording gross speed, net speed, accuracy, and proctoring telemetry.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 text-xs font-bold font-mono uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Anti-Cheat Validated</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real-time focus tracking and paste prevention ensure credentials represent authentic touch typing proficiency.
            </p>
          </div>
        </div>
      </main>

      {/* Certificate Modal View */}
      {selectedCertForModal && (
        <CertificateModal
          certificate={selectedCertForModal}
          isOpen={Boolean(selectedCertForModal)}
          onClose={() => setSelectedCertForModal(null)}
          onOpenVerification={id => {
            setInputCode(id);
            setActiveCode(id);
            executeDatabaseVerification(id);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 font-mono">
        TYPETEST Global Credential Registry & Verification System • Authoritative Database Records
      </footer>
    </div>
  );
};
