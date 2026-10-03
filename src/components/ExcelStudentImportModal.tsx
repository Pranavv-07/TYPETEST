import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Student, ClassRoom, StudentImportSummary } from '../types';
import {
  downloadStudentImportTemplate,
  parseStudentSpreadsheet,
  exportImportErrorsToExcel,
  exportImportSummaryToExcel,
  ParsedStudentRow
} from '../utils/excelUtils';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Filter,
  Check,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';

interface ExcelStudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowedClasses?: ClassRoom[];
  defaultClassId?: string;
  onSuccess?: (summary: StudentImportSummary) => void;
}

export const ExcelStudentImportModal: React.FC<ExcelStudentImportModalProps> = ({
  isOpen,
  onClose,
  allowedClasses,
  defaultClassId,
  onSuccess
}) => {
  const { classes, students, bulkAddStudents, updateStudent, currentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter classes according to role / allowedClasses
  const effectiveClasses = allowedClasses && allowedClasses.length > 0
    ? allowedClasses
    : classes;

  const [selectedClassId, setSelectedClassId] = useState<string>(
    defaultClassId || (effectiveClasses[0]?.id ? effectiveClasses[0].id : 'auto')
  );

  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'reject'>('skip');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'valid' | 'warning' | 'error'>('all');
  const [importSummary, setImportSummary] = useState<StudentImportSummary | null>(null);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const classExportList = effectiveClasses.map(c => ({ id: c.id, name: c.name }));
    downloadStudentImportTemplate(classExportList, format);
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setImportSummary(null);

    try {
      const result = await parseStudentSpreadsheet(
        file,
        students,
        selectedClassId === 'auto' ? undefined : selectedClassId,
        effectiveClasses
      );
      setParsedRows(result.rows);
    } catch (err: any) {
      alert(`Error reading file: ${err.message || 'Please check that the file is a valid Excel or CSV spreadsheet.'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      processFile(file);
    }
  };

  const handleTargetClassChange = async (newClassId: string) => {
    setSelectedClassId(newClassId);
    if (selectedFile) {
      setIsParsing(true);
      try {
        const result = await parseStudentSpreadsheet(
          selectedFile,
          students,
          newClassId === 'auto' ? undefined : newClassId,
          effectiveClasses
        );
        setParsedRows(result.rows);
      } catch (err) {
        console.error(err);
      } finally {
        setIsParsing(false);
      }
    }
  };

  const validRows = parsedRows.filter(r => r.isValid && !r.isWarning);
  const warningRows = parsedRows.filter(r => r.isValid && r.isWarning);
  const errorRows = parsedRows.filter(r => !r.isValid);

  const filteredDisplayRows = parsedRows.filter(r => {
    if (activeFilter === 'valid') return r.isValid && !r.isWarning;
    if (activeFilter === 'warning') return r.isValid && r.isWarning;
    if (activeFilter === 'error') return !r.isValid;
    return true;
  });

  const handleDownloadErrors = () => {
    const errorList = errorRows.map(r => ({
      row: r.rowNumber,
      rollNo: r.rollNo,
      name: r.name,
      error: r.errors.join('; ')
    }));
    exportImportErrorsToExcel(errorList);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);

    try {
      const candidatesToImport: Omit<Student, 'id' | 'createdAt'>[] = [];
      const newlyAddedStudents: Student[] = [];
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const failedCount = errorRows.length;
      const errorList = errorRows.map(r => ({
        row: r.rowNumber,
        rollNo: r.rollNo,
        name: r.name,
        error: r.errors.join('; ')
      }));

      for (const row of parsedRows) {
        if (!row.isValid) continue;

        const existing = students.find(
          s => s.rollNo?.toUpperCase() === row.rollNo || (s.email && s.email.toLowerCase() === row.email.toLowerCase())
        );

        if (existing) {
          if (duplicateStrategy === 'update') {
            await updateStudent(existing.id, {
              name: row.name || existing.name,
              email: row.email || existing.email,
              classId: row.classId || existing.classId,
              password: row.password || existing.password,
              status: row.status || existing.status
            });
            updatedCount++;
            newlyAddedStudents.push({ ...existing, name: row.name, email: row.email, classId: row.classId });
          } else {
            // 'skip' or 'reject'
            skippedCount++;
          }
        } else {
          // Brand new student record
          candidatesToImport.push({
            rollNo: row.rollNo,
            name: row.name,
            email: row.email,
            classId: row.classId || (effectiveClasses[0]?.id || 'cls-python-aidev'),
            batch: row.batch || 'Batch 2024-28',
            password: row.password || '1234',
            status: row.status || 'active'
          });
          importedCount++;
        }
      }

      if (candidatesToImport.length > 0) {
        const added = await bulkAddStudents(candidatesToImport);
        if (added && added.length > 0) {
          newlyAddedStudents.push(...added);
        }
      }

      const summary: StudentImportSummary = {
        totalRows: parsedRows.length,
        importedCount,
        updatedCount,
        skippedCount,
        failedCount,
        errors: errorList,
        importedStudents: newlyAddedStudents
      };

      setImportSummary(summary);
      if (onSuccess) {
        onSuccess(summary);
      }
    } catch (err: any) {
      alert(`Bulk import failed: ${err.message || 'Please check database connection.'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setImportSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[94vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                Bulk Student Roster Ingestion
              </h2>
              <p className="text-xs text-slate-400">
                Upload official Excel (.xlsx) or CSV rosters mapped to classes and training sections.
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {!importSummary ? (
            <>
              {/* Step 1 & Class Assignment Strip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Class Dropdown */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Target Class / Section</span>
                    </label>
                    <span className="text-[10px] text-emerald-400/80 font-mono">Class Dropdown</span>
                  </div>
                  <select
                    value={selectedClassId}
                    onChange={e => handleTargetClassChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="auto">Auto-detect from 'Class / Batch' Column</option>
                    {effectiveClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Select a fixed class for all rows (e.g. <strong className="text-emerald-300">Python_AIDEV</strong>) or let TYPETEST map automatically per row.
                  </p>
                </div>

                {/* Download Standard Template Button */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>Formatted Templates</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Pre-filled with Classes</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Download our ready-to-use template pre-configured with Python_AIDEV and active classes.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Excel (.xlsx)</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTemplate('csv')}
                      className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>CSV (.csv)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Drag and Drop Upload Area */}
              {!selectedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                      : 'border-slate-800 hover:border-emerald-500/50 bg-slate-950/60 hover:bg-slate-950'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mb-1">
                    Drag and drop your student roster here
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Supports <strong className="text-slate-300">.xlsx</strong>, <strong className="text-slate-300">.xls</strong>, and <strong className="text-slate-300">.csv</strong> files
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                  >
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Metadata Bar */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                          <span>{selectedFile.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {parsedRows.length} total rows detected
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReset}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Change File
                      </button>
                    </div>
                  </div>

                  {/* Validation Counters Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        activeFilter === 'all'
                          ? 'bg-slate-800/80 border-slate-600 text-slate-100'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Total Records</div>
                      <div className="text-xl font-bold font-mono text-slate-100">{parsedRows.length}</div>
                    </button>

                    <button
                      onClick={() => setActiveFilter('valid')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        activeFilter === 'valid'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready (New)</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-emerald-400">{validRows.length}</div>
                    </button>

                    <button
                      onClick={() => setActiveFilter('warning')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        activeFilter === 'warning'
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase font-bold text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Existing in DB</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-amber-400">{warningRows.length}</div>
                    </button>

                    <button
                      onClick={() => setActiveFilter('error')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        activeFilter === 'error'
                          ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase font-bold text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>Invalid / Errors</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-rose-400">{errorRows.length}</div>
                    </button>
                  </div>

                  {/* Duplicate Strategy Configuration */}
                  {warningRows.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Duplicate / Existing Student Resolution ({warningRows.length} detected)</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="strategy"
                            checked={duplicateStrategy === 'skip'}
                            onChange={() => setDuplicateStrategy('skip')}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <span>Skip existing students (Safe)</span>
                        </label>
                        <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="strategy"
                            checked={duplicateStrategy === 'update'}
                            onChange={() => setDuplicateStrategy('update')}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <span>Update existing student details & class</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Row by Row Preview Table */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-300">
                        Showing {filteredDisplayRows.length} of {parsedRows.length} Rows
                      </span>
                      {errorRows.length > 0 && (
                        <button
                          onClick={handleDownloadErrors}
                          className="text-[11px] font-mono font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Error Report ({errorRows.length})</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Row</th>
                            <th className="py-2.5 px-3">Roll Number</th>
                            <th className="py-2.5 px-3">Candidate Name</th>
                            <th className="py-2.5 px-3">Class</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Details / Validation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 font-sans">
                          {filteredDisplayRows.map((row) => (
                            <tr
                              key={row.rowNumber}
                              className={`hover:bg-slate-900/50 transition-colors ${
                                !row.isValid
                                  ? 'bg-rose-500/5'
                                  : row.isWarning
                                  ? 'bg-amber-500/5'
                                  : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono text-slate-500">{row.rowNumber}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-100">
                                {row.rollNo || <span className="text-rose-400">EMPTY</span>}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-200">
                                {row.name || <span className="text-rose-400">EMPTY</span>}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-emerald-400">
                                {row.className}
                              </td>
                              <td className="py-2.5 px-3">
                                {!row.isValid ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                                    <XCircle className="w-2.5 h-2.5" />
                                    <span>Invalid</span>
                                  </span>
                                ) : row.isWarning ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>Existing</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Valid</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-[11px]">
                                {!row.isValid ? (
                                  <span className="text-rose-400 font-mono">{row.errors.join(', ')}</span>
                                ) : row.isWarning ? (
                                  <span className="text-amber-400/90 font-mono">{row.warningReason}</span>
                                ) : (
                                  <span className="text-slate-400 font-mono">Ready to insert</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Step 3: Success Summary Screen */
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="p-6 bg-slate-950 border border-emerald-500/40 rounded-3xl text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-100">
                    Bulk Roster Ingestion Complete
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Students have been securely registered, assigned to their respective classes, and are immediately eligible for typing assessments.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Processed</div>
                    <div className="text-xl font-bold font-mono text-slate-200">{importSummary.totalRows}</div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                    <div className="text-[10px] font-mono text-emerald-400 uppercase">Imported New</div>
                    <div className="text-xl font-bold font-mono text-emerald-400">{importSummary.importedCount}</div>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                    <div className="text-[10px] font-mono text-amber-400 uppercase">Updated</div>
                    <div className="text-xl font-bold font-mono text-amber-400">{importSummary.updatedCount}</div>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Skipped</div>
                    <div className="text-xl font-bold font-mono text-slate-300">{importSummary.skippedCount}</div>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => exportImportSummaryToExcel(importSummary)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download Execution Report (.xlsx)</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    Done & View Roster
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!importSummary && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-mono">
              {parsedRows.length > 0 ? (
                <span>
                  Ready to commit: <strong className="text-emerald-400">{validRows.length + (duplicateStrategy === 'update' ? warningRows.length : 0)}</strong> student records
                </span>
              ) : (
                <span>Upload a spreadsheet to inspect candidates</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {parsedRows.length > 0 && (
                <button
                  type="button"
                  disabled={isImporting || (validRows.length === 0 && (duplicateStrategy !== 'update' || warningRows.length === 0))}
                  onClick={handleExecuteImport}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingesting Roster...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        Import {validRows.length + (duplicateStrategy === 'update' ? warningRows.length : 0)} Valid Students
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
