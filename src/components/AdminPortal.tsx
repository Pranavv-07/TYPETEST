import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Student, Trainer, TypingTest } from '../types';
import {
  Shield,
  Users,
  UserPlus,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  FileText,
  Sparkles,
  GraduationCap,
  Trash2,
  Edit2,
  KeyRound,
  X,
  Lock,
  RotateCcw,
  Check,
  Award,
  Layers
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const {
    students,
    trainers,
    classes,
    submissions,
    tests,
    addTrainer,
    updateTrainer,
    deleteTrainer,
    addStudent,
    updateStudent,
    deleteStudent,
    bulkAddStudents,
    deleteTest,
    resetStudentAttempt,
    resetAllData
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'trainers' | 'tests' | 'import'>('overview');

  // Search & Filter for student directory
  const [studentSearch, setStudentSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  // Add single student modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newRollNo, setNewRollNo] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentBatch, setNewStudentBatch] = useState('2024-28');
  const [newStudentClass, setNewStudentClass] = useState('class-1');
  const [newStudentPassword, setNewStudentPassword] = useState('');

  // Edit student modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentRollNo, setEditStudentRollNo] = useState('');
  const [editStudentBatch, setEditStudentBatch] = useState('');
  const [editStudentClass, setEditStudentClass] = useState('');
  const [editStudentPassword, setEditStudentPassword] = useState('');

  // Add trainer modal
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [newTrainerUsername, setNewTrainerUsername] = useState('');
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newTrainerEmail, setNewTrainerEmail] = useState('');
  const [newTrainerPassword, setNewTrainerPassword] = useState('');

  // Edit trainer modal
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [editTrainerName, setEditTrainerName] = useState('');
  const [editTrainerUsername, setEditTrainerUsername] = useState('');
  const [editTrainerEmail, setEditTrainerEmail] = useState('');
  const [editTrainerPassword, setEditTrainerPassword] = useState('');

  // Bulk Upload State
  const [pasteData, setPasteData] = useState('');
  const [parsedPreview, setParsedPreview] = useState<{ rollNo: string; name: string }[]>([]);
  const [bulkClassId, setBulkClassId] = useState('class-1');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Student Actions
  const handleOpenEditStudent = (s: Student) => {
    setEditingStudent(s);
    setEditStudentName(s.name);
    setEditStudentRollNo(s.rollNo);
    setEditStudentBatch(s.batch || '2024-28');
    setEditStudentClass(s.classId || 'class-1');
    setEditStudentPassword(s.password || '');
  };

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateStudent(editingStudent.id, {
      name: editStudentName.trim(),
      rollNo: editStudentRollNo.trim().toUpperCase(),
      batch: editStudentBatch.trim(),
      classId: editStudentClass,
      password: editStudentPassword.trim() || undefined
    });

    setEditingStudent(null);
  };

  const handleDeleteStudent = (s: Student) => {
    if (confirm(`Are you sure you want to permanently delete student "${s.name}" (${s.rollNo}) and all associated records?`)) {
      deleteStudent(s.id);
    }
  };

  // Trainer Actions
  const handleOpenEditTrainer = (t: Trainer) => {
    setEditingTrainer(t);
    setEditTrainerName(t.name);
    setEditTrainerUsername(t.username);
    setEditTrainerEmail(t.email);
    setEditTrainerPassword(t.password || '');
  };

  const handleSaveTrainerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer) return;

    updateTrainer(editingTrainer.id, {
      name: editTrainerName.trim(),
      username: editTrainerUsername.trim(),
      email: editTrainerEmail.trim(),
      password: editTrainerPassword.trim() || undefined
    });

    setEditingTrainer(null);
  };

  const handleDeleteTrainer = (t: Trainer) => {
    if (confirm(`Are you sure you want to delete trainer "${t.name}"?`)) {
      deleteTrainer(t.id);
    }
  };

  // Parse bulk text
  const handleParseText = (text: string) => {
    setPasteData(text);
    const lines = text.split('\n');
    const records: { rollNo: string; name: string }[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let parts = trimmed.includes('|')
        ? trimmed.split('|').map(s => s.trim())
        : trimmed.includes('\t')
        ? trimmed.split('\t').map(s => s.trim())
        : trimmed.includes(',')
        ? trimmed.split(',').map(s => s.trim())
        : trimmed.split(/\s+/);

      if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
        parts = parts.slice(1);
      }

      if (parts.length >= 2) {
        const potentialRoll = parts[0];
        const potentialName = parts.slice(1).join(' ').trim();

        if (potentialRoll.length >= 5) {
          records.push({
            rollNo: potentialRoll.toUpperCase(),
            name: potentialName || 'Student ' + potentialRoll
          });
        }
      }
    });

    setParsedPreview(records);
  };

  const handleBulkImportConfirm = () => {
    if (parsedPreview.length === 0) return;

    const count = bulkAddStudents(
      parsedPreview.map(p => ({
        rollNo: p.rollNo,
        name: p.name,
        batch: '2024-28',
        classId: bulkClassId
      }))
    );

    setBulkSuccessMsg(`Successfully imported and enrolled ${count} students into ${classes.find(c => c.id === bulkClassId)?.name}!`);
    setPasteData('');
    setParsedPreview([]);
    setTimeout(() => setBulkSuccessMsg(''), 5000);
  };

  const handleCreateSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRollNo.trim() || !newStudentName.trim()) return;

    addStudent({
      rollNo: newRollNo.trim().toUpperCase(),
      name: newStudentName.trim(),
      batch: newStudentBatch.trim(),
      classId: newStudentClass,
      password: newStudentPassword.trim() || undefined
    });

    setNewRollNo('');
    setNewStudentName('');
    setNewStudentPassword('');
    setShowAddStudentModal(false);
  };

  const handleCreateTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainerUsername.trim() || !newTrainerName.trim()) return;

    addTrainer({
      username: newTrainerUsername.trim(),
      name: newTrainerName.trim(),
      email: newTrainerEmail.trim(),
      assignedClasses: ['class-1'],
      password: newTrainerPassword.trim() || undefined
    });

    setNewTrainerUsername('');
    setNewTrainerName('');
    setNewTrainerEmail('');
    setNewTrainerPassword('');
    setShowAddTrainerModal(false);
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = filterClass === 'all' || s.classId === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
              Department Admin
            </span>
            <span className="text-xs text-slate-400 font-mono">CSE System Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">Institutional Admin Portal</h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Full administrative authority over student accounts, trainer roles, classroom rosters, and assessment records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs border border-slate-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setShowAddTrainerModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>Add Trainer</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>System Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'students'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Students Directory ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trainers')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'trainers'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Trainers & Proctors ({trainers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'tests'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Assessments & Records</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'import'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Bulk Ingestion</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-mono text-slate-400">TOTAL CANDIDATES</div>
              <div className="text-3xl font-black font-mono text-slate-100 mt-1">{students.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Enrolled student accounts</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-mono text-slate-400">PROCTORS & TRAINERS</div>
              <div className="text-3xl font-black font-mono text-cyan-400 mt-1">{trainers.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Authorized supervisors</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-mono text-slate-400">CLASS COHORTS</div>
              <div className="text-3xl font-black font-mono text-indigo-400 mt-1">{classes.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Active batch rooms</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-mono text-slate-400">SUBMISSION AUDITS</div>
              <div className="text-3xl font-black font-mono text-emerald-400 mt-1">{submissions.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Logged proctored tests</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Administrative Governance
            </h3>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              As System Administrator, you have full governance rights. You can edit any candidate's legal name, roll number, class assignment, or password, remove obsolete records, manage trainer assignments, and audit examination submissions across the entire CSE department.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Search students by roll no or name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="all">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-cyan-400" />
              <span>Add Single Student</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[580px]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
                  <tr>
                    <th className="py-3 px-4">Index</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Enrolled Class</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredStudents.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{s.rollNo}</td>
                      <td className="py-3 px-4 font-bold text-slate-100">{s.name}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {classes.find(c => c.id === s.classId)?.name || 'General Batch'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{s.batch || '2024-28'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditStudent(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                            title="Edit student details & password"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete student account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRAINERS */}
      {activeTab === 'trainers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <h2 className="text-sm font-bold text-slate-100">Trainer & Proctor Accounts</h2>
            <button
              onClick={() => setShowAddTrainerModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors text-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Trainer</span>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {trainers.map(t => (
              <div
                key={t.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono">
                      TR
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{t.name}</h3>
                      <div className="text-xs font-mono text-slate-400">@{t.username}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditTrainer(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                      title="Edit trainer details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrainer(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete trainer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <div>Email: <strong className="text-slate-300">{t.email}</strong></div>
                  <div>Assigned: <strong className="text-slate-300">{t.assignedClasses.length} Cohorts</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ASSESSMENTS & RECORDS */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              All Department Assessments
            </h3>

            <div className="grid gap-3 md:grid-cols-2">
              {tests.map(t => (
                <div
                  key={t.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{t.title}</span>
                      {t.isCustomAssignment && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {t.timeLimit}s • Min {t.minAccuracy}% • {t.category}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Delete test "${t.title}"?`)) {
                        deleteTest(t.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete test"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">All Candidate Submissions Log</h3>
              <span className="text-xs font-mono text-slate-400">{submissions.length} Total Records</span>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Roll No</th>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Test Title</th>
                    <th className="py-2.5 px-4 text-right">Net WPM</th>
                    <th className="py-2.5 px-4 text-right">Accuracy</th>
                    <th className="py-2.5 px-4 text-right">Time</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-cyan-400">{sub.rollNo}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-200">{sub.studentName}</td>
                      <td className="py-2.5 px-4 text-slate-300">{sub.testTitle}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-100">{sub.netWpm}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">{sub.accuracy}%</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">{sub.timestamp}</td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Reset attempt for ${sub.studentName}?`)) {
                              resetStudentAttempt(sub.testId, sub.studentId);
                            }
                          }}
                          className="px-2 py-0.5 rounded text-[10px] text-amber-300 hover:bg-amber-500/10 transition-colors"
                        >
                          Reset Attempt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BULK INGESTION */}
      {activeTab === 'import' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              Upload Student Roster via Excel, CSV or PDF Text
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Copy and paste tabular student records directly from your spreadsheets or PDF reports. Our intelligent parser automatically extracts roll numbers and student names.
            </p>
          </div>

          {bulkSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{bulkSuccessMsg}</span>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Class Assignment:
                </label>
                <select
                  value={bulkClassId}
                  onChange={e => setBulkClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/60"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Paste Data (Piped, Tab-delimited, Comma-delimited, or Excel Rows):
                </label>
                <textarea
                  rows={8}
                  value={pasteData}
                  onChange={e => handleParseText(e.target.value)}
                  placeholder="Example:&#10;1 | 24P31A42S4 | DANDEM SURYA VENKATA PHANISRI&#10;2 | 24P31A05B3 | Sri nithya Nimishakawi&#10;3 | 24B11AI213 | KURAMDASU GANESWARI"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                Sample format: <code className="text-cyan-300">RollNo [delimiter] Student Name</code>.
              </div>
            </div>

            {/* Live parsed preview */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
                  <span>PARSED PREVIEW</span>
                  <span className="font-bold text-cyan-400">{parsedPreview.length} Candidates</span>
                </div>

                <div className="max-h-60 overflow-y-auto mt-2 divide-y divide-slate-800/60">
                  {parsedPreview.length > 0 ? (
                    parsedPreview.map((item, i) => (
                      <div key={i} className="py-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{item.name}</span>
                        <span className="font-mono text-cyan-400">{item.rollNo}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-600 text-xs font-mono">
                      Paste student text on the left to see parsed preview.
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleBulkImportConfirm}
                disabled={parsedPreview.length === 0}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Ingest {parsedPreview.length} Students</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Edit Student Record</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  value={editStudentRollNo}
                  onChange={e => setEditStudentRollNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={editStudentName}
                  onChange={e => setEditStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Class Cohort</label>
                <select
                  value={editStudentClass}
                  onChange={e => setEditStudentClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Batch</label>
                <input
                  type="text"
                  value={editStudentBatch}
                  onChange={e => setEditStudentBatch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Custom Password <span className="text-slate-500 font-normal">(Leave blank to keep default)</span>
                </label>
                <input
                  type="text"
                  value={editStudentPassword}
                  onChange={e => setEditStudentPassword(e.target.value)}
                  placeholder="Set custom password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TRAINER MODAL */}
      {editingTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Edit Trainer Record</h3>
              <button
                onClick={() => setEditingTrainer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTrainerEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={editTrainerUsername}
                  onChange={e => setEditTrainerUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editTrainerName}
                  onChange={e => setEditTrainerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editTrainerEmail}
                  onChange={e => setEditTrainerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Custom Password <span className="text-slate-500 font-normal">(Leave blank to keep default)</span>
                </label>
                <input
                  type="text"
                  value={editTrainerPassword}
                  onChange={e => setEditTrainerPassword(e.target.value)}
                  placeholder="Set custom password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrainer(null)}
                  className="px-4 py-2 rounded-xl font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SINGLE STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Enroll Single Student</h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingleStudent} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  value={newRollNo}
                  onChange={e => setNewRollNo(e.target.value)}
                  placeholder="e.g. 24P31A42Z9"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  placeholder="Full legal or exam name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Class Cohort</label>
                <select
                  value={newStudentClass}
                  onChange={e => setNewStudentClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Custom Password <span className="text-slate-500 font-normal">(Defaults to 1234)</span>
                </label>
                <input
                  type="text"
                  value={newStudentPassword}
                  onChange={e => setNewStudentPassword(e.target.value)}
                  placeholder="Optional custom password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TRAINER MODAL */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Create Proctor / Trainer Account</h3>
              <button
                onClick={() => setShowAddTrainerModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrainer} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newTrainerUsername}
                  onChange={e => setNewTrainerUsername(e.target.value)}
                  placeholder="e.g. mentor_david"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newTrainerName}
                  onChange={e => setNewTrainerName(e.target.value)}
                  placeholder="Prof. David Miller"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newTrainerEmail}
                  onChange={e => setNewTrainerEmail(e.target.value)}
                  placeholder="david@testtype.edu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Custom Password <span className="text-slate-500 font-normal">(Defaults to trainer@123)</span>
                </label>
                <input
                  type="text"
                  value={newTrainerPassword}
                  onChange={e => setNewTrainerPassword(e.target.value)}
                  placeholder="Optional custom password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Create Proctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
