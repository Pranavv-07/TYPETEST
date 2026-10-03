import * as XLSX from 'xlsx';
import { Student, ClassRoom, TypingSubmission, StudentImportSummary } from '../types';
import { formatISTDateTime } from './dateUtils';

export interface ParsedStudentRow {
  rowNumber: number;
  rollNo: string;
  name: string;
  email: string;
  className: string;
  classId?: string;
  batch?: string;
  password?: string;
  status: 'active' | 'inactive';
  isValid: boolean;
  isWarning?: boolean;
  warningReason?: string;
  errors: string[];
}

/**
 * Download standard formatted Excel / CSV Template for importing students by Class
 */
export function downloadStudentImportTemplate(
  availableClasses: { id: string; name: string }[] = [
    { id: 'cls-python-aidev', name: 'Python_AIDEV' },
    { id: 'cls-cse-a', name: 'CSE Alpha (2024-28)' },
    { id: 'cls-aiml-b', name: 'AIML Beta (2024-28)' },
    { id: 'cls-ds-d', name: 'Data Science Delta (2024-28)' }
  ],
  format: 'xlsx' | 'csv' = 'xlsx'
) {
  const sampleData = [
    {
      'Roll Number': '24B11CS355',
      'Full Name': 'Pranav Vedula',
      'Email': 'vedulapranav@gmail.com',
      'Class / Batch': availableClasses[0]?.name || 'Python_AIDEV',
      'Password': '1234',
      'Status': 'active'
    },
    {
      'Roll Number': '24B11CS101',
      'Full Name': 'Aarav Sharma',
      'Email': 'aarav.sharma@example.com',
      'Class / Batch': availableClasses[1]?.name || 'CSE Alpha (2024-28)',
      'Password': '1234',
      'Status': 'active'
    },
    {
      'Roll Number': '24B11AI201',
      'Full Name': 'Ananya Rao',
      'Email': 'ananya.rao@example.com',
      'Class / Batch': availableClasses[2]?.name || 'AIML Beta (2024-28)',
      'Password': '1234',
      'Status': 'active'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  ws['!cols'] = [
    { wch: 18 }, // Roll Number
    { wch: 24 }, // Full Name
    { wch: 28 }, // Email
    { wch: 26 }, // Class / Batch
    { wch: 14 }, // Password
    { wch: 12 }  // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Student_Import_Template');

  // Also include Available Classes reference sheet in xlsx
  if (format === 'xlsx') {
    const classReferenceData = availableClasses.map(c => ({
      'Class Name': c.name,
      'Class ID': c.id
    }));
    const classWs = XLSX.utils.json_to_sheet(classReferenceData);
    classWs['!cols'] = [{ wch: 28 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, classWs, 'Available_Classes');
  }

  const filename = `TYPETEST_Student_Import_Template.${format}`;
  if (format === 'csv') {
    XLSX.writeFile(wb, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
  }
}

/**
 * Parse and validate an uploaded Excel / CSV file
 */
export async function parseStudentSpreadsheet(
  file: File,
  existingStudents: Student[] = [],
  targetClassId?: string,
  classList: ClassRoom[] = []
): Promise<{
  rows: ParsedStudentRow[];
  totalCount: number;
  validCount: number;
  warningCount: number;
  invalidCount: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const seenRolls = new Set<string>();
        const seenEmails = new Set<string>();

        const rows: ParsedStudentRow[] = rawJson
          .map((row, index) => {
            const rowNumber = index + 2; // header is row 1

            // Normalize column lookups
            const findKey = (...possibleKeys: string[]) => {
              const foundKey = Object.keys(row).find(k =>
                possibleKeys.some(pk => k.trim().toLowerCase() === pk.trim().toLowerCase())
              );
              return foundKey ? String(row[foundKey]).trim() : '';
            };

            const rollNo = findKey(
              'Roll Number',
              'Roll No',
              'RollNo',
              'Roll',
              'Student ID',
              'Registration No',
              'RegNo'
            ).trim().toUpperCase();

            const name = findKey(
              'Full Name',
              'Name',
              'Student Name',
              'Candidate Name'
            ).trim();

            const rawEmail = findKey('Email', 'Email ID', 'Mail', 'Mail ID').trim();
            const rawClass = findKey('Class / Batch', 'Class', 'ClassName', 'Class Name', 'Batch', 'Section').trim();
            const password = findKey('Password', 'Pass', 'Pin') || '1234';
            const rawStatus = findKey('Status', 'Active Status').trim().toLowerCase();
            const status: 'active' | 'inactive' = rawStatus === 'inactive' ? 'inactive' : 'active';

            // Resolve Class
            let resolvedClassId = targetClassId && targetClassId !== 'auto' ? targetClassId : undefined;
            let resolvedClassName = rawClass || 'Default Class';

            if (!resolvedClassId && rawClass) {
              const matchedClass = classList.find(c =>
                c.name.toLowerCase() === rawClass.toLowerCase() ||
                c.id.toLowerCase() === rawClass.toLowerCase()
              );
              if (matchedClass) {
                resolvedClassId = matchedClass.id;
                resolvedClassName = matchedClass.name;
              }
            }

            if (!resolvedClassId && classList.length > 0) {
              resolvedClassId = classList[0].id;
              resolvedClassName = classList[0].name;
            }

            const email = rawEmail || (rollNo ? `${rollNo.toLowerCase()}@typetest.edu` : '');

            // Validation rules
            const errors: string[] = [];
            let isWarning = false;
            let warningReason = '';

            if (!rollNo) {
              errors.push('Missing Roll Number / Student ID');
            } else if (!/^[A-Za-z0-9_-]{2,30}$/.test(rollNo)) {
              errors.push('Invalid Roll Number format (allowed: letters, numbers, -, _)');
            } else if (seenRolls.has(rollNo)) {
              errors.push(`Duplicate Roll Number '${rollNo}' in file`);
            } else {
              seenRolls.add(rollNo);
            }

            if (!name) {
              errors.push('Missing Full Name');
            } else if (name.length < 2) {
              errors.push('Full Name must be at least 2 characters');
            }

            if (rawEmail) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(rawEmail)) {
                errors.push('Invalid Email format');
              } else if (seenEmails.has(rawEmail.toLowerCase())) {
                errors.push(`Duplicate Email '${rawEmail}' in file`);
              } else {
                seenEmails.add(rawEmail.toLowerCase());
              }
            }

            // Check if student already exists in system
            if (rollNo && errors.length === 0) {
              const existing = existingStudents.find(
                s => s.rollNo?.toUpperCase() === rollNo || (s.email && s.email.toLowerCase() === email.toLowerCase())
              );
              if (existing) {
                isWarning = true;
                warningReason = `Student already exists in database as '${existing.name}' (${existing.rollNo})`;
              }
            }

            return {
              rowNumber,
              rollNo,
              name,
              email,
              className: resolvedClassName,
              classId: resolvedClassId,
              batch: 'Batch 2024-28',
              password,
              status,
              isValid: errors.length === 0,
              isWarning,
              warningReason,
              errors
            };
          })
          .filter(r => r.rollNo || r.name); // Filter out completely empty rows

        const validCount = rows.filter(r => r.isValid && !r.isWarning).length;
        const warningCount = rows.filter(r => r.isValid && r.isWarning).length;
        const invalidCount = rows.filter(r => !r.isValid).length;

        resolve({
          rows,
          totalCount: rows.length,
          validCount: validCount + warningCount,
          warningCount,
          invalidCount
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export Error Report to Excel
 */
export function exportImportErrorsToExcel(
  errors: { row: number; rollNo: string; name: string; error: string }[],
  filename = 'Student_Import_Rejection_Report.xlsx'
) {
  const data = errors.map(e => ({
    'Spreadsheet Row': e.row,
    'Roll Number / Student ID': e.rollNo || 'N/A',
    'Full Name': e.name || 'N/A',
    'Validation Failure Reason': e.error,
    'Status': 'REJECTED'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 24 },
    { wch: 48 },
    { wch: 14 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import_Errors');
  XLSX.writeFile(wb, filename);
}

/**
 * Export Import Summary Report to Excel
 */
export function exportImportSummaryToExcel(
  summary: StudentImportSummary,
  filename = 'Student_Import_Execution_Report.xlsx'
) {
  const summarySheetData = [
    { Metric: 'Total Rows Processed', Value: summary.totalRows },
    { Metric: 'Successfully Imported New Students', Value: summary.importedCount },
    { Metric: 'Updated Existing Students', Value: summary.updatedCount },
    { Metric: 'Skipped Existing Records', Value: summary.skippedCount },
    { Metric: 'Failed / Rejected Rows', Value: summary.failedCount },
    { Metric: 'Report Generated At', Value: formatISTDateTime(new Date().toISOString()) }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
  wsSummary['!cols'] = [{ wch: 36 }, { wch: 24 }];

  const rosterData = summary.importedStudents.map((s, idx) => ({
    'S.No': idx + 1,
    'Roll Number': s.rollNo,
    'Full Name': s.name,
    'Email': s.email || '—',
    'Class ID': s.classId || '—',
    'Status': s.status || 'active',
    'Imported At (IST)': formatISTDateTime(s.createdAt)
  }));

  const wsRoster = XLSX.utils.json_to_sheet(rosterData);
  wsRoster['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 24 },
    { wch: 28 },
    { wch: 18 },
    { wch: 12 },
    { wch: 22 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Import_Summary');
  XLSX.utils.book_append_sheet(wb, wsRoster, 'Imported_Roster');

  if (summary.errors.length > 0) {
    const errorData = summary.errors.map(e => ({
      'Row': e.row,
      'Roll Number': e.rollNo,
      'Name': e.name,
      'Reason': e.error
    }));
    const wsErrors = XLSX.utils.json_to_sheet(errorData);
    wsErrors['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 24 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsErrors, 'Rejected_Rows');
  }

  XLSX.writeFile(wb, filename);
}

/**
 * Export Students roster to Excel (.xlsx)
 */
export function exportStudentsToExcel(students: Student[], filename = 'Students_Roster.xlsx') {
  const data = students.map((s, idx) => ({
    'S.No': idx + 1,
    'Roll Number': s.rollNo,
    'Full Name': s.name,
    'Email': s.email || '—',
    'Class ID': s.classId || '—',
    'Status': s.status || 'active',
    'Password': s.password || '1234',
    'Joined Date (IST)': formatISTDateTime(s.createdAt)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 24 },
    { wch: 28 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 24 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  XLSX.writeFile(wb, filename);
}

/**
 * Export Test Submissions to Excel (.xlsx)
 */
export function exportSubmissionsToExcel(submissions: TypingSubmission[], filename = 'Typing_Submissions_Report.xlsx') {
  const data = submissions.map((sub, idx) => ({
    'S.No': idx + 1,
    'Submission ID': sub.id,
    'Student Roll No': sub.rollNo || '—',
    'Student Name': sub.studentName || '—',
    'Class': sub.className || '—',
    'Test Title': sub.testTitle || '—',
    'Net WPM': sub.netWpm || sub.wpm,
    'Gross WPM': sub.rawWpm || sub.wpm,
    'Accuracy (%)': `${sub.accuracy}%`,
    'Error Count': sub.errors ?? 0,
    'Result Status': sub.passed ? 'PASSED' : 'NEEDS PRACTICE',
    'Submitted At (IST)': formatISTDateTime(sub.timestamp)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
    { wch: 32 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 24 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Submissions');
  XLSX.writeFile(wb, filename);
}
