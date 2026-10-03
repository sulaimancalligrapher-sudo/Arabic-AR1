import React from 'react';
import { StudentProfile, GoogleSheetsConfig } from '../types';
import { BookOpen, Sparkles, User, Table, RefreshCw, Award, Activity, Palette } from 'lucide-react';

interface HeaderProps {
  student: StudentProfile;
  sheetConfig: GoogleSheetsConfig;
  pendingSyncCount: number;
  isSyncing: boolean;
  onOpenStudentModal: () => void;
  onOpenSheetsModal: () => void;
  onOpenCalibrationModal: () => void;
  onSyncSheets: () => void;
  activeTab: 'lessons' | 'activities' | 'progress' | 'drawing';
  setActiveTab: (tab: 'lessons' | 'activities' | 'progress' | 'drawing') => void;
}

export const Header: React.FC<HeaderProps> = ({
  student,
  sheetConfig,
  pendingSyncCount,
  isSyncing,
  onOpenStudentModal,
  onOpenSheetsModal,
  onOpenCalibrationModal,
  onSyncSheets,
  activeTab,
  setActiveTab
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Zone 1: Wordmark Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20">
            بـ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-serif">بَصِيرَة</span>
              <span className="text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                AR تتبع اليد
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Arabic Interactive Learning for Non-Native Speakers
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'lessons'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الدروس والمناهج</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'activities'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>أنشطة الواقع المعزز</span>
          </button>

          <button
            onClick={() => setActiveTab('drawing')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'drawing'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>استوديو الرسم 🎨</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'progress'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>إحصائياتي وتقدمي</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Student Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Hand Calibration & Camera Diagnostic Button */}
          <button
            onClick={onOpenCalibrationModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors shadow-sm"
            title="فحص ومعايرة الكاميرا وتتبع اليد"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">معايرة اليد</span>
          </button>

          {/* Google Sheets Sync Pill */}
          <button
            onClick={onOpenSheetsModal}
            title={sheetConfig.scriptUrl ? 'جدول جوجل متصل' : 'ربط جدول بيانات جوجل'}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Table className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">جداول جوجل</span>
            {pendingSyncCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 text-[10px] font-bold rounded-full">
                {pendingSyncCount}
              </span>
            )}
          </button>

          {/* Quick Sync Action */}
          {sheetConfig.scriptUrl && (
            <button
              onClick={onSyncSheets}
              disabled={isSyncing}
              className="p-1.5 text-xs rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/50 transition-colors"
              title="مزامنة فورية الآن مع Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Student Profile Button */}
          <button
            onClick={onOpenStudentModal}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/80 hover:border-amber-500/40 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white leading-tight truncate max-w-[110px]">
                {student.name}
              </div>
              <div className="text-[10px] text-amber-400 font-medium">
                {student.totalScore} نقطة ⭐
              </div>
            </div>
          </button>
        </div>

      </div>
    </header>
  );
};
