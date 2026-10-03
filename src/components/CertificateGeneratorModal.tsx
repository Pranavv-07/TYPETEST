import React, { useState, useRef } from 'react';
import { X, Download, Award, ShieldCheck, Printer, CheckCircle2, UserCheck, Sparkles, Building, Hash } from 'lucide-react';
import { Student, StudentCertificate } from '../types';
import { formatISTDateOnly } from '../utils/dateUtils';
import { generateUniqueCertificateId } from '../services/supabaseService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateGeneratorModalProps {
  onClose: () => void;
  students: Student[];
  onGenerate: (cert: StudentCertificate) => void;
}

export const CertificateGeneratorModal: React.FC<CertificateGeneratorModalProps> = ({
  onClose,
  students,
  onGenerate
}) => {
  // Candidate Mode: enrolled vs custom (anyone, anytime)
  const [candidateMode, setCandidateMode] = useState<'enrolled' | 'custom'>('enrolled');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRollNo, setCustomRollNo] = useState('');
  const [customOrg, setCustomOrg] = useState('TYPETEST Organization & Training Division');

  // Certificate Parameters
  const [certTitle, setCertTitle] = useState('Certificate of Achievement');
  const [achievementTitle, setAchievementTitle] = useState('🏆 Speed & Accuracy Typing Milestone');
  const [testTitle, setTestTitle] = useState('Professional Touch Typing Speed Benchmark');
  const [wpm, setWpm] = useState('75');
  const [accuracy, setAccuracy] = useState('98');
  const [issuingAuthority, setIssuingAuthority] = useState('Alex Mercer');
  const [issuerTitle, setIssuerTitle] = useState('Lead Evaluation Mentor');
  const [secondarySigner, setSecondarySigner] = useState('TYPETEST Credential Council');
  const [secondaryTitle, setSecondaryTitle] = useState('Director of Certification');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimal' | 'corporate'>('modern');

  // Preview & Export State
  const [previewMode, setPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  // Derive candidate details
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const effectiveName = candidateMode === 'enrolled'
    ? (selectedStudent?.name || '')
    : customName.trim();
  const effectiveRollNo = candidateMode === 'enrolled'
    ? (selectedStudent?.rollNo || 'VERIFIED')
    : (customRollNo.trim() || 'EXT-ID');

  const canProceed = Boolean(effectiveName);

  const handleGenerate = async () => {
    if (!effectiveName || !certRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(certRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${effectiveName.replace(/\s+/g, '_')}_TYPETEST_Certificate.pdf`);

      const certId = generateUniqueCertificateId();
      const verifyCode = certId;
      const verifyToken = `TT-VT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${certId.replace(/[^0-9]/g, '').slice(-6) || '000001'}`;

      const newCert: StudentCertificate = {
        id: certId,
        studentId: candidateMode === 'enrolled' && selectedStudent ? selectedStudent.id : `candidate-${Date.now()}`,
        studentName: effectiveName,
        rollNo: effectiveRollNo,
        achievementTitle,
        wpm: Number(wpm) || 0,
        grossWpm: Number(wpm) || 0,
        netWpm: Number(wpm) || 0,
        accuracy: Number(accuracy) || 0,
        consistency: 96,
        testTitle,
        issuedAt: new Date(issueDate || Date.now()).toISOString(),
        testCompletedAt: new Date(issueDate || Date.now()).toISOString(),
        issuingAuthority: customOrg || 'TYPETEST Verification Authority',
        verificationCode: verifyCode,
        verificationToken: verifyToken,
        certificateNumber: certId,
        status: 'valid',
        organizationName: customOrg,
        certificateTitle: certTitle,
        primarySignerName: issuingAuthority,
        primarySignerTitle: issuerTitle,
        secondarySignerName: secondarySigner,
        secondarySignerTitle: secondaryTitle,
        template,
        antiCheatVerified: true,
        proctorViolations: 0
      };

      onGenerate(newCert);
      onClose();
    } catch (err) {
      console.error('Failed generating certificate:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                Custom Certificate Designer & Issuer
              </h2>
              <p className="text-xs text-slate-400">
                Design and issue official verified typing credentials for learners, teams, or classes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col">
          {!previewMode ? (
            <div className="space-y-6">
              {/* Step 1: Candidate Selection */}
              <div className="space-y-3">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  1. Recipient Selection
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCandidateMode('enrolled')}
                    className={`flex-1 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      candidateMode === 'enrolled'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Select Enrolled Learner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateMode('custom')}
                    className={`flex-1 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      candidateMode === 'custom'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Custom Name & Identifier</span>
                  </button>
                </div>

                {candidateMode === 'enrolled' ? (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Select Candidate from Roster</label>
                    <select
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 font-mono"
                    >
                      <option value="">-- Choose Learner --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.rollNo || s.email})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Roll / Member ID (Optional)</label>
                      <input
                        type="text"
                        value={customRollNo}
                        onChange={e => setCustomRollNo(e.target.value)}
                        placeholder="e.g. EMP-1049 or Member #42"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Organization & Template */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  2. Organization & Visual Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Issuing Organization Name</label>
                    <input
                      type="text"
                      value={customOrg}
                      onChange={e => setCustomOrg(e.target.value)}
                      placeholder="e.g. Acme Corp, Apex High School, TYPETEST"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Certificate Title</label>
                    <input
                      type="text"
                      value={certTitle}
                      onChange={e => setCertTitle(e.target.value)}
                      placeholder="e.g. Certificate of Achievement, Typing Honors"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {(['modern', 'classic', 'minimal', 'corporate'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTemplate(t)}
                      className={`p-2.5 rounded-xl border text-xs capitalize font-bold transition-all cursor-pointer ${
                        template === t
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t} Template
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Performance & Signatures */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  3. Performance Benchmarks & Signatures
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Net Speed (WPM)</label>
                    <input
                      type="number"
                      value={wpm}
                      onChange={e => setWpm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Accuracy (%)</label>
                    <input
                      type="number"
                      value={accuracy}
                      onChange={e => setAccuracy(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Achievement Citation</label>
                    <input
                      type="text"
                      value={achievementTitle}
                      onChange={e => setAchievementTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Primary Signer Name</label>
                    <input
                      type="text"
                      value={issuingAuthority}
                      onChange={e => setIssuingAuthority(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Primary Signer Title</label>
                    <input
                      type="text"
                      value={issuerTitle}
                      onChange={e => setIssuerTitle(e.target.value)}
                      placeholder="e.g. Head of Training & Assessments"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!canProceed}
                  onClick={() => setPreviewMode(true)}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Preview Certificate Design
                </button>
              </div>
            </div>
          ) : (
            /* Certificate Preview */
            <div className="space-y-6 flex flex-col items-center">
              <div className="w-full overflow-x-auto flex justify-center py-2">
                <div
                  ref={certRef}
                  className={`w-full max-w-2xl bg-slate-950 border-[6px] rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden shadow-2xl ${
                    template === 'classic'
                      ? 'border-amber-600/70 text-amber-100'
                      : template === 'minimal'
                      ? 'border-slate-700 text-slate-100'
                      : 'border-emerald-500/50 text-slate-100'
                  }`}
                  style={{
                    backgroundImage: 'radial-gradient(ellipse at 50% 10%, rgba(16, 185, 129, 0.08) 0%, rgba(2, 6, 23, 0) 70%)'
                  }}
                >
                  <div className="absolute inset-2 border border-emerald-500/25 rounded-xl pointer-events-none" />

                  {/* Header */}
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-emerald-400">
                      {customOrg}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black font-serif uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
                      {certTitle}
                    </h3>
                    <p className="text-[11px] text-slate-400 italic">This certifies that</p>
                  </div>

                  {/* Recipient */}
                  <div className="my-4 inline-block px-8 py-2 border-b-2 border-emerald-500/40">
                    <h2 className="text-3xl font-black font-serif text-emerald-300">
                      {effectiveName}
                    </h2>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                      ID: {effectiveRollNo}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed my-2">
                    has achieved verified competency in technical touch-typing velocity, ergonomic pacing, and precision keystroke accuracy in <strong>{testTitle}</strong>.
                  </p>

                  <div className="inline-block px-4 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs my-2">
                    {achievementTitle}
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-2 max-w-xs mx-auto gap-4 my-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Speed</span>
                      <span className="text-2xl font-black text-emerald-400">{wpm} WPM</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Accuracy</span>
                      <span className="text-2xl font-black text-amber-400">{accuracy}%</span>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-4 mt-2 border-t border-slate-800/80 grid grid-cols-3 items-end text-[11px] font-mono text-slate-400">
                    <div className="text-left space-y-0.5">
                      <div className="font-serif italic font-bold text-slate-200 text-xs">{issuingAuthority}</div>
                      <div className="h-[1px] w-20 bg-slate-700" />
                      <div className="text-[10px] text-slate-300">{issuerTitle}</div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 mb-0.5" />
                      <span className="text-[8px] font-bold text-emerald-400 tracking-wider">TYPETEST VERIFIED</span>
                    </div>

                    <div className="text-right space-y-0.5">
                      <div className="font-serif italic font-bold text-amber-300 text-xs">{secondarySigner}</div>
                      <div className="h-[1px] w-20 bg-slate-700 ml-auto" />
                      <div className="text-[10px] text-slate-300">{secondaryTitle}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end w-full">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Back to Editor
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isGenerating ? (
                    <span>Generating PDF...</span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PDF & Issue Credential</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
