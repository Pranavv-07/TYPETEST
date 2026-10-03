import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudentCertificate } from '../types';
import { formatISTDate } from '../utils/dateUtils';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Award,
  Calendar,
  Zap,
  Target,
  Building,
  UserCheck,
  FileCheck,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { CertificateModal } from './CertificateModal';

interface CertificateVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  onOpenFullPage?: (certId: string) => void;
}

export const CertificateVerificationModal: React.FC<CertificateVerificationModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
  onOpenFullPage
}) => {
  const { certificates } = useApp();
  const [searchCode, setSearchCode] = useState(initialCode || 'TT-2026-000184');
  const [searchedCode, setSearchedCode] = useState(initialCode || 'TT-2026-000184');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFullCertModal, setShowFullCertModal] = useState<StudentCertificate | null>(null);

  useEffect(() => {
    if (initialCode) {
      setSearchCode(initialCode);
      setSearchedCode(initialCode);
    }
  }, [initialCode]);

  const verifiedCert = useMemo(() => {
    if (!searchedCode.trim()) return null;
    const clean = searchedCode.trim().toUpperCase();
    return certificates.find(c =>
      c.id?.toUpperCase() === clean ||
      c.verificationCode?.toUpperCase() === clean ||
      c.certificateNumber?.toUpperCase() === clean
    ) || null;
  }, [certificates, searchedCode]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedCode(searchCode.trim());
  };

  const isRevoked = verifiedCert?.status === 'revoked';
  const isValid = verifiedCert && verifiedCert.status !== 'revoked' && verifiedCert.status !== 'expired';
  const isInstitutional = verifiedCert?.certificateType === 'dott_university' || Boolean(verifiedCert?.department);
  const verificationUrl = verifiedCert
    ? `${window.location.origin}/#verify-certificate/${encodeURIComponent(verifiedCert.id || verifiedCert.verificationCode)}`
    : '';

  const handleCopyLink = () => {
    if (!verificationUrl) return;
    navigator.clipboard.writeText(verificationUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-100">
                Official Credential Verification
              </h2>
              <p className="text-xs text-slate-400">
                Verify authentic TYPETEST & Institutional certificates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Form */}
        <div className="px-5 sm:px-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value)}
                placeholder="Enter Certificate ID (e.g. TT-2026-000184)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 uppercase"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
            >
              Verify
            </button>
          </form>

          {/* Quick chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <span className="text-slate-500">Quick Test:</span>
            {['TT-2026-000184', 'AU-DOTT-2026-00042', 'TT-2026-000001', 'TT-2026-REV-0099'].map(id => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSearchCode(id);
                  setSearchedCode(id);
                }}
                className={`px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                  searchedCode.toUpperCase() === id.toUpperCase()
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {id}
              </button>
            ))}
          </div>

          {/* Verification Results Display */}
          {searchedCode && verifiedCert && isValid ? (
            <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200">
              {/* Authenticity Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                      Officially Verified & Authentic
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {verifiedCert.id || verifiedCert.verificationCode}
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Status: VALID
                </span>
              </div>

              {/* Certificate Details Grid */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Recipient Name:</span>
                  </span>
                  <span className="font-bold text-slate-100 font-serif text-sm">
                    {verifiedCert.studentName}
                  </span>
                </div>

                {verifiedCert.rollNo && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Candidate Roll / ID:</span>
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {verifiedCert.rollNo}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-500" />
                    <span>Achievement:</span>
                  </span>
                  <span className="font-bold text-emerald-300">
                    {verifiedCert.achievementTitle || 'Typing Excellence'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-1 border-b border-slate-900">
                  <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Net Speed:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{verifiedCert.wpm} WPM</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl">
                    <span className="text-slate-400 text-[11px]">Accuracy:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{verifiedCert.accuracy}%</span>
                  </div>
                </div>

                {isInstitutional && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-amber-500" />
                      <span>Institution:</span>
                    </span>
                    <span className="font-bold text-amber-300">
                      {verifiedCert.organizationName || 'Aditya University'}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Issue Date:</span>
                  </span>
                  <span className="font-mono text-slate-300">
                    {formatISTDate(verifiedCert.issuedAt)}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-900">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFullCertModal(verifiedCert)}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    View Full Certificate
                  </button>
                </div>
              </div>
            </div>
          ) : searchedCode && verifiedCert && isRevoked ? (
            <div className="bg-slate-950 border border-rose-500/40 rounded-2xl p-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wide">
                ⚠ Certificate Revoked
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                This certificate was previously issued but is no longer valid or has been revoked.
              </p>
              <div className="text-[11px] font-mono text-slate-500">
                Certificate ID: <span className="text-rose-400 font-bold">{verifiedCert.id || verifiedCert.verificationCode}</span>
              </div>
            </div>
          ) : searchedCode ? (
            <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">
                ✕ Certificate Not Found
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                We could not find a certificate matching <strong className="text-slate-200 font-mono">{searchedCode}</strong>. Please check the certificate ID and try again.
              </p>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 font-mono space-y-1">
              <span>Enter a certificate ID above to verify authentic credentials.</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 text-center font-mono">
          Cryptographically authenticated via TYPETEST Credential Registry
        </div>
      </div>

      {showFullCertModal && (
        <CertificateModal
          certificate={showFullCertModal}
          isOpen={Boolean(showFullCertModal)}
          onClose={() => setShowFullCertModal(null)}
        />
      )}
    </div>
  );
};
