import React, { useState } from 'react';
import { Lesson, StudentProfile, ActivityDefinition, ActivityResult } from '../types';
import { ARActivityEngine } from './activities/ARActivityEngine';
import { audioService } from '../services/audioService';
import { googleSheetsService } from '../services/googleSheetsService';
import {
  ChevronRight,
  ChevronLeft,
  Volume2,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  Play,
  RotateCcw
} from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  student: StudentProfile;
  onUpdateStudent: (updated: StudentProfile) => void;
  onBackToLessons: () => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  student,
  onUpdateStudent,
  onBackToLessons
}) => {
  // Steps: 0: Introduction, 1: Vocabulary, 2: AR Activities, 3: Review Quiz, 4: Summary / Completion
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [currentActivityIndex, setCurrentActivityIndex] = useState<number>(0);
  const [lessonScore, setLessonScore] = useState<number>(0);
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  const [activeVocabId, setActiveVocabId] = useState<string | null>(null);

  // Review Quiz selection state
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<boolean | null>(null);

  const currentActivity: ActivityDefinition | undefined = lesson.activities[currentActivityIndex];

  // Handle completion of an AR / Interactive Activity
  const handleActivityComplete = (earnedPoints: number, attempts: number, mode: 'ar_hand' | 'mouse_touch') => {
    if (!currentActivity) return;

    setLessonScore(prev => prev + earnedPoints);
    setCompletedActivities(prev => [...prev, currentActivity.id]);

    // Save and enqueue result to Google Sheets service (offline-first)
    const resultRecord: ActivityResult = {
      studentId: student.id,
      studentName: student.name,
      lessonId: lesson.id,
      activityId: currentActivity.id,
      activityType: currentActivity.type,
      correct: true,
      attempts,
      score: earnedPoints,
      timestamp: new Date().toISOString(),
      timeSpentSeconds: 25,
      inputMode: mode
    };
    googleSheetsService.enqueueResult(resultRecord);

    // If there are more activities in this lesson, advance to next
    if (currentActivityIndex < lesson.activities.length - 1) {
      setTimeout(() => {
        setCurrentActivityIndex(i => i + 1);
      }, 1000);
    } else {
      // Advance to Review Quiz
      setTimeout(() => {
        setCurrentStep(3);
      }, 1200);
    }
  };

  // Handle final completion
  const handleFinishLesson = () => {
    const updatedCompleted = Array.from(new Set([...student.completedLessons, lesson.id]));
    const updatedStudent: StudentProfile = {
      ...student,
      totalScore: student.totalScore + lessonScore,
      completedLessons: updatedCompleted,
      stars: student.stars + 3
    };

    onUpdateStudent(updatedStudent);
    setCurrentStep(4);
  };

  const steps = [
    { title: 'المقدمة والشرح', titleEn: 'Overview' },
    { title: 'بطاقات المفردات', titleEn: 'Vocabulary' },
    { title: 'أنشطة الواقع المعزز', titleEn: 'AR Activities' },
    { title: 'اختبار الفهم', titleEn: 'Quiz' },
    { title: 'إتمام الدرس', titleEn: 'Certificate' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Breadcrumb & Step Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <button
          onClick={onBackToLessons}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          <span>العودة إلى قائمة الدروس</span>
        </button>

        {/* Step Indicators */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {steps.map((st, idx) => (
            <button
              key={idx}
              onClick={() => {
                // Allow jumping to steps or reviewing
                if (idx <= currentStep || completedActivities.length > 0) {
                  setCurrentStep(idx);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                currentStep === idx
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : currentStep > idx
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>{idx + 1}.</span>
              <span>{st.title}</span>
            </button>
          ))}
        </div>

        {/* Score pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
          <Award className="w-3.5 h-3.5" />
          <span>نقاط الدرس: {lessonScore}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STEP 0: LESSON OVERVIEW & GRAMMAR                             */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 0 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Hero Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl min-h-[260px] flex items-end p-6 sm:p-8">
            {lesson.coverImage ? (
              <img
                src={lesson.coverImage}
                alt={lesson.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover brightness-50"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            <div className="relative z-10 space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {lesson.topic}
                </span>
                <span className="text-xs text-slate-300 font-serif">المستوى: {lesson.level}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
                {lesson.title}
              </h1>
              <p className="text-sm sm:text-base text-amber-100/90 font-medium">
                {lesson.titleEn}
              </p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                {lesson.description}
              </p>
            </div>
          </div>

          {/* Grammar & Pedagogical Concept Box */}
          {lesson.grammarTip && (
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-4 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{lesson.grammarTip.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{lesson.grammarTip.description}</p>
              </div>
            </div>
          )}

          {/* Action to proceed */}
          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
            >
              <span>انتقل إلى المفردات والنطق</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 1: INTERACTIVE VOCABULARY & AUDIO CARDS                  */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-white font-serif">مفردات الدرس والنطق الصوتي</h2>
            <p className="text-xs text-slate-400">
              استمع إلى نطق الكلمات العربية، واقرأ التشكيل والترجمة الصوتية (Transliteration).
            </p>
          </div>

          {/* Vocabulary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lesson.vocabulary.map((vocab) => {
              const isActive = activeVocabId === vocab.id;
              return (
                <div
                  key={vocab.id}
                  onClick={() => {
                    setActiveVocabId(vocab.id);
                    audioService.speakArabic(vocab.arabic);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-lg group ${
                    isActive
                      ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-500/20'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl filter drop-shadow">{vocab.emoji}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        audioService.speakArabic(vocab.arabic);
                      }}
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 transition-colors"
                      title="استمع إلى النطق العربي"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="font-serif text-2xl font-bold text-white tracking-wide">
                      {vocab.arabic}
                    </div>
                    <div className="text-xs font-mono text-amber-400 font-medium">
                      {vocab.transliteration}
                    </div>
                    <div className="text-xs text-slate-400">
                      {vocab.english}
                    </div>
                  </div>

                  {vocab.exampleSentence && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] space-y-0.5">
                      <div className="text-slate-300 font-serif font-semibold">
                        {vocab.exampleSentence.arabic}
                      </div>
                      <div className="text-slate-500">
                        {vocab.exampleSentence.english}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(0)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              السابق
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>بدء أنشطة الواقع المعزز (AR)</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: AR / HAND TRACKING ACTIVITIES                         */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 2 && currentActivity && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Activities Progress Bar */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">
                النشاط {currentActivityIndex + 1} من {lesson.activities.length}
              </span>
              <span className="text-xs text-slate-400">· {currentActivity.title}</span>
            </div>

            {/* Pagination dots */}
            <div className="flex items-center gap-1.5">
              {lesson.activities.map((act, i) => (
                <div
                  key={act.id}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    completedActivities.includes(act.id)
                      ? 'bg-emerald-400'
                      : i === currentActivityIndex
                      ? 'bg-amber-400 w-5'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Core AR Activity Engine (Handles Camera Lifecycle!) */}
          <ARActivityEngine
            key={currentActivity.id}
            activity={currentActivity}
            studentId={student.id}
            studentName={student.name}
            onComplete={handleActivityComplete}
            onExit={() => setCurrentStep(1)}
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: REVIEW QUIZ                                           */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 3 && (
        <div className="space-y-6 max-w-xl mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl animate-in fade-in duration-200 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <span className="text-xs font-semibold text-amber-400">سؤال مراجعة ختامي للدرس</span>
            <h3 className="text-lg font-bold text-white mt-1">
              ما معنى كلمة "{lesson.vocabulary[0]?.arabic}"؟
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              اختر الترجمة الصحيحة لتثبيت المعلومة
            </p>
          </div>

          {/* Quiz Options */}
          <div className="grid grid-cols-1 gap-3 text-right">
            {[
              { id: 'correct', text: lesson.vocabulary[0]?.english || 'Correct answer', isRight: true },
              { id: 'wrong1', text: 'Different meaning (False)', isRight: false },
              { id: 'wrong2', text: 'Another object (False)', isRight: false }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  setQuizAnswer(opt.id);
                  setQuizFeedback(opt.isRight);
                  if (opt.isRight) {
                    audioService.playSuccessSound();
                  } else {
                    audioService.playErrorSound();
                  }
                }}
                className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
                  quizAnswer === opt.id
                    ? opt.isRight
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500 text-rose-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-600'
                }`}
              >
                {opt.text}
              </button>
            ))}
          </div>

          {quizFeedback !== null && (
            <div className={`p-3 rounded-xl text-xs font-bold ${
              quizFeedback ? 'bg-emerald-950/40 text-emerald-400' : 'bg-rose-950/40 text-rose-400'
            }`}>
              {quizFeedback ? 'أحسنت! إجابة دقيقة وصحيحة 🌟' : 'حاول مرة أخرى لتحديد الإجابة المطابقة'}
            </div>
          )}

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleFinishLesson}
              className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
            >
              إتمام الدرس والحصول على الشهادة ⭐
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 4: LESSON COMPLETION SUMMARY                             */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 4 && (
        <div className="space-y-6 max-w-lg mx-auto p-8 bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl shadow-2xl text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-semibold text-emerald-400">تهانينا! اكتمل الدرس بنجاح</span>
            <h2 className="text-2xl font-extrabold text-white font-serif mt-1">
              مُمتاز! أتممت درس {lesson.title}
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              تم تسجيل نتائجك وحفظها تلقائياً في قائمة المزامنة مع جداول بيانات Google.
            </p>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
            <div>
              <div className="text-[11px] text-slate-400">النقاط المكتسبة</div>
              <div className="text-2xl font-bold text-amber-400">+{lessonScore}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">النجوم الممنوحة</div>
              <div className="text-2xl font-bold text-sky-400">+3 ⭐</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setCurrentStep(0);
                setCurrentActivityIndex(0);
                setCompletedActivities([]);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة الدرس</span>
            </button>

            <button
              onClick={onBackToLessons}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
            >
              العودة لقائمة الدروس الرئيسية
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
