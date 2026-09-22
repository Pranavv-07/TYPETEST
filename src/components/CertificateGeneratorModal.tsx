import React, { useState, useRef } from 'react';
import { X, Download, Award, ShieldCheck, Printer, CheckCircle2, UserCheck, Sparkles, Building, Hash } from 'lucide-react';
import { Student, StudentCertificate } from '../types';
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
  const [customOrg, setCustomOrg] = useState('CSE Department');

  // Certificate Parameters
  const [achievementTitle, setAchievementTitle] = useState('🏆 Personal Record Achievement (Milestone)');
  const [testTitle, setTestTitle] = useState('Technical Touch Typing Benchmark Assessment');
  const [wpm, setWpm] = useState('65');
  const [accuracy, setAccuracy] = useState('98');
  const [issuingAuthority, setIssuingAuthority] = useState('Pavan B (Lead Mentor & Proctor), CSE Dept');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [template, setTemplate] = useState<'modern' | 'classic'>('modern');

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
      pdf.save(`${effectiveName.replace(/\s+/g, '_')}_Official_Certificate.pdf`);

      const certNumber = `TYPETEST-CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const verifyCode = `V-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const newCert: StudentCertificate = {
        id: `cert-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentId: candidateMode === 'enrolled' && selectedStudent ? selectedStudent.id : `candidate-${Date.now()}`,
        studentName: effectiveName,
        rollNo: effectiveRollNo,
        achievementTitle,
        wpm: Number(wpm) || 0,
        accuracy: Number(accuracy) || 0,
        testTitle,
        issuedAt: new Date(issueDate || Date.now()).toISOString(),
        issuingAuthority,
        verificationCode: verifyCode,
        certificateNumber: certNumber,
        status: 'valid'
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
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                Mentor Certificate Generator Module
              </h2>
              <p className="text-xs text-slate-400">
                Generate official verified typing credentials for any candidate or student at anytime.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col">
          {!previewMode ? (
            <div className="space-y-6">
              {/* Step 1: Candidate Selection Mode */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  1. Candidate Recipient
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCandidateMode('enrolled')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      candidateMode === 'enrolled'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Enrolled Student Roster</div>
                      <div className="text-[11px] text-slate-500">Select from active institutional classes</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCandidateMode('custom')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      candidateMode === 'custom'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Any Candidate / External Name</div>
                      <div className="text-[11px] text-slate-500">Issue to any person or external candidate</div>
                    </div>
                  </button>
                </div>

                {candidateMode === 'enrolled' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Select Student from Database
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none text-sm"
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.rollNo})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Candidate Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sen / Jane Doe"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Roll No / Registration ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2025-CSE-099 or EXT-881"
                        value={customRollNo}
                        onChange={e => setCustomRollNo(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Organization / Department
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CSE Dept / Tech Institute"
                        value={customOrg}
                        onChange={e => setCustomOrg(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Assessment & Achievement Details */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  2. Assessment Title & Achievement Category
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Achievement Title / Distinction
                    </label>
                    <input
                      type="text"
                      value={achievementTitle}
                      onChange={e => setAchievementTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        '🏆 Personal Record Achievement (Milestone)',
                        'Master Assessment Certification',
                        'Proficient Assessment Certification',
                        'Typing Academy Level 7 Grand Master'
                      ].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAchievementTitle(preset)}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Assessment / Course Title
                    </label>
                    <input
                      type="text"
                      value={testTitle}
                      onChange={e => setTestTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        'Technical Touch Typing Benchmark Assessment',
                        'Standard Velocity & Accuracy Proctored Exam',
                        'Story: The Silicon Dawn Speed Test',
                        'Professional Programmer Typing Proficiency'
                      ].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTestTitle(preset)}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Verified Performance Metrics & Issuing Authority */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  3. Performance Metrics & Issuance Authority
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Verified Speed (WPM)
                    </label>
                    <input
                      type="number"
                      value={wpm}
                      onChange={e => setWpm(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-cyan-400 font-mono font-bold focus:border-cyan-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Verified Accuracy (%)
                    </label>
                    <input
                      type="number"
                      value={accuracy}
                      onChange={e => setAccuracy(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Visual Style
                    </label>
                    <select
                      value={template}
                      onChange={e => setTemplate(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none text-sm"
                    >
                      <option value="modern">Modern Cyber Dark</option>
                      <option value="classic">Classic Academic Light</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Issuing Authority Name & Designation
                  </label>
                  <input
                    type="text"
                    value={issuingAuthority}
                    onChange={e => setIssuingAuthority(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Preview Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  disabled={!canProceed}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 text-sm transition-all flex items-center gap-2"
                >
                  <span>Preview & Review Certificate</span>
                  <Award className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center space-y-6">
              <div className="w-full overflow-x-auto p-4 bg-slate-950 rounded-2xl flex justify-center border border-slate-800">
                {/* Certificate Render Area for HTML2Canvas & PDF */}
                <div
                  ref={certRef}
                  className={`w-[820px] h-[580px] relative p-12 flex flex-col justify-between items-center text-center rounded-xl shadow-2xl border-4 ${
                    template === 'modern'
                      ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 border-amber-500/50'
                      : 'bg-white text-slate-900 border-amber-600'
                  }`}
                >
                  {/* Decorative Outer Border */}
                  <div
                    className={`absolute inset-4 border-2 border-dashed pointer-events-none ${
                      template === 'modern' ? 'border-amber-400/30' : 'border-amber-600/40'
                    }`}
                  />

                  {/* Header / Seal */}
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <ShieldCheck
                        className={`w-10 h-10 ${
                          template === 'modern' ? 'text-amber-400' : 'text-amber-600'
                        }`}
                      />
                    </div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-400 font-bold">
                      National Touch Typing Academy • Official Credential
                    </div>
                    <h1
                      className={`text-3xl sm:text-4xl font-black font-serif tracking-wide ${
                        template === 'modern' ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      Certificate of Achievement
                    </h1>
                    <p
                      className={`text-xs ${
                        template === 'modern' ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      This institutional credential certifies that
                    </p>
                  </div>

                  {/* Candidate Name */}
                  <div className="relative z-10 py-2">
                    <h2
                      className={`text-4xl font-extrabold font-serif ${
                        template === 'modern' ? 'text-cyan-300' : 'text-slate-950'
                      }`}
                    >
                      {effectiveName}
                    </h2>
                    <div
                      className={`text-xs font-mono mt-1 ${
                        template === 'modern' ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Roll / ID No: <span className="font-bold">{effectiveRollNo}</span>
                    </div>
                  </div>

                  {/* Achievement text */}
                  <div className="relative z-10 max-w-xl mx-auto space-y-2">
                    <p
                      className={`text-xs leading-relaxed ${
                        template === 'modern' ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      has demonstrated exceptional keyboard ergonomics and typing velocity in the proctored evaluation of{' '}
                      <strong>{testTitle}</strong>.
                    </p>
                    <div
                      className={`inline-block px-4 py-1.5 rounded-xl font-bold text-xs ${
                        template === 'modern'
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                          : 'bg-amber-100 border border-amber-300 text-amber-800'
                      }`}
                    >
                      {achievementTitle}
                    </div>
                  </div>

                  {/* Stats Pill */}
                  <div className="relative z-10 flex gap-8 items-center font-mono">
                    <div
                      className={`p-3 rounded-xl border ${
                        template === 'modern'
                          ? 'bg-slate-950/70 border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-[10px] uppercase text-slate-500">Verified Speed</div>
                      <div className="text-2xl font-black text-cyan-400">{wpm} WPM</div>
                    </div>
                    <div
                      className={`p-3 rounded-xl border ${
                        template === 'modern'
                          ? 'bg-slate-950/70 border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-[10px] uppercase text-slate-500">Verified Accuracy</div>
                      <div className="text-2xl font-black text-emerald-400">{accuracy}%</div>
                    </div>
                  </div>

                  {/* Footer: Signatures & Verification Code */}
                  <div className="w-full flex justify-between items-end relative z-10 px-6 font-mono text-xs pt-4 border-t border-slate-800/60">
                    <div className="text-left">
                      <div className="text-[10px] text-slate-500 uppercase">Issuing Authority</div>
                      <div
                        className={`font-bold ${
                          template === 'modern' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {issuingAuthority}
                      </div>
                      <div className="text-[10px] text-slate-500">Date: {issueDate}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase">Verification Code</div>
                      <div className="text-cyan-400 font-bold tracking-wider">V-VERIFIED-AUTH</div>
                      <div className="text-[10px] text-slate-500">Digitally Sealed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs transition-colors"
                >
                  ← Edit Certificate Details
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 text-xs transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    'Generating Certificate...'
                  ) : (
                    <>
                      <Download size={16} />
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
