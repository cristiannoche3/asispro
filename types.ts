

export enum ScreenView {
  DAILY_SUMMARY, 
  MAIN_MENU,
  MANAGE_GRADES,
  ADD_STUDENTS,
  TAKE_ATTENDANCE,
  ATTENDANCE_REPORTS,
  CONFIGURE_PERIODS,
  VIEW_SAVED_ATTENDANCE, // New screen for viewing/editing saved attendance
  ABSENTEEISM_REPORT, // New screen for absenteeism report
  BULK_UPLOAD_COURSES, // New screen for bulk upload of courses and students
  COMPUTER_REPORTS_HUB, // New: Hub for computer reports
  COMPUTER_USAGE_BY_GRADE_REPORT, // New: Reporte de Computadores Usados – Por Grado
  COMPUTER_USAGE_GENERAL_REPORT, // New: Reporte General por Computadores – Todos los Grados
}

export interface Grade {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
  gradeId: string;
  document?: string;
  assignedComputer: number; // New field: Assigned computer number
}

export interface Period {
  id: string;
  name: string;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT_UNEXCUSED = 'ABSENT_UNEXCUSED',
  ABSENT_EXCUSED = 'ABSENT_EXCUSED',
  SICK_BAY = 'SICK_BAY',
}

export interface AttendanceRecord {
  id: string; // studentId_date_periodId
  studentId: string;
  gradeId: string;
  date: string; // YYYY-MM-DD
  periodId: string;
  classHours: number[]; // Changed from classHour: number
  status: AttendanceStatus;
  usedComputer: number; // New field: Computer used on the day of attendance
}

export interface ReportData {
  name: string;
  value: number; // Represents count of sessions/records, not physical hours
  fill?: string;
}

export interface AppAlert {
  id: string; // Unique identifier, e.g., studentId_unexcused_alert_count
  studentId: string;
  studentName: string;
  gradeName: string;
  unexcusedAbsenceCount: number;
  lastUnexcusedAbsenceDate: string; // YYYY-MM-DD
  message: string;
  createdAt: number; // Timestamp
}