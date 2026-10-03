import React, { useState, useEffect } from 'react';
import { DrawingItem, DrawingResult, StudentProfile } from '../../types';
import { drawingEngineService, GUIDE_LINE_COLORS } from '../../services/drawingEngineService';
import { googleSheetsService } from '../../services/googleSheetsService';
import { whiteboardSyncService } from '../../services/whiteboardSyncService';
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
  X
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

  // Subscribe to live student progress updates from smartboard
  useEffect(() => {
    const unsub = whiteboardSyncService.subscribe((msg) => {
      if (msg.type === 'STUDENT_PROGRESS' && msg.payload) {
        setBoardLiveStats({
          accuracy: msg.payload.accuracy,
          coverage: msg.payload.coverage,
          drawingId: msg.payload.drawingId
        });
      }
    });
    return () => unsub();
  }, []);

  const getWhiteboardUrl = (drawingId?: string) => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return drawingId ? `${base}?mode=whiteboard&drawing=${drawingId}` : `${base}?mode=whiteboard`;
  };

  const handleCopyLink = (drawingId?: string) => {
    const url = getWhiteboardUrl(drawingId);
    navigator.clipboard.writeText(url);
    setCopiedFeedback('تم نسخ رابط السبورة المستقلة إلى الحافظة! 📋');
    setTimeout(() => setCopiedFeedback(null), 3000);
  };

  const handleOpenWhiteboardWindow = (drawingId?: string) => {
    const url = getWhiteboardUrl(drawingId);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendToWhiteboard = (item: DrawingItem) => {
    setCurrentBoardDrawingId(item.id);
    whiteboardSyncService.saveLatestDrawingId(item.id);
    whiteboardSyncService.send({
      type: 'SELECT_DRAWING',
      payload: { drawingId: item.id }
    });
    setCopiedFeedback(`تم إرسال «${item.title}» إلى سبورة الطلاب بنجاح! 📡`);
    setTimeout(() => setCopiedFeedback(null), 3000);
  };

  const handleRemoteToggleSession = () => {
    const nextState = !isBoardSessionActive;
    setIsBoardSessionActive(nextState);
    whiteboardSyncService.send({
      type: nextState ? 'START_SESSION' : 'FINISH_SESSION'
    });
  };

  const handleRemoteClearBoard = () => {
    whiteboardSyncService.send({ type: 'CLEAR_BOARD' });
    setCopiedFeedback('تم مسح لوحة الطالب عن بُعد! 🧹');
    setTimeout(() => setCopiedFeedback(null), 2500);
  };

  const handleRemoteSetColor = (colorId: 'yellow' | 'green' | 'white' | 'cyan' | 'black') => {
    whiteboardSyncService.send({
      type: 'SET_GUIDE_COLOR',
      payload: { color: colorId }
    });
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
                  handleSendToWhiteboard(item);
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border border-sky-600/40 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                title="إرسال هذه الرسمة فوراً إلى شاشة السبورة أمام الطلاب"
              >
                <Cast className="w-3.5 h-3.5 text-sky-400" />
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

      {/* Standalone Whiteboard Remote Control Modal */}
      {showWhiteboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[92vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shadow-inner">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white font-serif flex items-center gap-2">
                    <span>سبورة العرض التفاعلية المستقلة (Smart Board Display)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      بث مباشر
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    رابط مستقل مخصص لشاشات البروجيكتور والسبورات الذكية: التحكم عندك والطالب فقط يرسم.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowWhiteboardModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Standalone Link Section */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>الرابط المستقل لشاشة السبورة أمام الطلاب:</span>
                </span>
                <span className="text-[11px] text-slate-500">يعمل على أي شاشة/متصفح</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getWhiteboardUrl()}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-sky-300 select-all focus:outline-none"
                />
                <button
                  onClick={() => handleCopyLink()}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الرابط</span>
                </button>
                <button
                  onClick={() => handleOpenWhiteboardWindow()}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح الآن 🖥️</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                💡 <strong>طريقة العرض الموصى بها:</strong> افتح هذا الرابط في نافذة مستقلة واسحبها إلى شاشة البروجيكتور أو السبورة الذكية (وضع توسيع الشاشة Extend Display)، واضغط زر ملء الشاشة. ستبقى لوحة التحكم هذه أمامك على حاسوبك!
              </p>
            </div>

            {/* Remote Teacher Controls */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>التحكم عن بُعد في سبورة الطلاب (الكونسول اللحظي):</span>
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
                      <span>بدء جلسة الرسم للسبورة 🟢</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-rose-400" />
                      <span>إنهاء وحساب النتيجة 🔴</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleRemoteClearBoard}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                  <span>مسح لوحة الطالب 🧹</span>
                </button>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-400 font-semibold">لون الخط:</span>
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

              {/* Live Student Radar Monitor */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">متابعة إتقان الطالب اللحظية من السبورة:</div>
                  <div className="text-xs text-white font-semibold mt-0.5">
                    {boardLiveStats ? `الرسمة الحالية: ${allDrawings.find(d => d.id === boardLiveStats.drawingId)?.title || 'حرف الألف'}` : 'في انتظار بدء رسم الطالب...'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-bold">التغطية</div>
                    <div className="text-base font-extrabold font-mono text-sky-400">
                      {boardLiveStats?.coverage ?? 0}%
                    </div>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-bold">نسبة الثبات</div>
                    <div className="text-base font-extrabold font-mono text-emerald-400">
                      {boardLiveStats?.accuracy ?? 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Template Broadcast list */}
            <div>
              <div className="text-xs font-bold text-slate-300 mb-2">
                اختر الرسمة أو الحرف لإرسالها فوراً إلى سبورة العرض:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                {allDrawings.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSendToWhiteboard(item)}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-sky-950/80 border border-slate-700/80 hover:border-sky-500/50 text-right flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-white font-serif truncate">{item.title}</span>
                    <Cast className="w-3.5 h-3.5 text-sky-400 shrink-0 mr-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-end">
              <button
                onClick={() => setShowWhiteboardModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
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
