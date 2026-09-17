import React, { useState, useRef } from 'react';
import { X, Download, Award, ShieldCheck } from 'lucide-react';
import { Student, StudentCertificate } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateGeneratorModalProps {
  onClose: () => void;
  students: Student[];
  onGenerate: (cert: StudentCertificate) => void;
}

export const CertificateGeneratorModal: React.FC<CertificateGeneratorModalProps> = ({ onClose, students, onGenerate }) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [wpm, setWpm] = useState('60');
  const [accuracy, setAccuracy] = useState('95');
  const [testTitle, setTestTitle] = useState('Advanced Typing Assessment');
  const [template, setTemplate] = useState<'modern' | 'classic'>('modern');
  const [previewMode, setPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const student = students.find(s => s.id === selectedStudent);

  const handleGenerate = async () => {
    if (!student || !certRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(certRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${student.name.replace(/\s+/g, '_')}_Certificate.pdf`);

      const certNumber = `TYPETEST-CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const verifyCode = `V-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const newCert: StudentCertificate = {
        id: `cert-manual-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        rollNo: student.rollNo,
        achievementTitle: Number(wpm) >= 60 ? 'Master Assessment Certification' : Number(wpm) >= 40 ? 'Proficient Assessment Certification' : 'Standard Assessment Certification',
        wpm: Number(wpm),
        accuracy: Number(accuracy),
        testTitle,
        issuedAt: new Date().toISOString(),
        issuingAuthority: 'Department of Computer Science & Engineering',
        verificationCode: verifyCode,
        certificateNumber: certNumber,
        status: 'valid'
      };

      onGenerate(newCert);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Award className="text-indigo-400" />
            Generate Custom Certificate
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-6">
          {!previewMode ? (
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Select Student</label>
                <select
                  value={selectedStudent}
                  onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">WPM</label>
                  <input
                    type="number"
                    value={wpm}
                    onChange={e => setWpm(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Accuracy (%)</label>
                  <input
                    type="number"
                    value={accuracy}
                    onChange={e => setAccuracy(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Assessment Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Template</label>
                <select
                  value={template}
                  onChange={e => setTemplate(e.target.value as any)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="modern">Modern Dark</option>
                  <option value="classic">Classic Light</option>
                </select>
              </div>
              
              <button
                onClick={() => setPreviewMode(true)}
                disabled={!selectedStudent}
                className="w-full mt-4 p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium transition-colors"
              >
                Preview Certificate
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full overflow-x-auto p-4 bg-slate-800 rounded-2xl flex justify-center border border-slate-700">
                {/* Certificate Render Area */}
                <div 
                  ref={certRef}
                  className={`w-[800px] h-[565px] relative p-12 flex flex-col justify-center items-center text-center ${
                    template === 'modern' ? 'bg-slate-900 text-slate-100 border-4 border-indigo-900/50' : 'bg-white text-slate-900 border-4 border-slate-200'
                  }`}
                  style={{
                    backgroundImage: template === 'classic' ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' : 'none'
                  }}
                >
                  {/* Decorative Elements */}
                  <div className="absolute top-8 left-8 right-8 bottom-8 border-2 border-dashed border-indigo-500/30"></div>
                  
                  <ShieldCheck size={64} className={`mb-6 ${template === 'modern' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  
                  <h1 className={`text-4xl font-serif font-bold mb-2 ${template === 'modern' ? 'text-slate-100' : 'text-slate-800'}`}>
                    Certificate of Achievement
                  </h1>
                  <p className={`text-lg mb-8 ${template === 'modern' ? 'text-slate-400' : 'text-slate-600'}`}>
                    This is to certify that
                  </p>
                  
                  <h2 className={`text-5xl font-bold mb-4 ${template === 'modern' ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    {student?.name}
                  </h2>
                  <p className={`text-md mb-8 ${template === 'modern' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Roll No: {student?.rollNo}
                  </p>
                  
                  <p className={`text-xl max-w-2xl mb-8 leading-relaxed ${template === 'modern' ? 'text-slate-300' : 'text-slate-700'}`}>
                    has successfully completed the <strong>{testTitle}</strong> with an exceptional performance of <strong>{wpm} WPM</strong> and an accuracy of <strong>{accuracy}%</strong>.
                  </p>
                  
                  <div className="flex w-full justify-between items-end mt-auto px-12 relative z-10">
                    <div className="flex flex-col items-center">
                      <div className={`w-48 h-px mb-2 ${template === 'modern' ? 'bg-slate-600' : 'bg-slate-400'}`}></div>
                      <p className={`text-sm ${template === 'modern' ? 'text-slate-400' : 'text-slate-600'}`}>Issuing Authority</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className={`font-mono text-sm mb-1 ${template === 'modern' ? 'text-indigo-400' : 'text-indigo-600'}`}>V-PREVIEW</p>
                      <p className={`text-xs ${template === 'modern' ? 'text-slate-500' : 'text-slate-400'}`}>{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6 w-full justify-center">
                <button
                  onClick={() => setPreviewMode(false)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  {isGenerating ? 'Generating...' : <><Download size={18} /> Generate PDF & Issue</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
