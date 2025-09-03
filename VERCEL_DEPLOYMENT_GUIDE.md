# دليل نشر الموقع على Vercel

## المشاكل المحتملة والحلول

### 1. مشكلة معالجة الملفات تفشل في Vercel

**الأعراض:**
- رفع الملف ينجح لكن المعالجة تفشل
- لا تظهر البيانات في الجدول
- خطأ 500 أثناء المعالجة

**الحلول:**

#### أ. التأكد من تكوين vercel.json
```json
{
  "functions": {
    "server/index.ts": {
      "maxDuration": 30
    }
  }
}
```

#### ب. التحقق من logs في Vercel Dashboard
1. اذهب إلى Vercel Dashboard
2. اختر المشروع 
3. اذهب إلى Functions → View Function Logs
4. ابحث عن رسائل تبدأ بـ `[CSV Processing]`

### 2. مشكلة Memory Storage في Serverless

**المشكلة:** 
البيانات تختفي بين الطلبات في بيئة Vercel Serverless

**الحل المؤقت:** 
التطبيق يستخدم Memory Storage، وهو مناسب للاختبار فقط. للإنتاج، استخدم قاعدة بيانات خارجية مثل:
- Vercel Postgres
- PlanetScale
- Supabase

### 3. حدود حجم الملف

**الحد الأقصى:** 50MB للملف الواحد
**التحقق:** التطبيق يتحقق من الحجم تلقائياً

### 4. خطوات النشر

1. **تأكد من وجود المتغيرات:**
   ```bash
   NODE_ENV=production
   ```

2. **تحقق من build script:**
   ```json
   "scripts": {
     "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
   }
   ```

3. **نشر الموقع:**
   ```bash
   vercel --prod
   ```

### 5. debugging في Vercel

عند فشل المعالجة، ستظهر رسائل مفصلة في console تتضمن:
- حجم الملف ومعلومات البيئة
- خطوات المعالجة التفصيلية
- أي أخطاء في قاعدة البيانات
- إحصائيات التخزين

**مثال على رسائل التتبع:**
```
[CSV Processing] Starting to parse file: report.csv, size: 4776 bytes
[CSV Processing] Environment: NODE_ENV=production, Platform: linux
[CSV Processing] Found 'Attendee Details' section at row 14
[MemStorage] Creating 32 attendees in memory storage
```

### 6. نصائح إضافية

- **استخدم ملفات صغيرة:** ابدأ بملفات أقل من 1MB للاختبار
- **تحقق من تنسيق الملف:** تأكد أن الملف يحتوي على قسم "Attendee Details"
- **راقب الـ logs:** استخدم Vercel Dashboard لمراقبة الأخطاء
- **اختبر محلياً أولاً:** تأكد أن كل شيء يعمل في البيئة المحلية

## المساعدة

إذا استمرت المشاكل، تحقق من:
1. Vercel Function Logs
2. تنسيق ملف CSV
3. حجم الملف
4. متغيرات البيئة