import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student, Trainer, TypingTest, Department, Batch, ClassRoom, StudentCertificate } from '../types';
import { ExcelStudentImportModal } from './ExcelStudentImportModal';
import { CertificateModal } from './CertificateModal';
import { formatISTDate, formatISTDateTime } from '../utils/dateUtils';
import { downloadStudentImportTemplate, exportStudentsToExcel } from '../utils/excelUtils';
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
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Power,
  Swords,
  Trophy,
  Sparkles
} from 'lucide-react';
import { checkDatabaseConnection, DatabaseConnectionStatus } from '../services/supabaseService';

interface AdminPortalProps {
  onOpenVerification?: (certId: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onOpenVerification }) => {
  const [dbStatus, setDbStatus] = useState<DatabaseConnectionStatus | null>(null);
  const [studentModalError, setStudentModalError] = useState('');
  const [bulkErrorMsg, setBulkErrorMsg] = useState('');
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [selectedViewCert, setSelectedViewCert] = useState<StudentCertificate | null>(null);
  const [adminCertSearch, setAdminCertSearch] = useState('');
  const [adminCertStatusFilter, setAdminCertStatusFilter] = useState<'all' | 'valid' | 'revoked'>('all');

  useEffect(() => {
    checkDatabaseConnection().then(setDbStatus).catch(console.error);
  }, []);
  const {
    departments,
    batches,
    classes,
    students,
    admins,
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
    updateCertificateStatus,
    deleteCertificate,
    refreshData,
    addStudentsToClass,
    moduleControls,
    toggleModule,
    isModuleDisabled
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
    | 'certificates'
    | 'audit'
    | 'import'
    | 'modules';

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const filteredAdminCertificates = useMemo(() => {
    return certificates.filter(cert => {
      if (adminCertStatusFilter !== 'all' && (cert.status || 'valid') !== adminCertStatusFilter) return false;
      if (adminCertSearch.trim()) {
        const q = adminCertSearch.toLowerCase();
        return (
          cert.studentName?.toLowerCase().includes(q) ||
          cert.rollNo?.toLowerCase().includes(q) ||
          cert.id?.toLowerCase().includes(q) ||
          cert.verificationCode?.toLowerCase().includes(q) ||
          cert.testTitle?.toLowerCase().includes(q) ||
          cert.achievementTitle?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [certificates, adminCertStatusFilter, adminCertSearch]);

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
  const [deptModalError, setDeptModalError] = useState('');

  // Batch Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchYear, setBatchYear] = useState('2024-2028');
  const [batchStartYear, setBatchStartYear] = useState(2024);
  const [batchEndYear, setBatchEndYear] = useState(2028);
  const [batchModalError, setBatchModalError] = useState('');

  // Class Modal State
  const [showClassModal, setShowClassModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [classDeptId, setClassDeptId] = useState('');
  const [classBatchId, setClassBatchId] = useState('');
  const [classModalError, setClassModalError] = useState('');

  // Add single student modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newRollNo, setNewRollNo] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentBatch, setNewStudentBatch] = useState('2024-28');
  const [newStudentClass, setNewStudentClass] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');

  // Assign Students to Class Modal
  const [assigningClass, setAssigningClass] = useState<ClassRoom | null>(null);
  const [selectedStudentIdsToAssign, setSelectedStudentIdsToAssign] = useState<string[]>([]);
  const [assignStudentSearch, setAssignStudentSearch] = useState('');
  const [assignFilterUnassignedOnly, setAssignFilterUnassignedOnly] = useState(false);
  const [isAssigningStudents, setIsAssigningStudents] = useState(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState('');

  // Edit student modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentRollNo, setEditStudentRollNo] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editStudentPhone, setEditStudentPhone] = useState('');
  const [editStudentBatch, setEditStudentBatch] = useState('');
  const [editStudentClass, setEditStudentClass] = useState('');
  const [editStudentStatus, setEditStudentStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [editStudentPassword, setEditStudentPassword] = useState('');

  // Add trainer modal
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [newTrainerUsername, setNewTrainerUsername] = useState('');
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newTrainerEmail, setNewTrainerEmail] = useState('');
  const [newTrainerPhone, setNewTrainerPhone] = useState('');
  const [newTrainerDesignation, setNewTrainerDesignation] = useState('Faculty Trainer');
  const [newTrainerPassword, setNewTrainerPassword] = useState('');

  // Edit trainer modal
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [editTrainerName, setEditTrainerName] = useState('');
  const [editTrainerUsername, setEditTrainerUsername] = useState('');
  const [editTrainerEmail, setEditTrainerEmail] = useState('');
  const [editTrainerPhone, setEditTrainerPhone] = useState('');
  const [editTrainerDesignation, setEditTrainerDesignation] = useState('');
  const [editTrainerStatus, setEditTrainerStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [editTrainerAssignedClasses, setEditTrainerAssignedClasses] = useState<string[]>([]);
  const [editTrainerPassword, setEditTrainerPassword] = useState('');

  // Reset Attempt Modal
  const [resetModalData, setResetModalData] = useState<{ testId: string; studentId: string; studentName: string; testTitle: string } | null>(null);
  const [resetReason, setResetReason] = useState('Authorized re-examination due to technical interruption');

  // Bulk Upload State
  const [pasteData, setPasteData] = useState('');
  const [parsedPreview, setParsedPreview] = useState<{ rollNo: string; name: string }[]>([]);
  const [bulkClassId, setBulkClassId] = useState('');
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
    setBulkErrorMsg('');
    try {
      const selectedClass = classes.find(c => c.id === bulkClassId);

      const studentObjects = parsedPreview.map(p => ({
        rollNo: p.rollNo,
        name: p.name,
        batchId: selectedClass?.batchId || undefined,
        classId: selectedClass ? selectedClass.id : undefined,
        departmentId: selectedClass?.departmentId || undefined
      }));

      const count = await bulkAddStudents(studentObjects);
      setBulkSuccessMsg(
        selectedClass
          ? `Successfully imported ${count} students into ${selectedClass.name}.`
          : `Successfully imported ${count} students (Unassigned / No Classroom).`
      );
      setPasteData('');
      setParsedPreview([]);
      await refreshData();
      setTimeout(() => setBulkSuccessMsg(''), 5000);
    } catch (err: any) {
      setBulkErrorMsg(err.message || 'Failed to bulk import students.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student Form Submits
  const handleCreateSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRollNo.trim() || !newStudentName.trim()) return;

    setStudentModalError('');
    try {
      const selectedClass = classes.find(c => c.id === newStudentClass);

      await addStudent({
        rollNo: newRollNo.trim().toUpperCase(),
        name: newStudentName.trim(),
        batchId: selectedClass?.batchId || undefined,
        classId: selectedClass ? selectedClass.id : undefined,
        departmentId: selectedClass?.departmentId || undefined,
        password: newStudentPassword.trim() || undefined
      });

      setNewRollNo('');
      setNewStudentName('');
      setNewStudentClass('');
      setNewStudentPassword('');
      setShowAddStudentModal(false);
      await refreshData();
    } catch (err: any) {
      setStudentModalError(err.message || 'Failed to add student to database.');
    }
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const selectedClass = classes.find(c => c.id === editStudentClass);
    await updateStudent(editingStudent.id, {
      name: editStudentName.trim(),
      rollNo: editStudentRollNo.trim().toUpperCase(),
      email: editStudentEmail.trim() || undefined,
      phone: editStudentPhone.trim() || undefined,
      batchId: selectedClass?.batchId || undefined,
      classId: selectedClass ? selectedClass.id : undefined,
      departmentId: selectedClass?.departmentId || undefined,
      status: editStudentStatus,
      password: editStudentPassword.trim() || undefined
    });

    setEditingStudent(null);
    await refreshData();
  };

  // Trainer Form Submits
  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainerUsername.trim() || !newTrainerName.trim()) return;

    await addTrainer({
      username: newTrainerUsername.trim(),
      name: newTrainerName.trim(),
      email: newTrainerEmail.trim(),
      phone: newTrainerPhone.trim() || undefined,
      designation: newTrainerDesignation.trim() || 'Faculty Trainer',
      assignedClasses: classes.length > 0 ? [classes[0].id] : [],
      password: newTrainerPassword.trim() || undefined
    });

    setNewTrainerUsername('');
    setNewTrainerName('');
    setNewTrainerEmail('');
    setNewTrainerPhone('');
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
      phone: editTrainerPhone.trim() || undefined,
      designation: editTrainerDesignation.trim() || 'Faculty Trainer',
      status: editTrainerStatus,
      assignedClasses: editTrainerAssignedClasses,
      password: editTrainerPassword.trim() || undefined
    });

    setEditingTrainer(null);
  };

  // Department submit
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode.trim() || !deptName.trim()) return;
    setDeptModalError('');
    try {
      await createDepartment({
        code: deptCode.trim().toUpperCase(),
        name: deptName.trim(),
        description: deptDesc.trim() || undefined,
        status: 'active'
      });
      setDeptCode('');
      setDeptName('');
      setDeptDesc('');
      setShowDeptModal(false);
      await refreshData();
    } catch (err: any) {
      setDeptModalError(err.message || 'Failed to create department');
    }
  };

  // Batch submit
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim()) return;
    setBatchModalError('');
    try {
      await createBatch({
        name: batchName.trim(),
        batchYear: batchYear.trim(),
        academicYear: `${batchStartYear}-${(batchEndYear % 100).toString().padStart(2, '0')}`,
        status: 'active'
      });
      setBatchName('');
      setShowBatchModal(false);
      await refreshData();
    } catch (err: any) {
      setBatchModalError(err.message || 'Failed to create batch');
    }
  };

  // Class submit
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    setClassModalError('');
    try {
      await createClass(
        className.trim(),
        classDesc.trim(),
        classDeptId || undefined,
        classBatchId || undefined
      );
      setClassName('');
      setClassDesc('');
      setClassDeptId('');
      setClassBatchId('');
      setShowClassModal(false);
      await refreshData();
    } catch (err: any) {
      setClassModalError(err.message || 'Failed to create class');
    }
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
    const matchesClass =
      filterClass === 'all'
        ? true
        : filterClass === 'unassigned'
        ? !s.classId
        : s.classId === filterClass;
    return matchesSearch && matchesClass;
  });

  // Students eligible for assignment into a class
  const availableStudentsForAssign = useMemo(() => {
    return students.filter(s => {
      const q = assignStudentSearch.trim().toLowerCase();
      const matchesSearch = !q || s.rollNo.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      const matchesUnassigned = assignFilterUnassignedOnly ? !s.classId : true;
      return matchesSearch && matchesUnassigned;
    });
  }, [students, assignStudentSearch, assignFilterUnassignedOnly]);

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

      {/* Missing Tables / Setup Alert */}
      {dbStatus && dbStatus.isConnected && (!dbStatus.tablesFound.students || !dbStatus.tablesFound.admins) && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-amber-200 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>Supabase Database Schema Setup Required</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Action Needed</span>
              </h4>
              <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                Your Supabase project is connected, but the database tables (<code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-cyan-300">students</code>, <code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-cyan-300">admins</code>, <code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-cyan-300">tests</code>) do not exist yet. Created students cannot be saved to the cloud database or log in until you run the SQL setup script.
              </p>
            </div>
          </div>
          
        </div>
      )}

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
          { id: 'certificates', label: `Certificates (${certificates.length})`, icon: ShieldCheck },
          { id: 'audit', label: `Audit Logs (${auditLogs.length})`, icon: History },
          { id: 'import', label: 'Bulk Ingest', icon: FileSpreadsheet },
          { id: 'modules', label: 'Feature Controls', icon: Sliders }
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

      
      {/* TAB: ADMINISTRATORS */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100">System Administrators</h2>
              <p className="text-sm text-slate-400">Manage high-level access and roles</p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors">
              <Plus size={18} /> Add Admin
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Username</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {admins.map(admin => (
                    <tr key={admin.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-200">{admin.name}</div>
                      </td>
                      <td className="p-4 text-slate-300">{admin.username}</td>
                      <td className="p-4 text-slate-400 text-sm">{admin.email}</td>
                      <td className="p-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-rose-400 transition-colors" title="Revoke Access">
                          <Shield size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        No administrators found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningClass(cls);
                        setSelectedStudentIdsToAssign([]);
                        setAssignSuccessMsg('');
                      }}
                      className="w-full py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add / Assign Students</span>
                    </button>
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
                <option value="unassigned">Unassigned (No Class)</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowExcelImportModal(true)}
                className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk Excel Import</span>
              </button>

              <button
                onClick={() => downloadStudentImportTemplate(classes.map(c => ({ id: c.id, name: c.name })), 'xlsx')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Template</span>
              </button>

              <button
                onClick={() => exportStudentsToExcel(students)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export</span>
              </button>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1 shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </button>
            </div>
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
                      <td className="p-3">
                        {studentClass ? (
                          <span className="text-slate-200 font-medium">{studentClass.name}</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                              Unassigned
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudent(s);
                                setEditStudentName(s.name);
                                setEditStudentRollNo(s.rollNo);
                                setEditStudentEmail(s.email || '');
                                setEditStudentPhone(s.phone || '');
                                setEditStudentBatch(s.batch || '2024-28');
                                setEditStudentClass('');
                                setEditStudentStatus(s.status || 'active');
                                setEditStudentPassword(s.password || '');
                              }}
                              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                            >
                              + Assign Class
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-slate-400 font-mono">{s.batch || '2024-28'}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingStudent(s);
                            setEditStudentName(s.name);
                            setEditStudentRollNo(s.rollNo);
                            setEditStudentEmail(s.email || '');
                            setEditStudentPhone(s.phone || '');
                            setEditStudentBatch(s.batch || '2024-28');
                            setEditStudentClass(s.classId || '');
                            setEditStudentStatus(s.status || 'active');
                            setEditStudentPassword(s.password || '');
                          }}
                          className="p-1 hover:text-cyan-400 transition-colors cursor-pointer"
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
                        setEditTrainerPhone(t.phone || '');
                        setEditTrainerDesignation(t.designation || 'Faculty Trainer');
                        setEditTrainerStatus(t.status || 'active');
                        setEditTrainerAssignedClasses(t.assignedClasses || []);
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

      {/* TAB 11: CERTIFICATES & CREDENTIALS */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search certificate ID, candidate, roll..."
                  value={adminCertSearch}
                  onChange={e => setAdminCertSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                {(['all', 'valid', 'revoked'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setAdminCertStatusFilter(st)}
                    className={`px-2.5 py-0.5 rounded-lg capitalize font-mono text-[11px] transition-colors cursor-pointer ${
                      adminCertStatusFilter === st
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Certificate ID</th>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Roll / ID</th>
                  <th className="p-3">Achievement</th>
                  <th className="p-3 text-right">Net WPM</th>
                  <th className="p-3 text-right">Accuracy</th>
                  <th className="p-3 text-right">Issued Date (IST)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredAdminCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500 font-mono">
                      No certificates matching query.
                    </td>
                  </tr>
                ) : (
                  filteredAdminCertificates.map(c => {
                    const isRev = c.status === 'revoked';
                    return (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-cyan-400">{c.id || c.certificateNumber || c.verificationCode}</td>
                        <td className="p-3 font-semibold">{c.studentName}</td>
                        <td className="p-3 font-mono text-slate-400">{c.rollNo || '—'}</td>
                        <td className="p-3 text-slate-300">{c.achievementTitle || c.testTitle}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">{c.wpm} WPM</td>
                        <td className="p-3 text-right font-mono font-bold text-amber-400">{c.accuracy}%</td>
                        <td className="p-3 text-right font-mono text-slate-400 text-[10px]">{formatISTDate(c.issuedAt)}</td>
                        <td className="p-3 text-center">
                          {isRev ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              REVOKED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              VALID
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => setSelectedViewCert(c)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              if (onOpenVerification) {
                                onOpenVerification(c.id || c.verificationCode);
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold cursor-pointer"
                          >
                            Verify
                          </button>
                          {isRev ? (
                            <button
                              onClick={() => updateCertificateStatus(c.id, 'valid')}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-500/30 cursor-pointer"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => updateCertificateStatus(c.id, 'revoked')}
                              className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[11px] font-semibold hover:bg-rose-500/30 cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 12: AUDIT LOGS */}
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

            {bulkErrorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                <div className="font-semibold flex items-center gap-2 text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{bulkErrorMsg}</span>
                </div>
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
                  <option value="">-- No Classroom (Leave Blank / Unassigned) --</option>
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

      {/* TAB 13: FEATURE CONTROLS / STOP MODULES */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Administrative Gates
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 mt-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  <span>Platform Feature Controls & Module Gates</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Instantly stop or enable specific modules across the platform. When a module is stopped, students or visitors accessing it will see a friendly <strong>"Module Under Development"</strong> notification and will be directed back to their active practice or assessments.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Enforcement: Real-time</span>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              {[
                {
                  key: 'multiplayer' as const,
                  name: 'Multiplayer Arena',
                  desc: 'Real-time competitive typing battles, live lobby matchmaking, and race tracks.',
                  icon: Swords,
                  badge: 'Competitions'
                },
                {
                  key: 'academy' as const,
                  name: 'Touch Typing Academy',
                  desc: 'Structured 5-module curriculum with diagnostic placement tests and lesson drills.',
                  icon: GraduationCap,
                  badge: 'Curriculum'
                },
                {
                  key: 'leaderboard' as const,
                  name: 'Public Leaderboard',
                  desc: 'Global typing speed hall of fame, percentiles, and institutional rankings.',
                  icon: Trophy,
                  badge: 'Rankings'
                },
                {
                  key: 'tests' as const,
                  name: 'Explore Tests Directory',
                  desc: 'Public catalog of prose, standard speed paragraphs, and code exercises.',
                  icon: Sparkles,
                  badge: 'Catalog'
                },
                {
                  key: 'verify' as const,
                  name: 'Public Certificate Verification',
                  desc: 'Public verification portal for validating student certificate tokens.',
                  icon: ShieldCheck,
                  badge: 'Credentialing'
                }
              ].map(mod => {
                const Icon = mod.icon;
                const config = moduleControls[mod.key];
                const isDisabled = isModuleDisabled(mod.key);

                return (
                  <div
                    key={mod.key}
                    className={`p-5 rounded-2xl border transition-all ${
                      isDisabled
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isDisabled
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-100">{mod.name}</h4>
                            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                              {mod.badge}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mt-0.5 ${
                              isDisabled ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDisabled ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                            />
                            {isDisabled ? 'Stopped (Module Under Development)' : 'Active & Accessible'}
                          </span>
                        </div>
                      </div>

                      {/* Action Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleModule(mod.key, !isDisabled)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isDisabled
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isDisabled ? 'Re-enable Module' : 'Stop / Mark Under Dev'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 mb-3">{mod.desc}</p>

                    {/* Announcement Message Preview & Edit */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Notice Shown to Students when Stopped:</span>
                        <span className="text-[10px] text-slate-500">Live Customization</span>
                      </label>
                      <input
                        type="text"
                        defaultValue={config?.statusMessage || 'This module is currently under development. Please focus on your practice and assessments.'}
                        onBlur={e => {
                          const val = e.target.value.trim();
                          if (val && val !== config?.statusMessage) {
                            toggleModule(mod.key, isDisabled, val);
                          }
                        }}
                        placeholder="e.g. This module is currently under development."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Create Department</h3>
              <button onClick={() => { setShowDeptModal(false); setDeptModalError(''); }}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {deptModalError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{deptModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-slate-400">Department Code</label>
                <input
                  required
                  placeholder="e.g. CSE, IT, MECH"
                  value={deptCode}
                  onChange={e => setDeptCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1 uppercase font-mono"
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
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer transition-colors"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Create Academic Batch</h3>
              <button onClick={() => { setShowBatchModal(false); setBatchModalError(''); }}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {batchModalError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{batchModalError}</span>
              </div>
            )}

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
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer transition-colors"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Create Classroom</h3>
              <button onClick={() => { setShowClassModal(false); setClassModalError(''); }}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {classModalError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{classModalError}</span>
              </div>
            )}

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
                  <option value="">Select Department (Optional)</option>
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
                  <option value="">Select Batch (Optional)</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.batchYear})</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer transition-colors"
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
              <button onClick={() => { setShowAddStudentModal(false); setStudentModalError(''); }}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            {studentModalError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-2">
                <div className="font-semibold flex items-center gap-1.5 text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{studentModalError}</span>
                </div>
                {studentModalError.includes('setup') || studentModalError.includes('SQL') || studentModalError.includes('missing') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStudentModal(false);
                      setStudentModalError('');
                    }}
                    className="w-full py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                  >
                    Close Modal
                  </button>
                ) : null}
              </div>
            )}
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
                  <option value="">-- No Classroom (Leave Blank / Unassigned) --</option>
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
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Set a secure access password for candidate login
                </p>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  {editingStudent.rollNo}
                </span>
                <h3 className="font-bold text-slate-100 text-sm mt-1">Edit Student Profile & Credentials</h3>
              </div>
              <button onClick={() => setEditingStudent(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveStudentEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-slate-400">Email Address</label>
                  <input
                    type="email"
                    placeholder="student@institution.edu"
                    value={editStudentEmail}
                    onChange={e => setEditStudentEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="font-mono text-slate-400">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={editStudentPhone}
                    onChange={e => setEditStudentPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-slate-400">Assigned Classroom</label>
                  <select
                    value={editStudentClass}
                    onChange={e => setEditStudentClass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                  >
                    <option value="">-- No Classroom (Leave Blank / Unassigned) --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-slate-400">Account Status</label>
                  <select
                    value={editStudentStatus}
                    onChange={e => setEditStudentStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                  >
                    <option value="active">Active (Access Granted)</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended (Blocked)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-slate-400">Reset Password</label>
                <input
                  type="password"
                  placeholder="Enter new password or leave empty to keep unchanged"
                  value={editStudentPassword}
                  onChange={e => setEditStudentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Specify a new password to update candidate access
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  @{editingTrainer.username}
                </span>
                <h3 className="font-bold text-slate-100 text-sm mt-1">Edit Faculty Trainer / Proctor</h3>
              </div>
              <button onClick={() => setEditingTrainer(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTrainerEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-slate-400">Full Name</label>
                  <input
                    required
                    value={editTrainerName}
                    onChange={e => setEditTrainerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="font-mono text-slate-400">Username</label>
                  <input
                    required
                    value={editTrainerUsername}
                    onChange={e => setEditTrainerUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editTrainerEmail}
                    onChange={e => setEditTrainerEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="font-mono text-slate-400">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={editTrainerPhone}
                    onChange={e => setEditTrainerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-slate-400">Designation / Role</label>
                  <input
                    value={editTrainerDesignation}
                    onChange={e => setEditTrainerDesignation(e.target.value)}
                    placeholder="e.g. Lead Faculty Mentor"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="font-mono text-slate-400">Account Status</label>
                  <select
                    value={editTrainerStatus}
                    onChange={e => setEditTrainerStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                  >
                    <option value="active">Active (Access Granted)</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-slate-400">Assigned Classrooms / Batches</label>
                <div className="grid grid-cols-2 gap-2 mt-1 max-h-32 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {classes.map(c => {
                    const isChecked = editTrainerAssignedClasses.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-[11px] text-slate-300 hover:text-cyan-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setEditTrainerAssignedClasses([...editTrainerAssignedClasses, c.id]);
                            } else {
                              setEditTrainerAssignedClasses(editTrainerAssignedClasses.filter(id => id !== c.id));
                            }
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                        />
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-mono text-slate-400">Reset Access Password</label>
                <input
                  type="password"
                  placeholder="Enter new password or leave empty to keep unchanged"
                  value={editTrainerPassword}
                  onChange={e => setEditTrainerPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Specify a new password to update trainer access
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrainer(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
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

      {/* ASSIGN STUDENTS TO CLASS MODAL */}
      {assigningClass && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800 uppercase font-bold">
                  {assigningClass.code || 'Classroom'}
                </span>
                <h3 className="font-bold text-slate-100 text-base mt-1">
                  Assign Students to <span className="text-cyan-400">{assigningClass.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select students to enroll into this classroom roster. Currently enrolled: {students.filter(s => s.classId === assigningClass.id).length} students.
                </p>
              </div>
              <button
                onClick={() => { setAssigningClass(null); setSelectedStudentIdsToAssign([]); setAssignSuccessMsg(''); }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {assignSuccessMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{assignSuccessMsg}</span>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search student roll number or name..."
                  value={assignStudentSearch}
                  onChange={e => setAssignStudentSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 font-mono cursor-pointer select-none px-2 py-1 bg-slate-950 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={assignFilterUnassignedOnly}
                    onChange={e => setAssignFilterUnassignedOnly(e.target.checked)}
                    className="rounded accent-cyan-500 cursor-pointer"
                  />
                  <span>Unassigned only</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const eligibleIds = availableStudentsForAssign.map(s => s.id);
                    if (selectedStudentIdsToAssign.length === eligibleIds.length) {
                      setSelectedStudentIdsToAssign([]);
                    } else {
                      setSelectedStudentIdsToAssign(eligibleIds);
                    }
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors font-mono cursor-pointer"
                >
                  {selectedStudentIdsToAssign.length === availableStudentsForAssign.length && availableStudentsForAssign.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/60 divide-y divide-slate-800/60 max-h-72">
              {availableStudentsForAssign.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-mono">
                  No matching students found.
                </div>
              ) : (
                availableStudentsForAssign.map(s => {
                  const isSelected = selectedStudentIdsToAssign.includes(s.id);
                  const isCurrentClass = s.classId === assigningClass.id;
                  const currentClassName = classes.find(c => c.id === s.classId)?.name;

                  return (
                    <label
                      key={s.id}
                      className={`p-3 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isSelected ? 'bg-cyan-500/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedStudentIdsToAssign(prev => [...prev, s.id]);
                            } else {
                              setSelectedStudentIdsToAssign(prev => prev.filter(id => id !== s.id));
                            }
                          }}
                          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-cyan-400">{s.rollNo}</span>
                            <span className="text-xs font-semibold text-slate-200">{s.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {isCurrentClass ? (
                              <span className="text-emerald-400 font-semibold">Already in this class</span>
                            ) : s.classId ? (
                              <span className="text-slate-400">Current: {currentClassName || 'Another class'}</span>
                            ) : (
                              <span className="text-amber-400 font-bold">Unassigned (No Class)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-mono text-slate-500">
                        {s.batch || '2024-28'}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Footer / Submit */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">
                Selected: <strong className="text-cyan-400">{selectedStudentIdsToAssign.length}</strong> students
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setAssigningClass(null); setSelectedStudentIdsToAssign([]); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedStudentIdsToAssign.length === 0 || isAssigningStudents}
                  onClick={async () => {
                    if (!assigningClass || selectedStudentIdsToAssign.length === 0) return;
                    setIsAssigningStudents(true);
                    try {
                      await addStudentsToClass(assigningClass.id, selectedStudentIdsToAssign);
                      setAssignSuccessMsg(`Successfully assigned ${selectedStudentIdsToAssign.length} students to ${assigningClass.name}!`);
                      setTimeout(() => {
                        setAssigningClass(null);
                        setSelectedStudentIdsToAssign([]);
                        setAssignSuccessMsg('');
                      }, 1200);
                    } catch (err: any) {
                      alert(`Failed to assign students: ${err.message || 'Database error'}`);
                    } finally {
                      setIsAssigningStudents(false);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAssigningStudents ? 'Assigning...' : `Assign ${selectedStudentIdsToAssign.length} Students`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL / CSV BULK IMPORT MODAL */}
      {showExcelImportModal && (
        <ExcelStudentImportModal
          isOpen={showExcelImportModal}
          onClose={() => setShowExcelImportModal(false)}
          allowedClasses={classes}
        />
      )}

      {/* CERTIFICATE INSPECT MODAL */}
      {selectedViewCert && (
        <CertificateModal
          certificate={selectedViewCert}
          isOpen={Boolean(selectedViewCert)}
          onClose={() => setSelectedViewCert(null)}
          onOpenVerification={onOpenVerification}
        />
      )}
    </div>
  );
};
