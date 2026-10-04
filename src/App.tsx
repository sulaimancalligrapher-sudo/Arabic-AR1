/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LessonList } from './components/LessonList';
import { LessonView } from './components/LessonView';
import { StudentProgressView } from './components/StudentProgressView';
import { ARActivitiesLab } from './components/ARActivitiesLab';
import { DrawingStudio } from './components/drawing/DrawingStudio';
import { StudentModal } from './components/StudentModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { HandCalibrationModal } from './components/HandCalibrationModal';
import { StudentWhiteboardView } from './components/drawing/StudentWhiteboardView';

import { INITIAL_LESSONS } from './data/lessonsData';
import {
  StudentProfile,
  Lesson,
  GoogleSheetsConfig,
  ActivityResult,
  ActivityDefinition
} from './types';
import { googleSheetsService } from './services/googleSheetsService';
import { audioService } from './services/audioService';

export default function App() {
  // Global Application State
  const [student, setStudent] = useState<StudentProfile>(() =>
    googleSheetsService.getStudentProfile()
  );
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetsConfig>(() =>
    googleSheetsService.getConfig()
  );
  const [history, setHistory] = useState<ActivityResult[]>(() =>
    googleSheetsService.getHistory()
  );
  const [pendingCount, setPendingCount] = useState<number>(() =>
    googleSheetsService.getPendingQueue().length
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'lessons' | 'activities' | 'progress' | 'drawing'>('lessons');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Standalone Smart Board / Whiteboard Mode (?mode=whiteboard or ?room=...)
  const [isWhiteboardMode, setIsWhiteboardMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'whiteboard' || params.get('view') === 'board' || !!params.get('room');
    }
    return false;
  });

  const [urlDrawingId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('drawing') || params.get('drawingId') || null;
    }
    return null;
  });

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);

  // Toast / Global Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refresh counts
  const refreshCounts = () => {
    setPendingCount(googleSheetsService.getPendingQueue().length);
    setHistory(googleSheetsService.getHistory());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync to Google Sheets
  const handleSyncSheets = async () => {
    setIsSyncing(true);
    const res = await googleSheetsService.syncQueue();
    setIsSyncing(false);
    refreshCounts();
    setSheetConfig(googleSheetsService.getConfig());
    showToast(res.message);
    if (res.success) {
      audioService.playSuccessSound();
    }
  };

  // Save student profile
  const handleSaveStudent = (updated: StudentProfile) => {
    setStudent(updated);
    googleSheetsService.saveStudentProfile(updated);
    showToast('تم حفظ الملف الشخصي للطالب بنجاح');
  };

  // Save Google Sheets config
  const handleSaveSheetConfig = (updated: GoogleSheetsConfig) => {
    setSheetConfig(updated);
    googleSheetsService.saveConfig(updated);
  };

  // Export CSV
  const handleExportCSV = () => {
    googleSheetsService.exportCSV();
  };

  // Activity completed in AR Lab
  const handleLabActivityComplete = (
    score: number,
    attempts: number,
    mode: 'ar_hand' | 'mouse_touch',
    activity: ActivityDefinition
  ) => {
    const updatedStudent: StudentProfile = {
      ...student,
      totalScore: student.totalScore + score,
      stars: student.stars + 1
    };
    setStudent(updatedStudent);
    googleSheetsService.saveStudentProfile(updatedStudent);

    const record: ActivityResult = {
      studentId: student.id,
      studentName: student.name,
      lessonId: activity.lessonId,
      activityId: activity.id,
      activityType: activity.type,
      correct: true,
      attempts,
      score,
      timestamp: new Date().toISOString(),
      timeSpentSeconds: 20,
      inputMode: mode
    };
    googleSheetsService.enqueueResult(record);
    refreshCounts();
    showToast(`+${score} نقطة مكتسبة! تم تسجيل النتيجة محلياً.`);
  };

  // If in standalone Smart Board / Whiteboard Mode
  if (isWhiteboardMode) {
    return (
      <StudentWhiteboardView
        initialDrawingId={urlDrawingId}
        onExit={() => {
          setIsWhiteboardMode(false);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('mode');
            url.searchParams.delete('view');
            url.searchParams.delete('room');
            window.history.pushState({}, '', url.pathname);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-amber-500 text-slate-950 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Top 3-Zone Navigation Bar */}
      <Header
        student={student}
        sheetConfig={sheetConfig}
        pendingSyncCount={pendingCount}
        isSyncing={isSyncing}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenCalibrationModal={() => setIsCalibrationModalOpen(true)}
        onSyncSheets={handleSyncSheets}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveLesson(null); // Return to list view
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        
        {/* If a lesson is actively open */}
        {activeLesson ? (
          <LessonView
            lesson={activeLesson}
            student={student}
            onUpdateStudent={(updated) => {
              setStudent(updated);
              googleSheetsService.saveStudentProfile(updated);
              refreshCounts();
            }}
            onBackToLessons={() => setActiveLesson(null)}
          />
        ) : (
          <>
            {/* Tab 1: Curriculum Lessons */}
            {activeTab === 'lessons' && (
              <LessonList
                lessons={INITIAL_LESSONS}
                student={student}
                onSelectLesson={(lesson) => setActiveLesson(lesson)}
                onOpenARShowcase={() => setActiveTab('activities')}
              />
            )}

            {/* Tab 2: AR Interactive Activities Lab */}
            {activeTab === 'activities' && (
              <ARActivitiesLab
                lessons={INITIAL_LESSONS}
                studentId={student.id}
                studentName={student.name}
                onActivityComplete={handleLabActivityComplete}
                onBackToLessons={() => setActiveTab('lessons')}
              />
            )}

            {/* Tab 3: AR Drawing & Tracing Studio */}
            {activeTab === 'drawing' && (
              <DrawingStudio
                student={student}
                onUpdateStudent={(updated) => {
                  setStudent(updated);
                  googleSheetsService.saveStudentProfile(updated);
                  refreshCounts();
                }}
                onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              />
            )}

            {/* Tab 4: Student Progress & Google Sheets Sync */}
            {activeTab === 'progress' && (
              <StudentProgressView
                student={student}
                lessons={INITIAL_LESSONS}
                history={history}
                onExportCSV={handleExportCSV}
                onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
                onSyncSheets={handleSyncSheets}
                isSyncing={isSyncing}
                pendingCount={pendingCount}
              />
            )}
          </>
        )}

      </main>

      {/* Student Profile Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        student={student}
        onSaveStudent={handleSaveStudent}
      />

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={sheetConfig}
        onSaveConfig={handleSaveSheetConfig}
        pendingCount={pendingCount}
        history={history}
        onSync={handleSyncSheets}
        onExportCSV={handleExportCSV}
        isSyncing={isSyncing}
      />

      {/* Hand Calibration & Diagnostics Modal */}
      <HandCalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-slate-400">بصيرة | Baseera Arabic AR</span>
            <span>·</span>
            <span>تعليم اللغة العربية لغير الناطقين بها بتقنية الواقع المعزز</span>
          </div>
          <div className="text-[11px] text-slate-500">
            🔒 خصوصية كاملة: تتم معالجة حركة اليد داخل المتصفح بالكامل، ولا يتم تسجيل أو رفع أي لقطات من الكاميرا
          </div>
        </div>
      </footer>

    </div>
  );
}
