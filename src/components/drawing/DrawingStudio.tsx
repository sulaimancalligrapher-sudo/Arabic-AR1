import React, { useState, useEffect } from 'react';
import { DrawingItem, DrawingResult, StudentProfile } from '../../types';
import { drawingEngineService, GUIDE_LINE_COLORS } from '../../services/drawingEngineService';
import { googleSheetsService } from '../../services/googleSheetsService';
import { whiteboardSyncService, ConnectedStudent } from '../../services/whiteboardSyncService';
import { ARDrawingCanvas } from './ARDrawingCanvas';
import { DrawingAdminModal } from './DrawingAdminModal';
import {
  Palette,
  Sparkles,
  Settings,
  Table,
  Upload,
  Download,
  CheckCircle2,
  RefreshCw,
  Search,
  BookOpen,
  Award,
  Radio,
  Copy,
  ExternalLink,
  Cast,
  Play,
  Sliders,
  Check,
  X,
  Users,
  Smartphone,
  Tablet as TabletIcon,
  Monitor,
  Wifi,
  Send,
  Lock
} from 'lucide-react';

interface DrawingStudioProps {
  student: StudentProfile;
  onUpdateStudent: (updated: StudentProfile) => void;
  onOpenSheetsModal: () => void;
}

export const DrawingStudio: React.FC<DrawingStudioProps> = ({
  student,
  onUpdateStudent,
  onOpenSheetsModal
}) => {
  const [allDrawings, setAllDrawings] = useState<DrawingItem[]>(
    drawingEngineService.getAllDrawings()
  );
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'letters' | 'shapes' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingItem | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Standalone Whiteboard Remote Sync State
  const [showWhiteboardModal, setShowWhiteboardModal] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [boardLiveStats, setBoardLiveStats] = useState<{ accuracy: number; coverage: number; drawingId: string } | null>(null);
  const [currentBoardDrawingId, setCurrentBoardDrawingId] = useState<string>(() => whiteboardSyncService.getLatestDrawingId() || 'letter_alif');
  const [isBoardSessionActive, setIsBoardSessionActive] = useState(false);

  // Online Multi-Student Classroom Hub State
  const [roomCode, setRoomCode] = useState<string>(() => whiteboardSyncService.getRoomCode() || '4821');
  const [connectedStudents, setConnectedStudents] = useState<ConnectedStudent[]>([]);
  const [targetStudentId, setTargetStudentId] = useState<string>('all');
  const [isEditingRoomCode, setIsEditingRoomCode] = useState(false);
  const [tempRoomInput, setTempRoomInput] = useState(roomCode);

  // Initialize Teacher Role & Subscribe to live students list and progress
  useEffect(() => {
    whiteboardSyncService.initRole('teacher', roomCode);

    const unsubStudents = whiteboardSyncService.onStudentsChange((list) => {
      setConnectedStudents(list);
    });

    const unsubMsg = whiteboardSyncService.subscribe((msg) => {
      if (msg.type === 'STUDENT_PROGRESS' && msg.payload) {
        setBoardLiveStats({
          accuracy: msg.payload.accuracy,
          coverage: msg.payload.coverage,
          drawingId: msg.payload.drawingId
        });
      } else if (msg.type === 'STUDENT_FINISHED' && msg.payload) {
        setCopiedFeedback(`🎉 أحسنت! أنهى الطالب «${msg.studentName || 'طالب'}» رسمة «${msg.payload.drawingTitle || ''}» بإتقان ${msg.payload.accuracy}%!`);
        setTimeout(() => setCopiedFeedback(null), 5000);
      }
    });

    return () => {
      unsubStudents();
      unsubMsg();
    };
  }, [roomCode]);

  const handleUpdateRoomCode = () => {
    const cleaned = tempRoomInput.trim() || '4821';
    setRoomCode(cleaned);
    whiteboardSyncService.setRoomCode(cleaned);
    whiteboardSyncService.initRole('teacher', cleaned);
    setIsEditingRoomCode(false);
    setCopiedFeedback(`تم تغيير رمز الغرفة إلى: ${cleaned} 📡`);
    setTimeout(() => setCopiedFeedback(null), 3000);
  };

  const getWhiteboardUrl = (drawingId?: string) => {
    return whiteboardSyncService.getWhiteboardUrl(drawingId, roomCode);
  };

  const handleCopyLink = (drawingId?: string) => {
    const url = getWhiteboardUrl(drawingId);
    navigator.clipboard.writeText(url);
    setCopiedFeedback('تم نسخ رابط الطلاب للسبورة إلى الحافظة! 📋');
    setTimeout(() => setCopiedFeedback(null), 3000);
  };

  const handleOpenWhiteboardWindow = (drawingId?: string) => {
    const url = getWhiteboardUrl(drawingId);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendToWhiteboard = (item: DrawingItem, studentId: string = targetStudentId) => {
    if (!isBoardSessionActive) {
      setCopiedFeedback('⚠️ يرجى النقر على زر «بدء جلسة الرسم للجميع 🟢» أولاً قبل اختيار الدرس!');
      setTimeout(() => setCopiedFeedback(null), 3500);
      return;
    }
    setCurrentBoardDrawingId(item.id);
    whiteboardSyncService.saveLatestDrawingId(item.id);
    whiteboardSyncService.sendDrawingToStudents(item, studentId);
    const targetLabel = studentId === 'all' ? 'جميع الطلاب 📡' : `الطالب ${connectedStudents.find(s => s.id === studentId)?.name || ''} 🎯`;
    setCopiedFeedback(`تم إرسال «${item.title}» إلى ${targetLabel}! 🎨`);
    setTimeout(() => setCopiedFeedback(null), 3000);
  };

  const handleRemoteToggleSession = () => {
    const nextState = !isBoardSessionActive;
    setIsBoardSessionActive(nextState);
    if (nextState) {
      whiteboardSyncService.sendStartSession(targetStudentId);
      setCopiedFeedback('تم بدء الجلسة للطلاب بنجاح! 🟢 يمكنك الآن اختيار أي درس وإرساله لهم.');
    } else {
      whiteboardSyncService.sendFinishSession(targetStudentId);
      setCopiedFeedback('تم إنهاء الجلسة للطلاب وحفظ النتائج. 🔴');
    }
    setTimeout(() => setCopiedFeedback(null), 4000);
  };

  const handleRemoteClearBoard = () => {
    whiteboardSyncService.sendClearBoard(targetStudentId);
    setCopiedFeedback('تم مسح لوحة الطلاب عن بُعد! 🧹');
    setTimeout(() => setCopiedFeedback(null), 2500);
  };

  const handleRemoteSetColor = (colorId: 'yellow' | 'green' | 'white' | 'cyan' | 'black') => {
    whiteboardSyncService.sendGuideColor(colorId, targetStudentId);
  };

  // Filter drawings
  const filteredDrawings = allDrawings.filter(item => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  const handleDrawingsUpdated = () => {
    setAllDrawings(drawingEngineService.getAllDrawings());
  };

  const handleDrawingComplete = (result: DrawingResult) => {
    // Add points to student profile
    const updatedStudent: StudentProfile = {
      ...student,
      totalScore: student.totalScore + result.score,
      stars: student.stars + (result.accuracy >= 85 ? 3 : 2)
    };
    onUpdateStudent(updatedStudent);
  };

  // If a drawing is actively selected, show fullscreen AR Drawing Canvas
  if (selectedDrawing) {
    return (
      <div className="py-2 animate-in fade-in duration-200">
        <ARDrawingCanvas
          drawing={selectedDrawing}
          student={student}
          onBack={() => setSelectedDrawing(null)}
          onComplete={handleDrawingComplete}
        />
      </div>
    );
  }

  const drawingHistory = googleSheetsService.getDrawingHistory();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Studio Hero Header */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                <Palette className="w-3.5 h-3.5" />
                <span>استوديو الرسم التفاعلي والواقع المعزز (AR Drawing Studio)</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
              تعلّم رسم الحروف والأشكال بحركة اليد أمام الكاميرا
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              تتبّع الخطوط الشفافة بدقة، واكسب درجات بحسب ثبات يدك على المسار، أو استمتع بتلوين الأشكال بالفرشاة الهوائية.
            </p>
          </div>

          {/* Action Buttons: Whiteboard Hub, Admin Settings & Google Sheets */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowWhiteboardModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-sky-600/25 border border-sky-400/30 cursor-pointer"
              title="عرض شاشة السبورة المستقلة للطلاب والتحكم بها عن بُعد"
            >
              <Radio className="w-4 h-4 animate-pulse text-amber-300" />
              <span>🖥️ سبورة العرض المستقلة (للطلاب)</span>
            </button>

            <button
              onClick={() => setIsAdminOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-md hover:border-amber-400/50 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>إعدادات الإدارة ورفع رسمة</span>
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Table className="w-4 h-4" />
              <span>ورقة الرسم ({drawingHistory.length})</span>
            </button>
          </div>
        </div>

        {/* 3 Core Hand Gestures Quick Guide */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xl shrink-0">☝️</span>
            <div>
              <div className="text-xs font-bold text-sky-300">إصبع واحد (السبابة)</div>
              <div className="text-[11px] text-slate-400">للإشارة واختيار العناصر بالأزرار</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xl shrink-0">🤏</span>
            <div>
              <div className="text-xs font-bold text-amber-300">إصبعان (سبابة وإبهام)</div>
              <div className="text-[11px] text-slate-400">للقبض وسحب وتحريك البطاقات</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
            <span className="text-xl shrink-0">✍️</span>
            <div>
              <div className="text-xs font-bold text-emerald-300">ثلاثة أصابع (مسكة القلم)</div>
              <div className="text-[11px] text-slate-300">ضم الـ 3 أصابع للرسم، وافتحها لرفع القلم</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto py-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            جميع الرسومات ({allDrawings.length})
          </button>

          <button
            onClick={() => setSelectedCategory('letters')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'letters'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            🔤 الحروف العربية
          </button>

          <button
            onClick={() => setSelectedCategory('shapes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'shapes'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            🎨 الأشكال والمجسمات
          </button>

          <button
            onClick={() => setSelectedCategory('custom')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'custom'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            📁 رسومات المعلم المخصصة ({allDrawings.filter(d => d.isCustom).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن حرف أو رسمة..."
            className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Drawings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredDrawings.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedDrawing(item)}
            className="group rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer"
          >
            <div>
              {/* Image Preview Box with Faint Outline Effect */}
              <div className="relative w-full aspect-4/3 rounded-2xl bg-white/95 p-4 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-102 transition-transform">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="max-h-full max-w-full object-contain filter drop-shadow select-none pointer-events-none transition-opacity"
                  style={{ opacity: 0.85 }}
                />

                {/* Badge for Mode */}
                <div className="absolute top-2.5 left-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                    item.mode === 'color'
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {item.mode === 'color' ? 'تلوين' : 'تتبع خط'}
                  </span>
                </div>

                {item.isCustom && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCustomId(item.id);
                        setIsAdminOpen(true);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-slate-700 hover:border-amber-400 text-[10px] font-bold shadow flex items-center gap-1 transition-colors cursor-pointer"
                      title="تعديل إعدادات هذه الرسمة المرفوعة"
                    >
                      <Settings className="w-3 h-3" />
                      <span>تعديل</span>
                    </button>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-sm">
                      مخصص
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="mt-3.5 space-y-1">
                <div className="flex items-baseline justify-between gap-1">
                  <h3 className="font-serif text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <span className="text-[11px] font-mono text-amber-400 font-semibold">
                    +{item.points} نقطة
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description || item.titleEn}
                </p>
              </div>
            </div>

            {/* Card Footer: Send to Smartboard & Start Button */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isBoardSessionActive) {
                    setShowWhiteboardModal(true);
                    setCopiedFeedback('⚠️ يرجى بدء الجلسة أولاً بالنقر على «بدء جلسة الرسم للجميع 🟢»!');
                    setTimeout(() => setCopiedFeedback(null), 3500);
                  } else {
                    handleSendToWhiteboard(item);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
                  !isBoardSessionActive
                    ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-500 hover:text-amber-300'
                    : 'bg-sky-950/80 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border-sky-600/40'
                }`}
                title={!isBoardSessionActive ? 'يجب بدء الجلسة أولاً قبل إرسال الدروس' : 'إرسال هذه الرسمة فوراً إلى شاشة السبورة أمام الطلاب'}
              >
                {!isBoardSessionActive ? <Lock className="w-3 h-3 text-amber-400" /> : <Cast className="w-3.5 h-3.5 text-sky-400" />}
                <span>عرض بالسبورة 📡</span>
              </button>

              <span className="font-bold text-amber-400 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                <span>ابدأ هنا</span>
                <span>←</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredDrawings.length === 0 && (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <Palette className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">لا توجد رسومات تطابق هذا البحث أو التصنيف</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="text-xs text-amber-400 font-bold hover:underline"
          >
            إعادة تعيين الفلترة
          </button>
        </div>
      )}

      {/* Admin Settings Modal */}
      <DrawingAdminModal
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          setEditingCustomId(null);
        }}
        onDrawingsUpdated={handleDrawingsUpdated}
        initialEditingDrawingId={editingCustomId}
      />

      {/* Drawing Records & Sheet History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-serif">
                  سجل ورقة الرسم (Drawing Sheet)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => googleSheetsService.exportDrawingCSV()}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير CSV</span>
                </button>
                <button
                  onClick={() => onOpenSheetsModal()}
                  className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  إعدادات الربط
                </button>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {drawingHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  لا توجد محاولات رسم مسجلة حتى الآن. ابدأ برسم حرف أو شكل لتسجيل أول نتيجة!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="pb-2">اسم الرسمة</th>
                        <th className="pb-2">النوع</th>
                        <th className="pb-2">نسبة الدقة</th>
                        <th className="pb-2">النقاط</th>
                        <th className="pb-2">التاريخ والوقت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {drawingHistory.map((rec) => (
                        <tr key={rec.id} className="text-slate-300 hover:bg-slate-800/40">
                          <td className="py-2.5 font-bold text-white font-serif">{rec.drawingTitle}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                              {rec.mode === 'color' ? 'تلوين' : 'تتبع خط'}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-emerald-400 font-bold">{rec.accuracy}%</td>
                          <td className="py-2.5 font-mono text-amber-400">+{rec.score}</td>
                          <td className="py-2.5 text-slate-400 text-[11px]">
                            {new Date(rec.timestamp).toLocaleString('ar-SA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
              <span>يتم إرسال هذه النتائج تلقائياً إلى ورقة «ورقة_الرسم» في Google Sheets عند المزامنة.</span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast feedback for whiteboard actions */}
      {copiedFeedback && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-sky-500 text-slate-950 text-xs font-extrabold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{copiedFeedback}</span>
        </div>
      )}

      {/* Standalone & Online Classroom Remote Control Modal */}
      {showWhiteboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[94vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shadow-inner">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white font-serif flex items-center gap-2">
                    <span>إدارة الصف والسبورات التفاعلية (Online Classroom Hub)</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                      <Wifi className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                      <span>سحابي مباشر (Vercel & P2P)</span>
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    التحكم الكامل عندك كمعلم، والطلاب يرسمون في بيوتهم أو فصولهم عبر الجوال والتابلت باستقلالية تامة.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowWhiteboardModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Code & Student Share Link Section */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-sky-400" />
                    <span>رمز غرفة الدرس:</span>
                  </span>
                  {!isEditingRoomCode ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-extrabold text-amber-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                        {roomCode}
                      </span>
                      <button
                        onClick={() => {
                          setTempRoomInput(roomCode);
                          setIsEditingRoomCode(true);
                        }}
                        className="text-[11px] text-sky-400 hover:text-sky-300 underline"
                      >
                        تعديل
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempRoomInput}
                        onChange={(e) => setTempRoomInput(e.target.value)}
                        className="w-24 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-white text-center"
                        maxLength={8}
                      />
                      <button
                        onClick={handleUpdateRoomCode}
                        className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-xs font-bold"
                      >
                        حفظ
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>مجاني 100% ويعمل بدون خوادم مدفوعة</span>
                </div>
              </div>

              {/* Shareable Link Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getWhiteboardUrl()}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-sky-300 select-all focus:outline-none"
                />
                <button
                  onClick={() => handleCopyLink()}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ رابط الطلاب</span>
                </button>
                <button
                  onClick={() => handleOpenWhiteboardWindow()}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow"
                  title="فتح سبورة تجريبية للطالب في نافذة ثانية"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>تجربة كطالب 🖥️</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                💡 <strong>طريقة التعليم أونلاين:</strong> انسخ الرابط وأرسله لطلابك (عبر Zoom / Teams / WhatsApp). يفتح كل طالب الرابط من جواله أو التابلت في بيته ويكتب اسمه، وسيظهر أمامك مباشرة في الرادار أدناه مع نسبة إتقانه ودرجاته لحظياً!
              </p>
            </div>

            {/* Live Connected Students Radar */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">الطلاب المتصلون في الغرفة الآن:</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 font-mono font-bold border border-slate-700">
                    {connectedStudents.length} متصل 🟢
                  </span>
                </div>

                {/* Target Audience Selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">إرسال الأوامر إلى:</span>
                  <select
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-amber-300 font-bold outline-none cursor-pointer"
                  >
                    <option value="all">جميع الطلاب في الصف (بث جماعي 📡)</option>
                    {connectedStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.deviceType === 'mobile' ? 'جوال' : s.deviceType === 'tablet' ? 'تابلت' : 'كمبيوتر'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Students Grid */}
              {connectedStudents.length === 0 ? (
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-300">
                    في انتظار انضمام الطلاب عبر الرابط...
                  </p>
                  <p className="text-[11px] text-slate-500">
                    أرسل الرابط بالأعلى للطلاب في بيوتهم ليدخلوا فوراً من أي جوال أو تابلت بدون برامج إضافية.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {connectedStudents.map((std) => (
                    <div
                      key={std.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        targetStudentId === std.id
                          ? 'bg-amber-950/40 border-amber-500/80 ring-2 ring-amber-400/40'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                            {std.deviceType === 'mobile' ? (
                              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                            ) : std.deviceType === 'tablet' ? (
                              <TabletIcon className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Monitor className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-white truncate max-w-[130px]">
                              {std.name} {std.number ? `(#${std.number})` : ''}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {std.deviceType === 'mobile' ? '📱 جوال' : std.deviceType === 'tablet' ? '📟 تابلت' : '💻 كمبيوتر'}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            std.status === 'drawing'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 animate-pulse'
                              : std.status === 'finished'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-sky-950 text-sky-300 border border-sky-500/40'
                          }`}
                        >
                          {std.status === 'drawing' ? '✍️ يرسم الآن' : std.status === 'finished' ? '🏆 مكتمل' : '⏳ في الانتظار'}
                        </span>
                      </div>

                      {/* Live accuracy meter */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 truncate max-w-[100px]">{std.currentDrawingTitle || 'في الانتظار'}</span>
                          <span className="font-mono font-bold text-emerald-400">{std.accuracy}% إتقان</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300"
                            style={{ width: `${std.accuracy}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                        <button
                          onClick={() => setTargetStudentId(std.id)}
                          className="text-amber-400 hover:text-amber-300 font-bold"
                        >
                          {targetStudentId === std.id ? '✓ محدد حالياً' : 'تحديد هذا الطالب 🎯'}
                        </button>
                        {std.score > 0 && (
                          <span className="text-amber-300 font-bold">+{std.score} نقطة</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remote Teacher Controls */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>
                  أوامر التحكم عن بُعد ({targetStudentId === 'all' ? 'لكل الطلاب 📡' : `للطالب ${connectedStudents.find(s => s.id === targetStudentId)?.name || ''}`}):
                </span>
              </h4>

              {/* Action buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={handleRemoteToggleSession}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !isBoardSessionActive
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80'
                      : 'bg-rose-950/80 border-rose-500/50 text-rose-300 hover:bg-rose-900/80'
                  }`}
                >
                  {!isBoardSessionActive ? (
                    <>
                      <Play className="w-4 h-4 fill-current text-emerald-400" />
                      <span>بدء جلسة الرسم للجميع 🟢</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-rose-400" />
                      <span>إنهاء وحفظ النتيجة 🔴</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleRemoteClearBoard}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                  <span>مسح لوحات الطلاب 🧹</span>
                </button>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-400 font-semibold">لون خط الإرشاد:</span>
                  <div className="flex items-center gap-1.5">
                    {GUIDE_LINE_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleRemoteSetColor(c.id)}
                        style={{ backgroundColor: c.hex }}
                        className="w-4 h-4 rounded-full border border-slate-700 hover:scale-125 transition-transform cursor-pointer"
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Template Broadcast list */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                <span>
                  اختر الرسمة أو الحرف لإرسالها فوراً إلى أجهزة الطلاب ({targetStudentId === 'all' ? 'للجميع 📡' : 'للطالب المحدد 🎯'}):
                </span>
                {!isBoardSessionActive && (
                  <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>مقفلة حتى بدء الجلسة</span>
                  </span>
                )}
              </div>

              {!isBoardSessionActive && (
                <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-2 mb-2.5 shadow-inner">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>خطوة 1: انقر على زر «بدء جلسة الرسم للجميع 🟢» أعلاه أولاً لتفعيل إرسال الدروس للطلاب.</span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1">
                {allDrawings.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    disabled={!isBoardSessionActive}
                    onClick={() => handleSendToWhiteboard(item)}
                    className={`p-2.5 rounded-xl border text-right flex items-center justify-between transition-all ${
                      !isBoardSessionActive
                        ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                        : 'bg-slate-800/80 hover:bg-sky-950 border-slate-700/80 hover:border-sky-500 text-white cursor-pointer shadow-sm hover:scale-102'
                    }`}
                  >
                    <span className="text-xs font-bold font-serif truncate">{item.title}</span>
                    {!isBoardSessionActive ? (
                      <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
                    ) : (
                      <Cast className="w-3.5 h-3.5 text-sky-400 shrink-0 mr-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                تسجيل النتائج مستمر تلقائياً في Google Sheets «ورقة_الرسم»
              </span>
              <button
                onClick={() => setShowWhiteboardModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
