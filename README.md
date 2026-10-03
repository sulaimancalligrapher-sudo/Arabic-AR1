# بصيرة | Baseera Arabic AR Learning Platform
**منصة تعليمية تفاعلية لتعليم اللغة العربية لغير الناطقين بها بتقنيات الويب الحديثة، تتبع حركة اليد (Hand Tracking)، والواقع المعزز (AR) داخل المتصفح مع تكامل جداول بيانات Google.**

---

## 🌟 مميزات المنصة الرئيسية

1. **تعليم تفاعلي لغير الناطقين بالعربية**:
   - نصوص بالتشكيل والحركات الكاملة
   - ترجمة إنجليزية فورية ونطق صوتي بالحروف اللاتينية (Transliteration مثل *Kitāb*)
   - صوتيات نطق واضحة عبر Web Speech API مع نطق الجمل والكلمات
   - أمثلة وتراكيب مبسطة للربط والتدريب

2. **أنشطة الواقع المعزز وتتبع حركة اليد (AR & MediaPipe Hand Tracking)**:
   - يعمل 100% داخل المتصفح دون الحاجة لتثبيت برامج أو دفع رسوم لأي API
   - حساب المسافة بين الإبهام والسبابة مع منع الاهتزاز (Hysteresis & Smoothing)
   - مؤشر افتراضي يتغير لونه حسب الحالة:
     - 🔵 عادي (Normal)
     - 🟡 تحويم (Hover)
     - 🔴 قبضة خارج الهدف (Pinch Outside)
     - 🟢 التقاط / نجاح (Grab / Success + ✔️)
   - **التحكم الذكي بالكاميرا**: الكاميرا وتتبع اليد يُشغّلان **فقط** داخل أنشطة الـ AR، ويتم إيقاف معالجة الكاميرا وتحرير موارد الجهاز فور الخروج أو العودة للشرح العادي.

3. **وضع البديل التلقائي (Mouse / Touch Mode)**:
   - إمكانية إكمال كافة الأنشطة بالماوس أو الشاشات اللمسية بضغطة زر واحدة أو تلقائياً في حال عدم توفر كاميرا أو رفض الإذن.

4. **محرك الأنشطة التعليمية (Activity Engine)**:
   - مطابقة الكلمة بالصورة (`match_word_image`) بالسحب والإفلات أو القبضة
   - ترتيب الجمل المفيدة (`arrange_sentence`)
   - تركيب الكلمة من الحروف (`build_word`)
   - الحرف الناقص (`missing_letter`)
   - تتبع مسار الحروف بالسبابة (`trace_letter`)
   - الاستماع واختيار المطابق (`listen_choose`)
   - تصنيف المجموعات في سلات (`classify_words`)

5. **تكامل Google Sheets وقاعدة البيانات الخفيفة**:
   - تشغيل وتخزين محلي أولاً (Offline-First Queue) لضمان سرعة واستجابة 0ms أثناء اللعب
   - لا يتم استدعاء Google Sheets مع كل إطار أو حركة يد
   - مزامنة دفعية عند انتهاء النشاط
   - كود Apps Script مدمج جاهز للنسخ بلصقة واحدة في Google Sheets
   - دعم تصدير ملفات CSV وحفظ التقدم في LocalStorage

6. **تصميم عصري متجاوب**:
   - واجهة Glassmorphism مريحة للعين
   - اتجاه كامل من اليمين إلى اليسار (RTL)
   - خطوط عربية واضحة (Tajawal و Cairo)

---

## 🚀 النشر على GitHub و Vercel

### 1. الرفع على GitHub:
```bash
git init
git add .
git commit -m "Initial commit: Baseera Arabic AR Learning Platform"
git remote add origin https://github.com/USERNAME/baseera-arabic-ar.git
git push -u origin main
```

### 2. النشر على Vercel:
1. افتح [Vercel](https://vercel.com) وسجّل دخولك بحساب GitHub.
2. اختر **Add New... ← Project**.
3. استورد مستودع المشروع من GitHub.
4. إعدادات البناء الافتراضية (Framework Preset: Vite):
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. اضغط **Deploy**.

---

## 📊 إعداد Google Sheets في دقيقتين

1. أنشئ جدولاً جديداً في [Google Sheets](https://sheets.new).
2. من القائمة العلوية، اختر: **الإضافات (Extensions) ← Apps Script**.
3. افتح نافذة "جداول جوجل" في التطبيق وانسخ كود `Code.gs` المرفق.
4. الصق الكود في محرر Apps Script واضغط **Deploy ← New Deployment**.
5. اختر **Web App**، واضبط:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
6. انسخ رابط تطبيق الويب والصقه في حقل الإعدادات داخل منصة بصيرة!
