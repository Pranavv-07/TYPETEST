import React, { useState, useEffect, useCallback } from 'react';
import { StudentCertificate } from '../types';
import { formatISTDate } from '../utils/dateUtils';
import { QRCodeSVG } from 'qrcode.react';
import { verifyCertificateDirectlyFromDatabase } from '../services/supabaseService';
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
  ExternalLink,
  RefreshCw,
  Database
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
  const [searchCode, setSearchCode] = useState(initialCode || 'TT-2026-000184');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFullCertModal, setShowFullCertModal] = useState<StudentCertificate | null>(null);
  
  // Direct Database Query State
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedCert, setVerifiedCert] = useState<StudentCertificate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performLookup = useCallback(async (code: string) => {
    if (!code.trim()) {
      setVerifiedCert(null);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await verifyCertificateDirectlyFromDatabase(code.trim());
      if (result.found && result.certificate) {
        setVerifiedCert(result.certificate);
        setErrorMessage(null);
      } else {
        setVerifiedCert(null);
        setErrorMessage(result.error || `No certificate record found for "${code}".`);
      }
    } catch (e: any) {
      setVerifiedCert(null);
      setErrorMessage('Failed to query certificate database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const target = initialCode || searchCode || 'TT-2026-000184';
      setSearchCode(target);
      performLookup(target);
    }
  }, [isOpen, initialCode, performLookup]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(searchCode.trim());
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
              <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                Official Credential Verification
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400 inline" />
                Persistent database-backed verification registry
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
              disabled={isLoading}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Verify</span>
            </button>
          </form>

          {/* Quick chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <span className="text-slate-500">Quick Test:</span>
            {['TT-2026-000184', 'AU-DOTT-2026-00042', 'TT-2026-000001', 'TT-2026-000002', 'TT-2026-REV-0099'].map(id => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSearchCode(id);
                  performLookup(id);
                }}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  searchCode.toUpperCase() === id.toUpperCase()
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body / Verification Results */}
        <div className="px-5 sm:px-6 pb-6 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-mono">Querying database records...</p>
            </div>
          ) : verifiedCert && isValid ? (
            /* 1. VALID VERIFIED RESULT */
            <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wide block">
                      Authentic Certificate Verified
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ID: <strong className="font-mono text-slate-200">{verifiedCert.id || verifiedCert.certificateNumber}</strong>
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  VALID
                </span>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Recipient</span>
                  <span className="text-slate-100 font-bold block">{verifiedCert.studentName}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">Roll: {verifiedCert.rollNo}</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Speed & Accuracy</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-black font-mono text-emerald-400">{verifiedCert.wpm} WPM</span>
                    <span className="text-xs font-bold font-mono text-amber-400">{verifiedCert.accuracy}% Acc</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 col-span-2 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Assessment Title</span>
                  <span className="text-slate-200 font-semibold text-xs block">{verifiedCert.testTitle}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Issued by: {verifiedCert.issuingAuthority}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    title="Copy Verification Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {onOpenFullPage && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenFullPage(verifiedCert.id || verifiedCert.verificationCode);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Full Verification Page</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowFullCertModal(verifiedCert)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Certificate</span>
                </button>
              </div>
            </div>
          ) : verifiedCert && isRevoked ? (
            /* 2. REVOKED ALERT */
            <div className="bg-rose-950/30 border border-rose-500/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-400 uppercase">
                    Certificate Revoked / Inactive
                  </h3>
                  <p className="text-xs text-slate-400">
                    This certificate ID was officially revoked and is no longer valid.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-rose-500/20 text-xs font-mono space-y-1 text-slate-300">
                <div>ID: <strong className="text-rose-400">{verifiedCert.id || verifiedCert.certificateNumber}</strong></div>
                <div>Candidate: <strong>{verifiedCert.studentName}</strong></div>
              </div>
            </div>
          ) : (
            /* 3. NOT FOUND */
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-200">
                Certificate Record Not Found in Database
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {errorMessage || `No official database record exists in the TYPETEST credential registry for ID "${searchCode}".`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Full Certificate View Modal */}
      {showFullCertModal && (
        <CertificateModal
          certificate={showFullCertModal}
          isOpen={Boolean(showFullCertModal)}
          onClose={() => setShowFullCertModal(null)}
          onOpenVerification={certId => {
            setShowFullCertModal(null);
            if (onOpenFullPage) {
              onClose();
              onOpenFullPage(certId);
            }
          }}
        />
      )}
    </div>
  );
};
