import React, { useState } from 'react';
import { Lesson, StudentProfile, StudentLevel } from '../types';
import { BookOpen, Sparkles, CheckCircle2, ChevronLeft, Search, Flame, Award } from 'lucide-react';

interface LessonListProps {
  lessons: Lesson[];
  student: StudentProfile;
  onSelectLesson: (lesson: Lesson) => void;
  onOpenARShowcase: () => void;
}

export const LessonList: React.FC<LessonListProps> = ({
  lessons,
  student,
  onSelectLesson,
  onOpenARShowcase
}) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLessons = lessons.filter(lesson => {
    const matchesLevel = selectedLevel === 'all' || lesson.level === selectedLevel;
    const matchesQuery =
      searchQuery === '' ||
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.vocabulary.some(v => v.arabic.includes(searchQuery) || v.english.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesLevel && matchesQuery;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>منصة تفاعلية بالواقع المعزز وتتبع حركة اليد</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-serif leading-tight">
            تعلّم <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">اللغة العربية</span> بحركات اليد التفاعلية
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            منهاج تفاعلي لغير الناطقين بالعربية يدمج الصوتيات، الصور، تركيب الحروف والجمل، وتتبع حركة اليد أمام الكاميرا مع دعم كامل للماوس وشاشات اللمس والمزامنة مع جداول Google.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectLesson(lessons[0])}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <span>ابدأ الدرس الأول الآن</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenARShowcase}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>استكشف مختبر أنشطة اليد AR</span>
            </button>
          </div>
        </div>

        {/* Hero Visual Card / Badge */}
        <div className="relative z-10 w-full md:w-80 p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">بطاقة الطالب النشط</span>
            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>حماسة {student.streakDays} يوم</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-base font-bold text-white font-serif">{student.name}</div>
            <div className="text-xs text-slate-400">المستوى: {student.level}</div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
            <div className="flex justify-between text-xs text-slate-300">
              <span>إنجاز المنهج</span>
              <span className="font-bold text-amber-400">
                {Math.round((student.completedLessons.length / lessons.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                style={{
                  width: `${(student.completedLessons.length / lessons.length) * 100}%`
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
            <span>الدروس المنجزة: {student.completedLessons.length} من {lessons.length}</span>
            <span className="text-amber-400 font-bold">{student.totalScore} نقطة ⭐</span>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Level Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'all', label: 'جميع المستويات' },
            { id: 'مبتدئ', label: 'مبتدئ (Beginner)' },
            { id: 'متوسط', label: 'متوسط (Intermediate)' }
          ].map(lvl => (
            <button
              key={lvl.id}
              onClick={() => setSelectedLevel(lvl.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedLevel === lvl.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن درس أو كلمة..."
            className="w-full pr-9 pl-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

      </div>

      {/* Lessons Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLessons.map((lesson) => {
          const isCompleted = student.completedLessons.includes(lesson.id);

          return (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson)}
              className="group rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all duration-300 overflow-hidden shadow-xl cursor-pointer flex flex-col justify-between hover:-translate-y-1"
            >
              {/* Cover Image */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                {lesson.coverImage ? (
                  <img
                    src={lesson.coverImage}
                    alt={lesson.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-amber-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/20" />

                {/* Level Tag & Status */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 text-amber-400 border border-slate-700 backdrop-blur-md">
                    الدرس {lesson.order}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-slate-300 border border-slate-700 backdrop-blur-md">
                    {lesson.level}
                  </span>
                </div>

                {isCompleted && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/90 text-slate-950 font-bold text-[11px] shadow-lg backdrop-blur-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مكتمل</span>
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-amber-400">
                    {lesson.topic}
                  </div>
                  <h3 className="text-xl font-bold text-white font-serif group-hover:text-amber-300 transition-colors">
                    {lesson.title}
                  </h3>
                  <div className="text-xs text-slate-400 font-medium">
                    {lesson.titleEn}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 pt-1 leading-relaxed">
                    {lesson.description}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>{lesson.vocabulary.length} كلمات</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lesson.activities.length} أنشطة AR</span>
                    </span>
                  </div>

                  <span className="text-amber-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>دخول</span>
                    <span>←</span>
                  </span>
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
