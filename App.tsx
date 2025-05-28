
import React, { useState, useCallback, useEffect } from 'react';
import { ScreenView, Grade, Student, Period, AttendanceRecord, AttendanceStatus, AppAlert } from './types';
import { DEFAULT_PERIODS, AUTHOR_NAME, INSTITUTIONAL_COLORS, ALERT_THRESHOLD_UNEXCUSED_ABSENCES, APP_TITLE } from './constants'; // Added APP_TITLE
import useLocalStorage from './hooks/useLocalStorage';

import Header from './components/Header';
import Footer from './components/Footer';
import MainMenu from './components/MainMenu';
import ManageGradesScreen from './components/ManageGradesScreen';
import AddStudentsScreen from './components/AddStudentsScreen'; // Correct relative import
import TakeAttendanceScreen from './components/TakeAttendanceScreen';
import ConfigurePeriodsScreen from './components/ConfigurePeriodsScreen';
import AttendanceReportsScreen from './components/AttendanceReportsScreen';
import DailySummaryScreen from './components/DailySummaryScreen';
import ViewSavedAttendanceScreen from './components/ViewSavedAttendanceScreen';
import AbsenteeismReportScreen from './components/AbsenteeismReportScreen';
import BulkUploadScreen from './components/BulkUploadScreen';
import ComputerReportsHubScreen from './components/ComputerReportsHubScreen'; // New Hub
import ComputerUsageByGradeReportScreen from './components/ComputerUsageByGradeReportScreen';
import ComputerUsageGeneralReportScreen from './components/ComputerUsageGeneralReportScreen';
import AsiBot from './components/AsiBot'; // Import AsiBot
import LoginScreen from './components/LoginScreen'; // Import LoginScreen
import Modal from './components/Modal'; // Import Modal for logout confirmation
import Button from './components/Button'; // Import Button for Modal footer

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true); // State for splash screen
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('app_is_authenticated', false);
  const [currentView, _setCurrentView] = useLocalStorage<ScreenView>('app_current_view', ScreenView.DAILY_SUMMARY);
  const [historyStack, setHistoryStack] = useLocalStorage<ScreenView[]>('app_history_stack', []);

  const [grades, setGrades] = useLocalStorage<Grade[]>('app_grades', []);
  const [students, setStudents] = useLocalStorage<Student[]>('app_students', []);
  const [periods, setPeriods] = useLocalStorage<Period[]>('app_periods', DEFAULT_PERIODS);
  const [activePeriodId, setActivePeriodId] = useLocalStorage<string | null>('app_active_period_id', DEFAULT_PERIODS.length > 0 ? DEFAULT_PERIODS[0].id : null);
  const [attendanceRecords, setAttendanceRecords] = useLocalStorage<AttendanceRecord[]>('app_attendance_records', []);

  const [attendanceToEdit, setAttendanceToEdit] = useState<AttendanceRecord | null>(null);
  const [initialTakeAttendanceContext, setInitialTakeAttendanceContext] = useState<{ gradeId: string; date: string } | null>(null);
  const [recentlySavedContexts, setRecentlySavedContexts] = useState<Set<string>>(new Set());

  // Alert System State
  const [activeAlerts, setActiveAlerts] = useLocalStorage<AppAlert[]>('app_active_alerts', []);
  const [dismissedAlertIds, setDismissedAlertIds] = useLocalStorage<Set<string>>('app_dismissed_alert_ids', new Set());

  // AsiBot State
  const [isAsiBotOpen, setIsAsiBotOpen] = useState(false);

  // Logout Confirmation State
  const [isLogoutConfirmModalOpen, setIsLogoutConfirmModalOpen] = useState(false);

  const openAsiBot = useCallback(() => setIsAsiBotOpen(true), []);
  const closeAsiBot = useCallback(() => setIsAsiBotOpen(false), []);


  useEffect(() => {
    // Simulate loading time for the splash screen
    const timer = setTimeout(() => setIsLoading(false), 2500); // Display splash for 2.5 seconds
    return () => clearTimeout(timer);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
  }, [setIsAuthenticated]);

  // Logout functions
  const openLogoutConfirmModal = useCallback(() => {
    setIsLogoutConfirmModalOpen(true);
  }, []);

  const closeLogoutConfirmModal = useCallback(() => {
    setIsLogoutConfirmModalOpen(false);
  }, []);

  const executeLogout = useCallback(() => {
    setIsAuthenticated(false);
    _setCurrentView(ScreenView.DAILY_SUMMARY); // Reset to a default view
    setHistoryStack([]);
    // Potentially clear other sensitive data here if needed
    closeLogoutConfirmModal();
  }, [setIsAuthenticated, _setCurrentView, setHistoryStack, closeLogoutConfirmModal]);


  // Alert Calculation Logic
  useEffect(() => {
    const newAlerts: AppAlert[] = [];
    const studentAbsenceData: Record<string, { count: number, lastDate: string }> = {};

    attendanceRecords.forEach(record => {
      if (record.status === AttendanceStatus.ABSENT_UNEXCUSED) {
        if (!studentAbsenceData[record.studentId]) {
          studentAbsenceData[record.studentId] = { count: 0, lastDate: '' };
        }
        studentAbsenceData[record.studentId].count++;
        if (record.date > studentAbsenceData[record.studentId].lastDate) {
          studentAbsenceData[record.studentId].lastDate = record.date;
        }
      }
    });

    students.forEach(student => {
      const absenceInfo = studentAbsenceData[student.id];
      if (absenceInfo && absenceInfo.count >= ALERT_THRESHOLD_UNEXCUSED_ABSENCES) {
        const grade = grades.find(g => g.id === student.gradeId);
        const alertId = `${student.id}_unexcused_${absenceInfo.count}`; // ID considers the count for uniqueness

        if (!dismissedAlertIds.has(alertId)) {
          newAlerts.push({
            id: alertId,
            studentId: student.id,
            studentName: student.name,
            gradeName: grade?.name || 'N/A',
            unexcusedAbsenceCount: absenceInfo.count,
            lastUnexcusedAbsenceDate: absenceInfo.lastDate,
            message: `${student.name} (${grade?.name || 'N/A'}) tiene ${absenceInfo.count} inasistencias injustificadas.`,
            createdAt: Date.now(),
          });
        }
      }
    });

    // Sort alerts by creation time (newest first) or by absence count
    newAlerts.sort((a, b) => b.unexcusedAbsenceCount - a.unexcusedAbsenceCount || b.createdAt - a.createdAt);
    setActiveAlerts(newAlerts);
  }, [attendanceRecords, students, grades, dismissedAlertIds, setActiveAlerts]);

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlertIds(prev => {
      const newSet = new Set(prev);
      newSet.add(alertId);
      return newSet;
    });
    // The useEffect for alert calculation will handle removing it from activeAlerts
  }, [setDismissedAlertIds]);


  const markContextAsSaved = useCallback((contextKey: string) => {
    setRecentlySavedContexts(prev => new Set(prev).add(contextKey));
  }, []);

  const consumeSavedContext = useCallback((contextKey: string) => {
    setRecentlySavedContexts(prev => {
      const newSet = new Set(prev);
      newSet.delete(contextKey);
      return newSet;
    });
  }, []);

  useEffect(() => {
    if (!activePeriodId && periods.length > 0) {
      setActivePeriodId(periods[0].id);
    }
  }, [periods, activePeriodId, setActivePeriodId]);

  const setCurrentViewHandler = useCallback((view: ScreenView) => {
    if (view === currentView) {
        if (view === ScreenView.DAILY_SUMMARY && currentView === ScreenView.DAILY_SUMMARY) {
            // setHistoryStack([]);
        }
        if (view === currentView && view !== ScreenView.DAILY_SUMMARY) return;
    }

    if (view === ScreenView.DAILY_SUMMARY) {
        if (currentView !== ScreenView.DAILY_SUMMARY) {
            setHistoryStack(prev => [...prev, currentView]);
        } else {
            setHistoryStack([]);
        }
    } else {
        setHistoryStack(prev => [...prev, currentView]);
    }
    _setCurrentView(view);
  }, [currentView, _setCurrentView, setHistoryStack]);

  const goBack = useCallback(() => {
    if (historyStack.length > 0) {
      const previousView = historyStack[historyStack.length - 1];
      setHistoryStack(prev => prev.slice(0, -1));
      _setCurrentView(previousView);
    } else {
      _setCurrentView(ScreenView.DAILY_SUMMARY);
    }
  }, [historyStack, setHistoryStack, _setCurrentView]);


  const addGrade = useCallback((name: string): string => { // Modified to return string (ID)
    const newGrade = { id: generateId(), name };
    setGrades(prev => [...prev, newGrade]);
    return newGrade.id; // Return the ID of the new grade
  }, [setGrades]);

  const editGrade = useCallback((id: string, newName: string) => {
    setGrades(prev => prev.map(g => g.id === id ? { ...g, name: newName } : g));
  }, [setGrades]);

  const deleteGrade = useCallback((id: string) => {
    setGrades(prev => prev.filter(g => g.id !== id));
    setStudents(prev => prev.filter(s => s.gradeId !== id));
    // Attendance records are handled by validation in ManageGradesScreen
    // or if cascading delete is implemented:
    // setAttendanceRecords(prev => prev.filter(ar => ar.gradeId !== id));
  }, [setGrades, setStudents]);

  const addStudent = useCallback((name: string, gradeId: string, assignedComputer: number, document?: string): Student | null => {
    if (!name.trim() || !gradeId || assignedComputer < 1 || assignedComputer > 35) return null;
    const newStudent = { id: generateId(), name: name.trim(), gradeId, assignedComputer, document: document?.trim() };
    setStudents(prev => [...prev, newStudent]);
    return newStudent;
  }, [setStudents]);

  const addStudentsBatch = useCallback((studentsData: { name: string; document?: string; assignedComputer: number }[], gradeId: string) => {
    const newStudents: Student[] = studentsData
        .filter(sd => sd.name && sd.name.trim() !== "" && sd.assignedComputer >= 1 && sd.assignedComputer <= 35)
        .map(sd => ({
            id: generateId(),
            name: sd.name.trim(),
            document: sd.document?.trim(),
            assignedComputer: sd.assignedComputer,
            gradeId,
        }));
    setStudents(prev => [...prev, ...newStudents]);
  }, [setStudents]);

  const editStudent = useCallback((id: string, newName: string, newAssignedComputer: number, newDocument?: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, name: newName.trim(), assignedComputer: newAssignedComputer, document: newDocument?.trim() } : s));
  }, [setStudents]);

  const changeStudentGrade = useCallback((studentId: string, newGradeId: string) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? { ...student, gradeId: newGradeId }
          : student
      )
    );
  }, [setStudents]);

  const deleteStudent = useCallback((id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setAttendanceRecords(prev => prev.filter(ar => ar.studentId !== id));
  }, [setStudents, setAttendanceRecords]);

  const addPeriod = useCallback((name: string) => {
    const newPeriod = { id: generateId(), name };
    setPeriods(prev => [...prev, newPeriod]);
    if (!activePeriodId) {
      setActivePeriodId(newPeriod.id);
    }
  }, [setPeriods, activePeriodId, setActivePeriodId]);

  const saveAttendanceRecord = useCallback((recordToSave: AttendanceRecord) => {
    setAttendanceRecords(prevRecords => {
      const index = prevRecords.findIndex(r => r.id === recordToSave.id);
      if (index !== -1) {
        const updatedRecords = [...prevRecords];
        updatedRecords[index] = recordToSave;
        return updatedRecords;
      } else {
        return [...prevRecords, recordToSave];
      }
    });
  }, [setAttendanceRecords]);

  const deleteAttendanceRecord = useCallback((recordId: string) => {
    setAttendanceRecords(prev => prev.filter(r => r.id !== recordId));
  }, [setAttendanceRecords]);

  const deleteAllAttendanceForGradeDate = useCallback((gradeId: string, date: string) => {
    setAttendanceRecords(prev => prev.filter(ar => !(ar.gradeId === gradeId && ar.date === date)));
  }, [setAttendanceRecords]);


  const clearAttendanceToEdit = useCallback(() => {
    if (attendanceToEdit && activePeriodId) {
        const contextKey = `${attendanceToEdit.gradeId}_${attendanceToEdit.date}_${activePeriodId}`;
        consumeSavedContext(contextKey);
    }
    setAttendanceToEdit(null);
  }, [attendanceToEdit, activePeriodId, consumeSavedContext]);

  const clearInitialTakeAttendanceContext = useCallback(() => {
    if (initialTakeAttendanceContext && activePeriodId) {
      const contextKey = `${initialTakeAttendanceContext.gradeId}_${initialTakeAttendanceContext.date}_${activePeriodId}`;
      consumeSavedContext(contextKey);
    }
    setInitialTakeAttendanceContext(null);
  }, [initialTakeAttendanceContext, activePeriodId, consumeSavedContext]);

  const canGoBack = historyStack.length > 0;

  const renderScreen = () => {
    switch (currentView) {
      case ScreenView.DAILY_SUMMARY:
        return <DailySummaryScreen setCurrentView={setCurrentViewHandler} students={students} attendanceRecords={attendanceRecords} grades={grades} />;
      case ScreenView.MAIN_MENU:
        return <MainMenu setCurrentView={setCurrentViewHandler} goBack={goBack} canGoBack={canGoBack} />;
      case ScreenView.MANAGE_GRADES:
        return <ManageGradesScreen
                  grades={grades}
                  addGrade={addGrade}
                  editGrade={editGrade}
                  deleteGrade={deleteGrade}
                  setCurrentView={setCurrentViewHandler}
                  goBack={goBack}
                  canGoBack={canGoBack}
                  attendanceRecords={attendanceRecords} // Pass attendanceRecords
                />;
      case ScreenView.ADD_STUDENTS:
        return <AddStudentsScreen
                  grades={grades}
                  students={students}
                  addStudent={addStudent}
                  addStudentsBatch={addStudentsBatch}
                  editStudent={editStudent}
                  deleteStudent={deleteStudent}
                  changeStudentGrade={changeStudentGrade} // Pass new function
                  setCurrentView={setCurrentViewHandler}
                  goBack={goBack}
                  canGoBack={canGoBack}
                />;
      case ScreenView.TAKE_ATTENDANCE:
        return <TakeAttendanceScreen
                    grades={grades}
                    students={students}
                    periods={periods}
                    activePeriodId={activePeriodId}
                    attendanceRecords={attendanceRecords}
                    saveAttendanceRecord={saveAttendanceRecord}
                    setCurrentView={setCurrentViewHandler}
                    attendanceToEdit={attendanceToEdit}
                    clearAttendanceToEdit={clearAttendanceToEdit}
                    initialContext={initialTakeAttendanceContext}
                    clearInitialContext={clearInitialTakeAttendanceContext}
                    recentlySavedContexts={recentlySavedContexts}
                    markContextAsSaved={markContextAsSaved}
                    consumeSavedContext={consumeSavedContext}
                    goBack={goBack}
                    canGoBack={canGoBack}
                />;
      case ScreenView.CONFIGURE_PERIODS:
        return <ConfigurePeriodsScreen periods={periods} activePeriodId={activePeriodId} addPeriod={addPeriod} setActivePeriodId={setActivePeriodId} setCurrentView={setCurrentViewHandler} goBack={goBack} canGoBack={canGoBack} />;
      case ScreenView.ATTENDANCE_REPORTS:
        return <AttendanceReportsScreen grades={grades} students={students} periods={periods} attendanceRecords={attendanceRecords} setCurrentView={setCurrentViewHandler} goBack={goBack} canGoBack={canGoBack} />;
      case ScreenView.VIEW_SAVED_ATTENDANCE:
        return <ViewSavedAttendanceScreen
                    grades={grades}
                    students={students}
                    periods={periods}
                    attendanceRecords={attendanceRecords}
                    setCurrentView={setCurrentViewHandler}
                    setAttendanceToEdit={setAttendanceToEdit}
                    deleteAttendanceRecord={deleteAttendanceRecord}
                    deleteAllAttendanceForGradeDate={deleteAllAttendanceForGradeDate}
                    setInitialTakeAttendanceContext={setInitialTakeAttendanceContext}
                    goBack={goBack}
                    canGoBack={canGoBack}
                />;
      case ScreenView.ABSENTEEISM_REPORT:
        return <AbsenteeismReportScreen students={students} attendanceRecords={attendanceRecords} setCurrentView={setCurrentViewHandler} goBack={goBack} canGoBack={canGoBack} />;
      case ScreenView.BULK_UPLOAD_COURSES:
        return <BulkUploadScreen
                  grades={grades}
                  students={students}
                  addGrade={addGrade}
                  addStudentsBatch={addStudentsBatch}
                  setCurrentView={setCurrentViewHandler}
                  goBack={goBack}
                  canGoBack={canGoBack}
               />;
      case ScreenView.COMPUTER_REPORTS_HUB: // New Hub
        return <ComputerReportsHubScreen
                  setCurrentView={setCurrentViewHandler}
                  goBack={goBack}
                  canGoBack={canGoBack}
                />;
      case ScreenView.COMPUTER_USAGE_BY_GRADE_REPORT:
        return <ComputerUsageByGradeReportScreen
                  grades={grades}
                  students={students}
                  periods={periods}
                  attendanceRecords={attendanceRecords}
                  setCurrentView={setCurrentViewHandler}
                  goBack={goBack}
                  canGoBack={canGoBack}
                />;
      case ScreenView.COMPUTER_USAGE_GENERAL_REPORT:
        return <ComputerUsageGeneralReportScreen
                  grades={grades}
                  students={students}
                  periods={periods}
                  attendanceRecords={attendanceRecords}
                  setCurrentView={setCurrentViewHandler}
                  goBack={goBack}
                  canGoBack={canGoBack}
                />;
      default:
        if (historyStack.length > 0) setHistoryStack([]);
        _setCurrentView(ScreenView.DAILY_SUMMARY);
        return <DailySummaryScreen setCurrentView={setCurrentViewHandler} students={students} attendanceRecords={attendanceRecords} grades={grades} />;
    }
  };

  if (isLoading) {
    return (
      <div className={`fixed inset-0 bg-${INSTITUTIONAL_COLORS.BLUE} flex flex-col justify-center items-center text-${INSTITUTIONAL_COLORS.WHITE} splash-fade-in z-[200]`}>
        <h1 className={`text-5xl font-bold text-${INSTITUTIONAL_COLORS.YELLOW} mb-4`}>{APP_TITLE}</h1>
        <p className="text-lg">{AUTHOR_NAME}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header
        setCurrentView={setCurrentViewHandler}
        activeAlerts={activeAlerts}
        dismissAlert={dismissAlert}
        openAsiBot={openAsiBot} // Pass handler to open AsiBot
        onLogoutRequest={openLogoutConfirmModal} // Pass logout request handler
      />
      <main className="flex-grow container mx-auto px-2 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
        {renderScreen()}
      </main>
      <Footer />
      {isAsiBotOpen && (
        <AsiBot
          isOpen={isAsiBotOpen}
          onClose={closeAsiBot}
          students={students}
          grades={grades}
          periods={periods}
          activePeriodId={activePeriodId}
          attendanceRecords={attendanceRecords}
          setCurrentView={setCurrentViewHandler} // For navigation suggestions
        />
      )}
      <Modal
        isOpen={isLogoutConfirmModalOpen}
        onClose={closeLogoutConfirmModal}
        title="Confirmar Cierre de Sesión"
        footer={
          <>
            <Button variant="ghost" onClick={closeLogoutConfirmModal}>Cancelar</Button>
            <Button variant="danger" onClick={executeLogout}>Sí, Cerrar Sesión</Button>
          </>
        }
      >
        <p className="text-gray-700">
          ¿Seguro que desea cerrar sesión y volver a la pantalla de login?
        </p>
      </Modal>
    </div>
  );
};

export default App;
