import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Student, Trainer, TypingTest, Department, Batch, ClassRoom } from '../types';
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
  GraduationCap,
  Trash2,
  Edit2,
  RotateCcw,
  Award,
  Layers,
  Building2,
  Calendar,
  School,
  ShieldAlert,
  History,
  Download,
  Plus,
  Database,
  Activity,
  Check,
  X,
  Lock,
  Flame,
  Clock
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const {
    departments,
    batches,
    classes,
    students,
    trainers,
    tests,
    submissions,
    certificates,
    violations,
    auditLogs,
    isDatabaseConnected,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createBatch,
    updateBatch,
    deleteBatch,
    createClass,
    updateClass,
    deleteClass,
    addTrainer,
    updateTrainer,
    deleteTrainer,
    addStudent,
    updateStudent,
    deleteStudent,
    bulkAddStudents,
    deleteTest,
    resetStudentAttempt,
    downloadReportCSV,
    generateTestReport,
    refreshData
  } = useApp();

  type AdminTab =
    | 'overview'
    | 'departments'
    | 'batches'
    | 'classes'
    | 'students'
    | 'trainers'
    | 'tests'
    | 'attempts'
    | 'violations'
    | 'results'
    | 'audit'
    | 'import';

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Search & Filter state
  const [studentSearch, setStudentSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [violationSearch, setViolationSearch] = useState('');

  // Department Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // Batch Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchYear, setBatchYear] = useState('2024-2028');
  const [batchStartYear, setBatchStartYear] = useState(2024);
  const [batchEndYear, setBatchEndYear] = useState(2028);

  // Class Modal State
  const [showClassModal, setShowClassModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [classDeptId, setClassDeptId] = useState('');
  const [classBatchId, setClassBatchId] = useState('');

  // Add single student modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newRollNo, setNewRollNo] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentBatch, setNewStudentBatch] = useState('2024-28');
  const [newStudentClass, setNewStudentClass] = useState(classes[0]?.id || 'class-1');
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

  // Reset Attempt Modal
  const [resetModalData, setResetModalData] = useState<{ testId: string; studentId: string; studentName: string; testTitle: string } | null>(null);
  const [resetReason, setResetReason] = useState('Authorized re-examination due to technical interruption');

  // Bulk Upload State
  const [pasteData, setPasteData] = useState('');
  const [parsedPreview, setParsedPreview] = useState<{ rollNo: string; name: string }[]>([]);
  const [bulkClassId, setBulkClassId] = useState(classes[0]?.id || 'class-1');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse Bulk Input
  const handleParsePaste = (text: string) => {
    setPasteData(text);
    if (!text.trim()) {
      setParsedPreview([]);
      return;
    }

    const lines = text.trim().split('\n');
    const parsed: { rollNo: string; name: string }[] = [];

    lines.forEach(line => {
      const parts = line.split(/[,\t|]/).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        if (parts[0].toLowerCase().includes('roll') || parts[1].toLowerCase().includes('name')) {
          return;
        }
        parsed.push({
          rollNo: parts[0].toUpperCase(),
          name: parts[1]
        });
      }
    });

    setParsedPreview(parsed);
  };

  const handleBulkUpload = async () => {
    if (parsedPreview.length === 0) return;
    setIsSubmitting(true);
    try {
      const selectedClass = classes.find(c => c.id === bulkClassId);
      const studentObjects = parsedPreview.map(p => ({
        rollNo: p.rollNo,
        name: p.name,
        batch: selectedClass?.batchId || '2024-28',
        classId: bulkClassId
      }));

      const count = await bulkAddStudents(studentObjects);
      setBulkSuccessMsg(`Successfully imported ${count} students into ${selectedClass?.name || 'class roster'}.`);
      setPasteData('');
      setParsedPreview([]);
      setTimeout(() => setBulkSuccessMsg(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student Form Submits
  const handleCreateSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRollNo.trim() || !newStudentName.trim()) return;

    await addStudent({
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

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    await updateStudent(editingStudent.id, {
      name: editStudentName.trim(),
      rollNo: editStudentRollNo.trim().toUpperCase(),
      batch: editStudentBatch.trim(),
      classId: editStudentClass,
      password: editStudentPassword.trim() || undefined
    });

    setEditingStudent(null);
  };

  // Trainer Form Submits
  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainerUsername.trim() || !newTrainerName.trim()) return;

    await addTrainer({
      username: newTrainerUsername.trim(),
      name: newTrainerName.trim(),
      email: newTrainerEmail.trim(),
      assignedClasses: [classes[0]?.id || 'class-1'],
      password: newTrainerPassword.trim() || undefined
    });

    setNewTrainerUsername('');
    setNewTrainerName('');
    setNewTrainerEmail('');
    setNewTrainerPassword('');
    setShowAddTrainerModal(false);
  };

  const handleSaveTrainerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer) return;

    await updateTrainer(editingTrainer.id, {
      name: editTrainerName.trim(),
      username: editTrainerUsername.trim(),
      email: editTrainerEmail.trim(),
      password: editTrainerPassword.trim() || undefined
    });

    setEditingTrainer(null);
  };

  // Department submit
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode.trim() || !deptName.trim()) return;
    await createDepartment({
      code: deptCode.trim().toUpperCase(),
      name: deptName.trim(),
      description: deptDesc.trim() || undefined
    });
    setDeptCode('');
    setDeptName('');
    setDeptDesc('');
    setShowDeptModal(false);
  };

  // Batch submit
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim()) return;
    await createBatch({
      name: batchName.trim(),
      batchYear: batchYear.trim(),
      startYear: batchStartYear,
      endYear: batchEndYear
    });
    setBatchName('');
    setShowBatchModal(false);
  };

  // Class submit
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    await createClass(className.trim(), classDesc.trim(), classDeptId || undefined, classBatchId || undefined);
    setClassName('');
    setClassDesc('');
    setShowClassModal(false);
  };

  // Reset attempt confirm
  const handleConfirmResetAttempt = async () => {
    if (!resetModalData) return;
    await resetStudentAttempt(resetModalData.testId, resetModalData.studentId, resetReason);
    setResetModalData(null);
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = filterClass === 'all' || s.classId === filterClass;
    return matchesSearch && matchesClass;
  });

  // Filter violations
  const filteredViolations = violations.filter(v => {
    return (
      v.studentName?.toLowerCase().includes(violationSearch.toLowerCase()) ||
      v.rollNo?.toLowerCase().includes(violationSearch.toLowerCase()) ||
      v.violationType.toLowerCase().includes(violationSearch.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
              Institutional Admin Portal
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              <Database className={`w-3 h-3 ${isDatabaseConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{isDatabaseConnected ? 'Supabase PostgreSQL' : 'Local Sandbox Mode'}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">Institutional Administration</h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Authoritative management for departments, batches, classroom rosters, proctoring security, attempt overrides, and audit trails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refreshData()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sync DB</span>
          </button>

          <button
            onClick={() => setShowAddStudentModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs border border-slate-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setShowAddTrainerModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>Add Trainer</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-4 text-sm font-semibold overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'departments', label: `Departments (${departments.length})`, icon: Building2 },
          { id: 'batches', label: `Batches (${batches.length})`, icon: Calendar },
          { id: 'classes', label: `Classes (${classes.length})`, icon: School },
          { id: 'students', label: `Students (${students.length})`, icon: GraduationCap },
          { id: 'trainers', label: `Trainers (${trainers.length})`, icon: Users },
          { id: 'tests', label: `Tests & Assignments (${tests.length})`, icon: FileText },
          { id: 'attempts', label: `Attempts (${submissions.length})`, icon: Activity },
          { id: 'violations', label: `Violations (${violations.length})`, icon: ShieldAlert },
          { id: 'results', label: 'Results & Reports', icon: Award },
          { id: 'audit', label: `Audit Logs (${auditLogs.length})`, icon: History },
          { id: 'import', label: 'Bulk Ingest', icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`pb-2.5 px-1 flex items-center gap-2 border-b-2 whitespace-nowrap text-xs transition-all ${
                isActive
                  ? 'border-cyan-400 text-cyan-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Departments</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-1">{departments.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Batches</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-1">{batches.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Classrooms</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-1">{classes.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Enrolled Students</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-1">{students.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Completed Tests</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-1">{submissions.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Proctor Flags</div>
              <div className="text-2xl font-black font-mono text-rose-400 mt-1">{violations.length}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Quick Actions Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                Administrative Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  onClick={() => setShowDeptModal(true)}
                  className="p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-left space-y-1 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <div className="font-bold text-slate-200">New Department</div>
                  <div className="text-[10px] text-slate-400">Add institutional division</div>
                </button>
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-left space-y-1 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <div className="font-bold text-slate-200">New Academic Batch</div>
                  <div className="text-[10px] text-slate-400">Configure year cohort</div>
                </button>
                <button
                  onClick={() => setShowClassModal(true)}
                  className="p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-left space-y-1 transition-colors"
                >
                  <School className="w-4 h-4 text-cyan-400" />
                  <div className="font-bold text-slate-200">New Classroom</div>
                  <div className="text-[10px] text-slate-400">Roster & section setup</div>
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className="p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-left space-y-1 transition-colors"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <div className="font-bold text-slate-200">Bulk Ingestion</div>
                  <div className="text-[10px] text-slate-400">Import CSV or roster list</div>
                </button>
              </div>
            </div>

            {/* Live Security & Proctoring Snapshot */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Recent Proctoring Flags
                </span>
                <span className="text-[10px] font-mono text-slate-400">Top 5</span>
              </h3>
              {violations.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                  Zero proctoring violations recorded in active examinations.
                </div>
              ) : (
                <div className="space-y-2">
                  {violations.slice(0, 5).map(v => (
                    <div
                      key={v.id}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{v.studentName || 'Student'} ({v.rollNo || 'Candidate'})</div>
                        <div className="text-[10px] text-rose-400 font-mono capitalize">
                          {v.violationType.replace('_', ' ')}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {v.recordedAt.split('T')[1]?.substring(0, 5) || v.recordedAt.substring(11, 16)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Institutional Departments
            </h2>
            <button
              onClick={() => setShowDeptModal(true)}
              className="px-3 py-1.5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map(dept => {
              const deptClasses = classes.filter(c => c.departmentId === dept.id);
              return (
                <div key={dept.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold">
                        {dept.code}
                      </span>
                      <h3 className="font-bold text-slate-100 text-sm mt-1">{dept.name}</h3>
                    </div>
                    <button
                      onClick={() => deleteDepartment(dept.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {dept.description || 'Institutional engineering department.'}
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{deptClasses.length} Active Classrooms</span>
                    <span>Created {dept.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: BATCHES */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Academic Batches & Graduation Cohorts
            </h2>
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-3 py-1.5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Batch</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map(batch => (
              <div key={batch.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                      {batch.batchYear}
                    </span>
                    <h3 className="font-bold text-slate-100 text-sm mt-1">{batch.name}</h3>
                  </div>
                  <button
                    onClick={() => deleteBatch(batch.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-slate-400">
                  Academic Timeline: {batch.startYear} – {batch.endYear}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <School className="w-4 h-4 text-cyan-400" />
              Classrooms & Student Rosters
            </h2>
            <button
              onClick={() => setShowClassModal(true)}
              className="px-3 py-1.5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Classroom</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map(cls => {
              const classStudents = students.filter(s => s.classId === cls.id);
              const assignedTrainer = trainers.find(t => t.id === cls.trainerId);
              const dept = departments.find(d => d.id === cls.departmentId);
              return (
                <div key={cls.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold">
                          {cls.code || cls.id}
                        </span>
                        {dept && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {dept.code}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-100 text-sm mt-1">{cls.name}</h3>
                    </div>
                    <button
                      onClick={() => deleteClass(cls.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{cls.description || 'Standard training classroom'}</p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono font-bold">{classStudents.length} Students</span>
                    <span className="text-cyan-400 font-mono text-[11px]">{assignedTrainer?.name || 'Assigned Trainer'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: STUDENTS DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search roll no or name..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-3 py-1.5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Roll Number</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Assigned Class</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredStudents.map(s => {
                  const studentClass = classes.find(c => c.id === s.classId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-cyan-400">{s.rollNo}</td>
                      <td className="p-3 font-semibold">{s.name}</td>
                      <td className="p-3 text-slate-400">{studentClass?.name || 'Unassigned'}</td>
                      <td className="p-3 text-slate-400 font-mono">{s.batch || '2024-28'}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingStudent(s);
                            setEditStudentName(s.name);
                            setEditStudentRollNo(s.rollNo);
                            setEditStudentBatch(s.batch || '2024-28');
                            setEditStudentClass(s.classId || classes[0]?.id || 'class-1');
                            setEditStudentPassword(s.password || '');
                          }}
                          className="p-1 hover:text-cyan-400 transition-colors"
                          title="Edit Student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteStudent(s.id)}
                          className="p-1 hover:text-rose-400 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: TRAINERS */}
      {activeTab === 'trainers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Faculty Trainers & Proctors
            </h2>
            <button
              onClick={() => setShowAddTrainerModal(true)}
              className="px-3 py-1.5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Trainer</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trainers.map(t => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 text-[10px] font-mono font-bold">
                      @{t.username}
                    </span>
                    <h3 className="font-bold text-slate-100 text-sm mt-1">{t.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingTrainer(t);
                        setEditTrainerName(t.name);
                        setEditTrainerUsername(t.username);
                        setEditTrainerEmail(t.email || '');
                        setEditTrainerPassword(t.password || '');
                      }}
                      className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTrainer(t.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-mono">{t.email || 'faculty@institution.edu'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: TESTS & ASSIGNMENTS */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Assignments</th>
                  <th className="p-3">Attempts</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {tests.map(t => {
                  const testSubs = submissions.filter(s => s.testId === t.id);
                  const assignedClassNames = (t.assignedClassIds || [])
                    .map(id => classes.find(c => c.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold">{t.title}</td>
                      <td className="p-3 capitalize font-mono text-cyan-400">{t.category}</td>
                      <td className="p-3 font-mono">{t.timeLimit}s</td>
                      <td className="p-3 text-slate-400">{assignedClassNames || 'Open / All'}</td>
                      <td className="p-3 font-mono font-bold text-slate-300">{testSubs.length}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => deleteTest(t.id)}
                          className="p-1 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: ATTEMPTS & RESET OVERRIDE */}
      {activeTab === 'attempts' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-3">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong>Administrative Attempt Override:</strong> Single attempt enforcement is guaranteed by PostgreSQL unique constraints. Use the "Reset Attempt" action below only to authorize a candidate re-examination following verified technical disruptions. Every reset is logged to the institutional audit trail.
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Test Title</th>
                  <th className="p-3">Net WPM</th>
                  <th className="p-3">Accuracy</th>
                  <th className="p-3">Proctor Flags</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {submissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold">{sub.studentName}</td>
                    <td className="p-3 font-mono text-cyan-400">{sub.rollNo}</td>
                    <td className="p-3">{sub.testTitle}</td>
                    <td className="p-3 font-mono font-bold">{sub.netWpm} WPM</td>
                    <td className="p-3 font-mono">{sub.accuracy}%</td>
                    <td className="p-3">
                      {sub.proctorBlurFlags && sub.proctorBlurFlags > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold text-[10px]">
                          {sub.proctorBlurFlags} flags
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-mono">Clean</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[10px]">{sub.timestamp}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() =>
                          setResetModalData({
                            testId: sub.testId,
                            studentId: sub.studentId,
                            studentName: sub.studentName,
                            testTitle: sub.testTitle
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1 ml-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Attempt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: VIOLATIONS LOG */}
      {activeTab === 'violations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search violations..."
                value={violationSearch}
                onChange={e => setViolationSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Violations: <strong className="text-rose-400">{filteredViolations.length}</strong>
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Violation Event</th>
                  <th className="p-3">Attempt ID</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredViolations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No violations recorded in system proctoring sessions.
                    </td>
                  </tr>
                ) : (
                  filteredViolations.map(v => (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-cyan-400">{v.rollNo || 'Candidate'}</td>
                      <td className="p-3 font-semibold">{v.studentName || 'Student'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] uppercase font-bold border border-rose-500/30">
                          {v.violationType}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500 text-[10px]">{v.attemptId.substring(0, 12)}...</td>
                      <td className="p-3 font-mono text-slate-400 text-[10px]">{v.recordedAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 10: RESULTS & REPORTS */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map(test => {
              const testSubs = submissions.filter(s => s.testId === test.id);
              return (
                <div key={test.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{test.title}</h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{test.category} assessment</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                      {testSubs.length} finished
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const rep = generateTestReport(test.id);
                      downloadReportCSV(rep);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Examination Report (CSV)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 11: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-400 text-[10px]">{log.createdAt}</td>
                    <td className="p-3 font-bold text-cyan-400">{log.adminName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 capitalize text-slate-300">{log.entityType}</td>
                    <td className="p-3 text-slate-400 text-[10px] font-sans">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 12: BULK INGESTION */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                Batch Roster Ingestion
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Paste student lists directly from Excel, CSV, or Google Sheets with columns: <strong>RollNo, Name</strong>
              </p>
            </div>

            {bulkSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400">Target Classroom Assignment</label>
                <select
                  value={bulkClassId}
                  onChange={e => setBulkClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <label className="text-xs font-mono text-slate-400 block pt-2">Paste Tabular Text</label>
                <textarea
                  rows={8}
                  placeholder={`24CS001, John Doe\n24CS002, Sarah Jane\n24CS003, Michael Smith`}
                  value={pasteData}
                  onChange={e => handleParsePaste(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono text-slate-400">Roster Ingestion Preview</label>
                  <span className="text-xs text-cyan-400 font-mono font-bold">{parsedPreview.length} Candidates</span>
                </div>
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-y-auto max-h-56 space-y-1 text-xs">
                  {parsedPreview.length === 0 ? (
                    <div className="text-slate-500 text-center py-10 font-mono">
                      No records parsed. Paste roster data on the left.
                    </div>
                  ) : (
                    parsedPreview.map((p, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-slate-900 font-mono">
                        <span className="font-bold text-cyan-400">{p.rollNo}</span>
                        <span className="text-slate-300 font-sans">{p.name}</span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  disabled={parsedPreview.length === 0 || isSubmitting}
                  onClick={handleBulkUpload}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isSubmitting ? 'Importing...' : `Import ${parsedPreview.length} Students to Database`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Create Department</h3>
              <button onClick={() => setShowDeptModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-slate-400">Department Code</label>
                <input
                  required
                  placeholder="e.g. CSE, IT, MECH"
                  value={deptCode}
                  onChange={e => setDeptCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-slate-400">Department Name</label>
                <input
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-slate-400">Description</label>
                <textarea
                  placeholder="Optional department notes"
                  value={deptDesc}
                  onChange={e => setDeptDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
              >
                Create Department
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BATCH MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Create Academic Batch</h3>
              <button onClick={() => setShowBatchModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-slate-400">Batch Name</label>
                <input
                  required
                  placeholder="e.g. Batch 2024-2028"
                  value={batchName}
                  onChange={e => setBatchName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-slate-400">Start Year</label>
                  <input
                    type="number"
                    value={batchStartYear}
                    onChange={e => setBatchStartYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="font-mono text-slate-400">End Year</label>
                  <input
                    type="number"
                    value={batchEndYear}
                    onChange={e => setBatchEndYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
              >
                Save Batch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CLASS MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Create Classroom</h3>
              <button onClick={() => setShowClassModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-slate-400">Class Name</label>
                <input
                  required
                  placeholder="e.g. CSE Alpha (2024-28)"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-slate-400">Department</label>
                <select
                  value={classDeptId}
                  onChange={e => setClassDeptId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-slate-400">Batch</label>
                <select
                  value={classBatchId}
                  onChange={e => setClassBatchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                >
                  <option value="">Select Batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.batchYear})</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
              >
                Create Classroom
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Add Student Candidate</h3>
              <button onClick={() => setShowAddStudentModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateSingleStudent} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-slate-400">Roll Number</label>
                <input
                  required
                  placeholder="e.g. 24CS042"
                  value={newRollNo}
                  onChange={e => setNewRollNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-slate-400">Full Name</label>
                <input
                  required
                  placeholder="e.g. Jane Doe"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-slate-400">Assigned Classroom</label>
                <select
                  value={newStudentClass}
                  onChange={e => setNewStudentClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-slate-400">Login Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave empty for roll number default"
                  value={newStudentPassword}
                  onChange={e => setNewStudentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
              >
                Save Student
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Edit Student: {editingStudent.rollNo}</h3>
              <button onClick={() => setEditingStudent(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveStudentEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-slate-400">Full Name</label>
                <input
                  required
                  value={editStudentName}
                  onChange={e => setEditStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-slate-400">Roll Number</label>
                <input
                  required
                  value={editStudentRollNo}
                  onChange={e => setEditStudentRollNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-slate-400">Classroom</label>
                <select
                  value={editStudentClass}
                  onChange={e => setEditStudentClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-slate-400">Reset Password</label>
                <input
                  type="password"
                  placeholder="New password or leave unchanged"
                  value={editStudentPassword}
                  onChange={e => setEditStudentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
              >
                Update Student
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD TRAINER MODAL */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Add Faculty Trainer</h3>
              <button onClick={() => setShowAddTrainerModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateTrainer} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-slate-400">Username</label>
                <input
                  required
                  placeholder="e.g. trainer.cse"
                  value={newTrainerUsername}
                  onChange={e => setNewTrainerUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-slate-400">Full Name</label>
                <input
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={newTrainerName}
                  onChange={e => setNewTrainerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-slate-400">Email Address</label>
                <input
                  type="email"
                  placeholder="trainer@institution.edu"
                  value={newTrainerEmail}
                  onChange={e => setNewTrainerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-slate-400">Access Password</label>
                <input
                  type="password"
                  placeholder="Default password"
                  value={newTrainerPassword}
                  onChange={e => setNewTrainerPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
              >
                Create Trainer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESET ATTEMPT CONFIRMATION MODAL */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-rose-300 text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                Authorize Attempt Reset
              </h3>
              <button onClick={() => setResetModalData(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-300">
              You are about to reset the examination attempt of <strong>{resetModalData.studentName}</strong> for <strong>"{resetModalData.testTitle}"</strong>.
              This will remove their submission and allow them to retake the test.
            </p>
            <div>
              <label className="font-mono text-slate-400 text-xs">Authorization Audit Reason</label>
              <textarea
                rows={2}
                value={resetReason}
                onChange={e => setResetReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResetModalData(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetAttempt}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold"
              >
                Confirm Reset & Log Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
