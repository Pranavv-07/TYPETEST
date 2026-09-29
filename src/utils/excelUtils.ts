import * as XLSX from 'xlsx';
import { Student, Trainer, TypingSubmission, TestReport } from '../types';
import { formatISTDateTime } from './dateUtils';

/**
 * Download a standard formatted Excel Template for importing students
 */
export function downloadStudentImportTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const headers = [
    {
      'Roll Number': '24B11CS355',
      'Full Name': 'Pranav Vedula',
      'Email': 'vedulapranav@gmail.com',
      'Batch': 'Batch 2024-28',
      'Section': 'A',
      'Department': 'Computer Science & Engineering',
      'Year': '2nd Year',
      'Trainer Name': 'Pavan B',
      'Password': '1234',
      'Status': 'active'
    },
    {
      'Roll Number': '24B11CS101',
      'Full Name': 'Aarav Sharma',
      'Email': 'aarav.sharma@aditya.ac.in',
      'Batch': 'Batch 2024-28',
      'Section': 'A',
      'Department': 'Computer Science & Engineering',
      'Year': '2nd Year',
      'Trainer Name': 'Pavan B',
      'Password': '1234',
      'Status': 'active'
    },
    {
      'Roll Number': '24B11AI201',
      'Full Name': 'Ananya Rao',
      'Email': 'ananya.rao@aditya.ac.in',
      'Batch': 'Batch 2024-28',
      'Section': 'B',
      'Department': 'Artificial Intelligence & Machine Learning',
      'Year': '2nd Year',
      'Trainer Name': 'Pavan B',
      'Password': '1234',
      'Status': 'active'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(headers);
  // Set column widths for clean appearance
  ws['!cols'] = [
    { wch: 16 }, // Roll Number
    { wch: 22 }, // Full Name
    { wch: 28 }, // Email
    { wch: 16 }, // Batch
    { wch: 10 }, // Section
    { wch: 36 }, // Department
    { wch: 12 }, // Year
    { wch: 18 }, // Trainer Name
    { wch: 12 }, // Password
    { wch: 10 }  // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Student_Import_Template');

  if (format === 'csv') {
    XLSX.writeFile(wb, 'Student_Import_Template.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, 'Student_Import_Template.xlsx', { bookType: 'xlsx' });
  }
}

export interface ParsedStudentRow {
  rollNo: string;
  name: string;
  email: string;
  batch: string;
  section?: string;
  department?: string;
  trainerName?: string;
  password?: string;
  status: 'active' | 'inactive';
  isValid: boolean;
  errors: string[];
}

/**
 * Parse an uploaded Excel or CSV file buffer/array
 */
export async function parseStudentSpreadsheet(file: File): Promise<{
  rows: ParsedStudentRow[];
  totalCount: number;
  validCount: number;
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

        const rows: ParsedStudentRow[] = rawJson.map((row) => {
          // Normalize column keys (case-insensitive & trim)
          const findKey = (...possibleKeys: string[]) => {
            const foundKey = Object.keys(row).find(k =>
              possibleKeys.some(pk => k.trim().toLowerCase() === pk.trim().toLowerCase())
            );
            return foundKey ? String(row[foundKey]).trim() : '';
          };

          const rollNo = findKey('Roll Number', 'Roll No', 'RollNo', 'Roll', 'Registration No', 'RegNo', 'Student ID');
          const name = findKey('Full Name', 'Name', 'Student Name', 'Candidate Name');
          const email = findKey('Email', 'Email ID', 'Mail', 'Mail ID');
          const batch = findKey('Batch', 'Batch Year', 'Academic Batch', 'Class') || 'Batch 2024-28';
          const section = findKey('Section', 'Sec', 'Class Section');
          const department = findKey('Department', 'Dept', 'Branch') || 'Computer Science & Engineering';
          const trainerName = findKey('Trainer Name', 'Trainer', 'Faculty', 'Mentor') || 'Pavan B';
          const password = findKey('Password', 'Pass') || '1234';
          const rawStatus = findKey('Status', 'Active Status');
          const status: 'active' | 'inactive' = rawStatus.toLowerCase() === 'inactive' ? 'inactive' : 'active';

          const errors: string[] = [];
          if (!rollNo) errors.push('Missing Roll Number');
          if (!name) errors.push('Missing Full Name');

          return {
            rollNo: rollNo.toUpperCase(),
            name,
            email: email || `${rollNo.toLowerCase()}@aditya.ac.in`,
            batch,
            section,
            department,
            trainerName,
            password,
            status,
            isValid: errors.length === 0,
            errors
          };
        }).filter(r => r.rollNo || r.name); // Ignore blank rows

        const validCount = rows.filter(r => r.isValid).length;
        resolve({
          rows,
          totalCount: rows.length,
          validCount,
          invalidCount: rows.length - validCount
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
 * Export Students roster to Excel (.xlsx)
 */
export function exportStudentsToExcel(students: Student[], filename = 'Students_Roster.xlsx') {
  const data = students.map((s, idx) => ({
    'S.No': idx + 1,
    'Roll Number': s.rollNo,
    'Full Name': s.name,
    'Email': s.email || '—',
    'Batch': s.batch || 'Batch 2024-28',
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
