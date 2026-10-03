import React, { useState } from 'react';
import { ActivityDefinition, Lesson } from '../types';
import { ARActivityEngine } from './activities/ARActivityEngine';
import { Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';

interface ARActivitiesLabProps {
  lessons: Lesson[];
  studentId: string;
  studentName: string;
  onActivityComplete: (score: number, attempts: number, mode: 'ar_hand' | 'mouse_touch', activity: ActivityDefinition) => void;
  onBackToLessons: () => void;
}

export const ARActivitiesLab: React.FC<ARActivitiesLabProps> = ({
  lessons,
  studentId,
  studentName,
  onActivityComplete,
  onBackToLessons
}) => {
  // Collect all activities from all lessons
  const allActivities: ActivityDefinition[] = lessons.flatMap(l => l.activities);

  const [selectedActivity, setSelectedActivity] = useState<ActivityDefinition | null>(
    allActivities[0] || null
  );

  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  const handleComplete = (score: number, attempts: number, mode: 'ar_hand' | 'mouse_touch') => {
    if (!selectedActivity) return;
    setCompletedMap(prev => ({ ...prev, [selectedActivity.id]: true }));
    onActivityComplete(score, attempts, mode, selectedActivity);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-serif">مختبر أنشطة الواقع المعزز (AR Lab)</h2>
          </div>
          <p className="text-xs text-slate-400">
            تدرّب بحرية على جميع أنماط الحركة وتتبع اليد والأنشطة التفاعلية بالمتصفح
          </p>
        </div>

        <button
          onClick={onBackToLessons}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          <span>العودة للدروس</span>
        </button>
      </div>

      {/* Main Layout: Activity Selector List + Active Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left/Sidebar: Activity Selector */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-bold text-slate-400 px-1">قائمة الأنشطة التفاعلية:</div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {allActivities.map((act) => {
              const isSelected = selectedActivity?.id === act.id;
              const isDone = completedMap[act.id];

              return (
                <button
                  key={act.id}
                  onClick={() => setSelectedActivity(act)}
                  className={`w-full text-right p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white truncate max-w-[160px]">{act.title}</div>
                    <div className="text-[10px] text-slate-400">{act.type}</div>
                  </div>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400 shrink-0">+{act.points}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active AR Canvas Stage */}
        <div className="lg:col-span-3">
          {selectedActivity ? (
            <ARActivityEngine
              key={selectedActivity.id}
              activity={selectedActivity}
              studentId={studentId}
              studentName={studentName}
              onComplete={handleComplete}
              onExit={onBackToLessons}
            />
          ) : (
            <div className="w-full h-96 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
              اختر نشاطاً للبدء
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
