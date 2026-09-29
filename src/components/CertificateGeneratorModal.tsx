import React, { useState, useRef } from 'react';
import { X, Download, Award, ShieldCheck, Printer, CheckCircle2, UserCheck, Sparkles, Building, Hash } from 'lucide-react';
import { Student, StudentCertificate } from '../types';
import { formatISTDateOnly } from '../utils/dateUtils';
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
  const [customOrg, setCustomOrg] = useState('CSE Department, Aditya University');

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

      const certNumber = `AU-DOTT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const verifyCode = `AU-V-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                Mentor Certificate Generator Module
              </h2>
              <p className="text-xs text-slate-400">
                Generate official verified typing credentials from testType & DOTT, Aditya University.
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
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
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
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
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
                      Select Enrolled Student
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none text-sm"
                    >
                      <option value="">-- Choose Candidate from Institutional Roster --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.rollNo}) - {s.batch}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Candidate Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pranav Vedula"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Roll / Registration / ID Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 24B11CS355"
                        value={customRollNo}
                        onChange={e => setCustomRollNo(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none text-sm font-mono uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Assessment & Achievement Details */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  2. Credential Title & Assessment Type
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Achievement / Milestone Title
                    </label>
                    <input
                      type="text"
                      value={achievementTitle}
                      onChange={e => setAchievementTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        'Master Touch Typist Benchmark',
                        'Grand Master Speed Certification',
                        'Proctored Assessment Distinction',
                        'Elite Velocity & Precision Mastery'
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
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none text-sm"
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
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none text-sm"
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
                      Issue Date (IST)
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Visual Style
                    </label>
                    <select
                      value={template}
                      onChange={e => setTemplate(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none text-sm"
                    >
                      <option value="modern">Modern Emerald Prestige</option>
                      <option value="classic">Classic Academic White</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Lead Mentor / Examiner Name & Designation
                  </label>
                  <input
                    type="text"
                    value={issuingAuthority}
                    onChange={e => setIssuingAuthority(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Preview Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  disabled={!canProceed}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-500/20 text-sm transition-all flex items-center gap-2"
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
                  className={`w-[840px] h-[590px] relative p-10 flex flex-col justify-between items-center text-center rounded-2xl shadow-2xl border-4 ${
                    template === 'modern'
                      ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 border-emerald-500/60'
                      : 'bg-white text-slate-900 border-emerald-600'
                  }`}
                >
                  {/* Decorative Outer Border */}
                  <div
                    className={`absolute inset-4 border-2 border-dashed pointer-events-none rounded-xl ${
                      template === 'modern' ? 'border-emerald-400/30' : 'border-emerald-600/40'
                    }`}
                  />

                  {/* Header */}
                  <div className="space-y-1.5 relative z-10 w-full">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Award className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black tracking-wider uppercase text-emerald-400">
                          testType & DOTT
                        </div>
                        <div className={`text-[10px] font-semibold tracking-wide ${
                          template === 'modern' ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Department of Technical Training • Aditya University
                        </div>
                      </div>
                    </div>

                    <h1
                      className={`text-2xl sm:text-3xl font-black font-serif tracking-wide pt-2 ${
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
                      This is to certify that
                    </p>
                  </div>

                  {/* Candidate Name */}
                  <div className="relative z-10 py-1">
                    <h2
                      className={`text-3xl sm:text-4xl font-black font-serif tracking-tight ${
                        template === 'modern' ? 'text-emerald-300' : 'text-emerald-800'
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
                      has successfully demonstrated exceptional touch typing velocity, cadence, and accuracy in the evaluation of{' '}
                      <strong>{testTitle}</strong>.
                    </p>
                    <div
                      className={`inline-block px-4 py-1.5 rounded-xl font-bold text-xs ${
                        template === 'modern'
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                          : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                      }`}
                    >
                      {achievementTitle}
                    </div>
                  </div>

                  {/* Performance Metrics Badges */}
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md relative z-10">
                    <div
                      className={`p-3 rounded-xl border text-center ${
                        template === 'modern'
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div
                        className={`text-[10px] uppercase font-mono tracking-wider ${
                          template === 'modern' ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Typing Speed
                      </div>
                      <div className="text-2xl font-black font-mono text-emerald-400">
                        {wpm} <span className="text-xs font-sans text-slate-400 font-normal">WPM</span>
                      </div>
                    </div>
                    <div
                      className={`p-3 rounded-xl border text-center ${
                        template === 'modern'
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div
                        className={`text-[10px] uppercase font-mono tracking-wider ${
                          template === 'modern' ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Accuracy Score
                      </div>
                      <div className="text-2xl font-black font-mono text-emerald-400">
                        {accuracy}%
                      </div>
                    </div>
                  </div>

                  {/* Signatures & Footer */}
                  <div className="w-full flex justify-between items-end pt-4 border-t border-slate-800/80 relative z-10 px-4">
                    <div className="text-left">
                      <div className="font-serif italic font-bold text-sm text-emerald-400">
                        {issuingAuthority}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Mentor & Assessment Lead
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Issued: {formatISTDateOnly(issueDate)} (IST)
                      </div>
                    </div>

                    <div className="text-center px-4">
                      <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="text-[9px] font-mono text-emerald-400/90">
                        AU-DOTT-VERIFIED
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-serif italic font-bold text-sm text-emerald-400">
                        Dr. G Ramu
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Dean Technical Trainings
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium">
                        Aditya University
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end w-full">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Back to Editor
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-colors"
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
