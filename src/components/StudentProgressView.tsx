import React from 'react';
import { StudentProfile, ActivityResult, Lesson } from '../types';
import { Award, Star, CheckCircle2, Flame, Download, Table, RefreshCw, Clock, Sparkles } from 'lucide-react';

interface StudentProgressViewProps {
  student: StudentProfile;
  lessons: Lesson[];
  history: ActivityResult[];
  onExportCSV: () => void;
  onOpenSheetsModal: () => void;
  onSyncSheets: () => void;
  isSyncing: boolean;
  pendingCount: number;
}

export const StudentProgressView: React.FC<StudentProgressViewProps> = ({
  student,
  lessons,
  history,
  onExportCSV,
  onOpenSheetsModal,
  onSyncSheets,
  isSyncing,
  pendingCount
}) => {
  const completionPercentage = Math.round((student.completedLessons.length / lessons.length) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif">لوحة تقدم وإنجازات الطالب</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            تتبع المهارات المكتسبة، درجات التمارين، وسجل المزامنة مع جداول Google
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSheetsModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Table className="w-4 h-4 text-emerald-400" />
            <span>إدارة Google Sheets</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>مجموع النقاط</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">
            {student.totalScore}
          </div>
          <div className="text-[11px] text-slate-500">نقطة تعليمية مكتسبة</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>الدروس المكتملة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            {student.completedLessons.length} / {lessons.length}
          </div>
          <div className="text-[11px] text-slate-500">إنجاز بنسبة {completionPercentage}%</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>النجوم والأوسمة</span>
            <Award className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-sky-400 font-mono">
            {student.stars} ⭐
          </div>
          <div className="text-[11px] text-slate-500">مستوى: {student.level}</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>أيام الالتزام</span>
            <Flame className="w-4 h-4 text-rose-400 fill-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400 font-mono">
            {student.streakDays}
          </div>
          <div className="text-[11px] text-slate-500">يوم متواصل في التعلم</div>
        </div>

      </div>

      {/* Progress across lessons */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white font-serif">خارطة تقدم المناهج</h3>
        
        <div className="space-y-3">
          {lessons.map(ls => {
            const isDone = student.completedLessons.includes(ls.id);
            return (
              <div
                key={ls.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {isDone ? '✓' : ls.order}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white font-serif">{ls.title}</div>
                    <div className="text-xs text-slate-400">{ls.titleEn} · {ls.topic}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    isDone ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isDone ? 'مكتمل' : 'قيد الانتظار'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Log & Google Sheets Queue */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white font-serif">سجل النشاطات والإجابات المسجلة</h3>
          </div>
          {pendingCount > 0 && (
            <button
              onClick={onSyncSheets}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>مزامنة {pendingCount} نتائج مع Google Sheets</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            لم تبدأ أي نشاطات تفاعلية بعد. ادخل إلى أحد الدروس وابدأ أنشطة الواقع المعزز!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-3">الوقت والتاريخ</th>
                  <th className="p-3">نوع النشاط</th>
                  <th className="p-3">النتيجة</th>
                  <th className="p-3">المحاولات</th>
                  <th className="p-3">النقاط</th>
                  <th className="p-3">طريقة الإدخال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {history.map((record, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-400">
                      {new Date(record.timestamp).toLocaleTimeString('ar-SA')}
                    </td>
                    <td className="p-3 font-medium text-white">{record.activityType}</td>
                    <td className="p-3">
                      {record.correct ? (
                        <span className="text-emerald-400 font-bold">صحيح ✓</span>
                      ) : (
                        <span className="text-rose-400 font-bold">محاولة ✗</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-300">{record.attempts}</td>
                    <td className="p-3 font-mono text-amber-400 font-bold">+{record.score}</td>
                    <td className="p-3 text-slate-400">
                      {record.inputMode === 'ar_hand' ? (
                        <span className="inline-flex items-center gap-1 text-sky-400">
                          <Sparkles className="w-3 h-3" />
                          <span>تتبع اليد AR</span>
                        </span>
                      ) : (
                        <span>ماوس / لمس</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
