import React, { useState, useMemo } from 'react';
import {
  AcademyCurriculum,
  AcademyLevel,
  AcademyLesson,
  ClassRoom,
  Student,
  AcademyAssignment
} from '../../types';
import {
  getActiveCurriculum,
  saveLessonOverride,
  getStudentAcademyProfile,
  setTrainerOverrideUnlockAll,
  getAcademyAssignments,
  saveAcademyAssignment,
  deleteAcademyAssignment,
  isAcademyGloballyOpen,
  setAcademyGloballyOpen
} from '../../services/academyService';
import { formatISTDateOnly } from '../../utils/dateUtils';
import {
  GraduationCap,
  BookOpen,
  Users,
  Settings,
  Unlock,
  Lock,
  Plus,
  Edit2,
  Check,
  AlertTriangle,
  Target,
  Zap,
  Clock,
  Search,
  CheckCircle2,
  BarChart3,
  Calendar,
  Award,
  Trash2,
  Globe,
  Sliders
} from 'lucide-react';

interface TrainerAcademyManagementProps {
  classes: ClassRoom[];
  students: Student[];
  trainerId: string;
  onOpenCertificateModal?: () => void;
}

export const TrainerAcademyManagement: React.FC<TrainerAcademyManagementProps> = ({
  classes,
  students,
  trainerId,
  onOpenCertificateModal
}) => {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'students' | 'assignments'>('curriculum');
  const [curriculum, setCurriculum] = useState<AcademyCurriculum>(() => getActiveCurriculum());
  const [globallyOpen, setGloballyOpen] = useState<boolean>(() => isAcademyGloballyOpen());

  // Search & Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // Editing lesson criteria modal / state
  const [editingLesson, setEditingLesson] = useState<AcademyLesson | null>(null);
  const [editMinAcc, setEditMinAcc] = useState<number>(95);
  const [editMinWpm, setEditMinWpm] = useState<number>(20);
  const [editDuration, setEditDuration] = useState<number>(60);

  // Assignment Creation Form State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignClassId, setAssignClassId] = useState<string>(classes[0]?.id || '');
  const [assignTitle, setAssignTitle] = useState('Typing Academy — Beginner & Intermediate Track');
  const [assignLevels, setAssignLevels] = useState<number[]>([1, 2, 3]);
  const [assignStartDate, setAssignStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [assignDueDate, setAssignDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [assignmentsList, setAssignmentsList] = useState<AcademyAssignment[]>(() =>
    getAcademyAssignments()
  );

  const handleToggleGlobalAcademy = (open: boolean) => {
    setAcademyGloballyOpen(open);
    setGloballyOpen(open);
  };

  // Student list with computed progress
  const studentsWithProgress = useMemo(() => {
    return students.map(student => {
      const profile = getStudentAcademyProfile(student.id);
      let masteredCount = 0;
      let totalCount = 0;
      let sumWpm = 0;
      let countWpm = 0;
      let sumAcc = 0;
      let countAcc = 0;

      curriculum.levels.forEach(lvl => {
        lvl.lessons.forEach(lsn => {
          totalCount++;
          const p = profile.lessonProgress[lsn.id];
          if (p?.status === 'mastered') masteredCount++;
          if (p?.bestWpm) {
            sumWpm += p.bestWpm;
            countWpm++;
          }
          if (p?.bestAccuracy) {
            sumAcc += p.bestAccuracy;
            countAcc++;
          }
        });
      });

      const avgWpm = countWpm > 0 ? Math.round(sumWpm / countWpm) : 0;
      const avgAcc = countAcc > 0 ? Math.round(sumAcc / countAcc) : 100;
      const completionPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
      const isStruggling = (avgAcc < 90 && countAcc > 0) || (completionPercent < 20 && countWpm > 2);

      return {
        student,
        profile,
        masteredCount,
        totalCount,
        completionPercent,
        avgWpm,
        avgAcc,
        isStruggling,
      };
    });
  }, [students, curriculum]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return studentsWithProgress.filter(s => {
      const matchesSearch =
        s.student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.student.rollNo?.toLowerCase().includes(studentSearch.toLowerCase());
      const matchesClass =
        selectedClassId === 'all' || s.student.classId === selectedClassId;
      return matchesSearch && matchesClass;
    });
  }, [studentsWithProgress, studentSearch, selectedClassId]);

  // Save lesson criteria edit
  const handleSaveLessonEdit = () => {
    if (!editingLesson) return;
    saveLessonOverride(editingLesson.id, {
      minAccuracy: editMinAcc,
      minWpm: editMinWpm,
      assessmentDuration: editDuration,
    });
    setCurriculum(getActiveCurriculum());
    setEditingLesson(null);
  };

  // Toggle override unlock for a student
  const handleToggleUnlockAll = (studentId: string, currentVal: boolean) => {
    setTrainerOverrideUnlockAll(studentId, !currentVal);
    // Trigger re-render
    setCurriculum(getActiveCurriculum());
  };

  // Create Assignment
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = classes.find(c => c.id === assignClassId);
    if (!targetClass) return;

    saveAcademyAssignment({
      title: assignTitle,
      classId: assignClassId,
      className: targetClass.name,
      trainerId,
      curriculumId: curriculum.id,
      levelIds: assignLevels,
      minWpm: 20,
      minAccuracy: 95,
      startDate: assignStartDate,
      dueDate: assignDueDate,
      status: 'active',
    });

    setAssignmentsList(getAcademyAssignments());
    setShowAssignModal(false);
  };

  const handleDeleteAssignment = (id: string) => {
    if (confirm('Are you sure you want to remove this academy assignment?')) {
      deleteAcademyAssignment(id);
      setAssignmentsList(getAcademyAssignments());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Department of Technical Training (DOTT)
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
              globallyOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {globallyOpen ? 'Status: Unrestricted Practice' : 'Status: Assigned Windows Only'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2 mt-1">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
            Typing Academy Curriculum & Access Control
          </h1>
          <p className="text-xs text-slate-400">
            Configure passing benchmarks (95% min accuracy), assign structured modules to specific classes/batches, and control student access windows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleToggleGlobalAcademy(!globallyOpen)}
            className={`px-4 py-2.5 rounded-2xl border font-bold text-xs transition-all flex items-center gap-2 ${
              globallyOpen
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {globallyOpen ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
            <span>{globallyOpen ? 'Lock Academy (Schedule Only)' : 'Unlock Academy for All'}</span>
          </button>

          {onOpenCertificateModal && (
            <button
              onClick={onOpenCertificateModal}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Issue Certificate</span>
            </button>
          )}

          <button
            onClick={() => setShowAssignModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Module to Class</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'curriculum'
              ? 'bg-emerald-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum & Benchmarks</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'students'
              ? 'bg-emerald-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Progress & Overrides</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'assignments'
              ? 'bg-emerald-500 text-slate-950 font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Class Assignments ({assignmentsList.length})</span>
        </button>
      </div>

      {/* TAB 1: CURRICULUM & BENCHMARKS */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {curriculum.levels.map(lvl => (
              <div key={lvl.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                      Level {lvl.order}
                    </span>
                    <h3 className="font-bold text-slate-100 text-sm">{lvl.title}</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {lvl.lessons.length} Lessons
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{lvl.description}</p>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  {lvl.lessons.map(lsn => (
                    <div
                      key={lsn.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono text-[10px] text-slate-500 mr-1.5">
                          {lsn.order}.
                        </span>
                        <span className="font-semibold text-slate-200">{lsn.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                          ≥{lsn.passingCriteria.minAccuracy}% Acc
                        </span>
                        <button
                          onClick={() => {
                            setEditingLesson(lsn);
                            setEditMinAcc(lsn.passingCriteria.minAccuracy);
                            setEditMinWpm(lsn.passingCriteria.minWpm);
                            setEditDuration(lsn.passingCriteria.assessmentDuration || 60);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT PROGRESS & OVERRIDES */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search students by name or roll..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
            >
              <option value="all">All Classrooms</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-3.5">Student / Roll</th>
                  <th className="p-3.5">Progress</th>
                  <th className="p-3.5">Mastered</th>
                  <th className="p-3.5">Avg WPM</th>
                  <th className="p-3.5">Avg Accuracy</th>
                  <th className="p-3.5">Override Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-500 font-mono">
                      No student records match search filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(item => (
                    <tr key={item.student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-100">{item.student.name}</div>
                        <div className="text-[11px] font-mono text-emerald-400">{item.student.rollNo}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="w-28 bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden mb-1">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${item.completionPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.completionPercent}% Completed
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-200">
                        {item.masteredCount} / {item.totalCount}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">
                        {item.avgWpm} WPM
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className={`px-2 py-0.5 rounded ${
                          item.avgAcc >= 95
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {item.avgAcc}%
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() =>
                            handleToggleUnlockAll(item.student.id, Boolean(item.profile.trainerOverrideUnlockAll))
                          }
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                            item.profile.trainerOverrideUnlockAll
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {item.profile.trainerOverrideUnlockAll ? (
                            <>
                              <Unlock className="w-3 h-3 text-emerald-400" />
                              <span>Unlocked All</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>Sequential Lock</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-100 text-sm">Active Class Academy Assignments</h3>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Assignment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignmentsList.length === 0 ? (
              <div className="col-span-2 p-10 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 font-mono text-xs">
                No active academy assignments created yet. Click above to assign modules to classes.
              </div>
            ) : (
              assignmentsList.map(a => (
                <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {a.className}
                      </span>
                      <h4 className="font-bold text-slate-100 text-sm mt-1">{a.title}</h4>
                    </div>
                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block">Start Date:</span>
                      <span className="text-slate-300">{formatISTDateOnly(a.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Due Date:</span>
                      <span className="text-emerald-400 font-bold">{formatISTDateOnly(a.dueDate)}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-900 flex justify-between">
                      <span>Assigned Levels:</span>
                      <span className="text-slate-200">
                        {a.levelIds?.length ? `Levels ${a.levelIds.join(', ')}` : 'All Levels'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BENCHMARK EDIT MODAL */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                Customize Passing Criteria
              </span>
              <h3 className="text-lg font-black text-slate-100">{editingLesson.title}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Minimum Required Accuracy (%)
                </label>
                <input
                  type="number"
                  min={80}
                  max={100}
                  value={editMinAcc}
                  onChange={e => setEditMinAcc(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Minimum Required Speed (WPM)
                </label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={editMinWpm}
                  onChange={e => setEditMinWpm(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Assessment Duration (Seconds)
                </label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  value={editDuration}
                  onChange={e => setEditDuration(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingLesson(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLessonEdit}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors"
              >
                Save Benchmark Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <form
            onSubmit={handleCreateAssignment}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5"
          >
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                Class Curriculum Assignment
              </span>
              <h3 className="text-xl font-black text-slate-100">
                Assign Typing Academy Track
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={e => setAssignTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Target Class
                </label>
                <select
                  value={assignClassId}
                  onChange={e => setAssignClassId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Start Date (IST)
                  </label>
                  <input
                    type="date"
                    required
                    value={assignStartDate}
                    onChange={e => setAssignStartDate(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Due Date (IST)
                  </label>
                  <input
                    type="date"
                    required
                    value={assignDueDate}
                    onChange={e => setAssignDueDate(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors"
              >
                Assign to Class
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
