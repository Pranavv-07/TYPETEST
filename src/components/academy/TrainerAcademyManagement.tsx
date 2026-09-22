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
  saveLessonOverride
} from '../../services/academyService';
import {
  getStudentAcademyProfile,
  setTrainerOverrideUnlockAll,
  getAcademyAssignments,
  saveAcademyAssignment
} from '../../services/academyService';
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
  Calendar
} from 'lucide-react';

interface TrainerAcademyManagementProps {
  classes: ClassRoom[];
  students: Student[];
  trainerId: string;
}

export const TrainerAcademyManagement: React.FC<TrainerAcademyManagementProps> = ({
  classes,
  students,
  trainerId,
}) => {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'students' | 'assignments'>('curriculum');
  const [curriculum, setCurriculum] = useState<AcademyCurriculum>(() => getActiveCurriculum());

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
  const [assignTitle, setAssignTitle] = useState('Typing Academy — Beginner Track Assignment');
  const [assignLevels, setAssignLevels] = useState<number[]>([1, 2, 3]);
  const [assignDueDate, setAssignDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [assignmentsList, setAssignmentsList] = useState<AcademyAssignment[]>(() =>
    getAcademyAssignments()
  );

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

    const newAssignment = saveAcademyAssignment({
      title: assignTitle,
      classId: assignClassId,
      className: targetClass.name,
      trainerId,
      curriculumId: curriculum.id,
      levelIds: assignLevels,
      minWpm: 20,
      minAccuracy: 95,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: assignDueDate,
      status: 'active',
    });

    setAssignmentsList(getAcademyAssignments());
    setShowAssignModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Institutional Admin
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2 mt-1">
            <GraduationCap className="w-6 h-6 text-amber-400" />
            Typing Academy Curriculum & Class Management
          </h1>
          <p className="text-xs text-slate-400">
            Configure passing benchmarks, assign structured curriculums to classes, monitor struggling students, and manage unlock prerequisites.
          </p>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Assign to Class</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'curriculum'
              ? 'bg-amber-500 text-slate-950 font-black'
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
              ? 'bg-amber-500 text-slate-950 font-black'
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
              ? 'bg-amber-500 text-slate-950 font-black'
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
          <div className="grid grid-cols-1 gap-4">
            {curriculum.levels.map(level => (
              <div
                key={level.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                      Level {level.id}
                    </span>
                    <h3 className="text-lg font-black text-slate-100">
                      {level.title}
                    </h3>
                    <p className="text-xs text-slate-400">{level.description}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-500 self-start sm:self-auto">
                    {level.lessons.length} Lessons
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {level.lessons.map(lesson => (
                    <div
                      key={lesson.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between gap-3 shadow-inner"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                            Lesson {lesson.order}
                          </span>
                          <button
                            onClick={() => {
                              setEditingLesson(lesson);
                              setEditMinAcc(lesson.minAccuracy);
                              setEditMinWpm(lesson.minWpm);
                              setEditDuration(lesson.assessmentDuration);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
                            title="Edit passing criteria"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200">
                          {lesson.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {lesson.objective}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between font-mono text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-400" />
                          Min {lesson.minAccuracy}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-cyan-400" />
                          Min {lesson.minWpm} WPM
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {lesson.assessmentDuration}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS PROGRESS & OVERRIDES */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search students by name or roll number..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Classes ({classes.length})</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Students Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Roll Number</th>
                    <th className="p-4">Mastery Progress</th>
                    <th className="p-4">Speed & Acc</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Progression Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-sans">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(item => {
                      const isOverridden = item.profile.trainerOverrideUnlockAll;
                      return (
                        <tr key={item.student.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-bold text-slate-100">
                            {item.student.name}
                          </td>
                          <td className="p-4 font-mono text-slate-400">
                            {item.student.rollNo || 'N/A'}
                          </td>
                          <td className="p-4">
                            <div className="space-y-1 w-36">
                              <div className="flex justify-between font-mono text-[10px] text-slate-400">
                                <span>{item.masteredCount} / {item.totalCount} Lessons</span>
                                <span className="font-bold text-amber-400">{item.completionPercent}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{ width: `${item.completionPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono">
                            <span className="text-cyan-300 font-bold">{item.avgWpm} WPM</span>
                            <span className="text-slate-500 mx-1.5">•</span>
                            <span className="text-emerald-300 font-bold">{item.avgAcc}% Acc</span>
                          </td>
                          <td className="p-4">
                            {item.isStruggling ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" /> Needs Practice
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> On Track
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleToggleUnlockAll(item.student.id, isOverridden || false)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ml-auto ${
                                isOverridden
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {isOverridden ? (
                                <>
                                  <Unlock className="w-3 h-3 text-amber-400" />
                                  <span>Unlocked All</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Enforce Locks</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No students found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLASS ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignmentsList.map(assignment => (
              <div
                key={assignment.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Class Assignment
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Due: {assignment.dueDate}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-100">{assignment.title}</h3>
                  <p className="text-xs text-slate-400">Class: <strong className="text-slate-200">{assignment.className}</strong></p>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 font-mono text-xs flex items-center justify-between text-slate-400">
                  <span>Assigned Levels: <strong className="text-amber-300">Level {assignment.levelIds.join(', ')}</strong></span>
                  <span>Benchmark: <strong className="text-cyan-300">{assignment.minWpm} WPM</strong> / <strong className="text-emerald-300">{assignment.minAccuracy}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT LESSON CRITERIA MODAL */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
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
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
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
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
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
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
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
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors"
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
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
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
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Target Class
                </label>
                <select
                  value={assignClassId}
                  onChange={e => setAssignClassId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={assignDueDate}
                  onChange={e => setAssignDueDate(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                />
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
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors"
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
