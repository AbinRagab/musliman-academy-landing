import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type DashboardLanguage = 'en' | 'ar';

const STORAGE_KEY = 'musliman-dashboard-language';

const arabic: Record<string, string> = {
  Language: 'اللغة',
  Dashboard: 'لوحة التحكم',
  'Leads CRM': 'إدارة العملاء المحتملين',
  Students: 'الطلاب',
  Teachers: 'المعلمون',
  'Trial Classes': 'الحصص التجريبية',
  Classes: 'الحصص',
  Attendance: 'الحضور',
  Compliance: 'الالتزام',
  Reports: 'التقارير',
  'Accounts & Roles': 'الحسابات والصلاحيات',
  Payments: 'المدفوعات',
  Settings: 'الإعدادات',
  Schedule: 'الجدول',
  'My Classes': 'حصصي',
  'Free Trial': 'الحصة التجريبية',
  Homework: 'الواجبات',
  Progress: 'التقدم',
  Messages: 'الرسائل',
  Profile: 'الملف الشخصي',
  'Student Evaluations': 'تقييمات الطلاب',
  'My Students': 'طلابي',
  'Free Trials': 'الحصص التجريبية',
  'Quran Reflection': 'تدبر قرآني',
  '“And say, My Lord, increase me in knowledge.”': '﴿وَقُل رَّبِّ زِدْنِي عِلْمًا﴾',
  'Surah Taha 20:114': 'سورة طه 20:114',
  'Close dashboard menu': 'إغلاق قائمة لوحة التحكم',
  '{{role}} dashboard navigation': 'قائمة لوحة {{role}}',
  'Open dashboard menu': 'فتح قائمة لوحة التحكم',
  'Musliman Academy': 'أكاديمية مسلمَن',
  'Role Based Dashboard': 'لوحة تحكم حسب الصلاحية',
  'Search dashboard': 'ابحث في لوحة التحكم',
  'Searching...': 'جارٍ البحث...',
  'No matching records': 'لا توجد سجلات مطابقة',
  Notifications: 'الإشعارات',
  '{{count}} unread': '{{count}} غير مقروء',
  'Mark all read': 'تحديد الكل كمقروء',
  'No notifications yet.': 'لا توجد إشعارات بعد.',
  'Account menu': 'قائمة الحساب',
  'Account actions': 'إجراءات الحساب',
  'View Profile': 'عرض الملف الشخصي',
  'Account Settings': 'إعدادات الحساب',
  'Sign out': 'تسجيل الخروج',
  'Academy User': 'مستخدم الأكاديمية',
  'Super Admin': 'مدير عام',
  Admin: 'مدير',
  Teacher: 'معلم',
  Student: 'طالب',
  Finance: 'المالية',
  Admissions: 'القبول',
  'Academic Manager': 'المدير الأكاديمي',
  Viewer: 'مشاهد',
  'Musliman Academy dashboard access': 'الدخول إلى لوحة أكاديمية مسلمَن',
  'Welcome to': 'مرحبًا بك في',
  'Musliman Academy Portal': 'بوابة أكاديمية مسلمَن',
  'Sign in to access your personalized Musliman Academy portal whether you are a student, teacher, or academy team member.':
    'سجّل الدخول للوصول إلى بوابتك المخصصة، سواء كنت طالبًا أو معلمًا أو أحد أعضاء فريق الأكاديمية.',
  'View your classes, progress, attendance, and learning journey.': 'تابع حصصك وتقدمك وحضورك ورحلتك التعليمية.',
  'Manage assigned students, free trials, attendance, and evaluations.':
    'أدِر الطلاب والحصص التجريبية والحضور والتقييمات.',
  'Academy Team': 'فريق الأكاديمية',
  'Track leads, trials, students, payments, and reports.':
    'تابع العملاء والحصص التجريبية والطلاب والمدفوعات والتقارير.',
  'Secure Access': 'دخول آمن',
  'Each user sees only the tools and information related to their role.':
    'يرى كل مستخدم الأدوات والمعلومات المرتبطة بصلاحيته فقط.',
  'Secure Academy Access': 'دخول آمن للأكاديمية',
  'Sign In': 'تسجيل الدخول',
  'Use your Musliman Academy account to access your role-based dashboard.':
    'استخدم حساب أكاديمية مسلمَن للوصول إلى لوحة التحكم الخاصة بصلاحيتك.',
  Email: 'البريد الإلكتروني',
  Password: 'كلمة المرور',
  'Enter your password': 'أدخل كلمة المرور',
  'Show password': 'إظهار كلمة المرور',
  'Hide password': 'إخفاء كلمة المرور',
  'Remember me': 'تذكرني',
  'Forgot Password?': 'نسيت كلمة المرور؟',
  'Signing in': 'جارٍ تسجيل الدخول',
  or: 'أو',
  'Need access?': 'تحتاج إلى صلاحية دخول؟',
  'Contact the Academy Team': 'تواصل مع فريق الأكاديمية',
  'Secure login': 'تسجيل دخول آمن',
  'Your data is protected': 'بياناتك محمية',
  'Unable to sign in. Check your credentials and try again.': 'تعذر تسجيل الدخول. تحقق من بياناتك وحاول مرة أخرى.',
  'LEADS CRM': 'إدارة العملاء المحتملين',
  'Admissions Pipeline': 'مسار القبول',
  'Track new inquiries, parent follow-ups, sources, trial readiness, and enrollment progress.':
    'تابع الطلبات الجديدة وتواصل أولياء الأمور والمصادر والاستعداد للحصة التجريبية والتسجيل.',
  'Add Lead': 'إضافة عميل',
  'Export Leads': 'تصدير العملاء',
  Refresh: 'تحديث',
  'Total Leads': 'إجمالي العملاء',
  'All admissions inquiries': 'كل استفسارات القبول',
  'Student Free Trial Leads': 'طلبات الحصص التجريبية',
  'Trial pipeline': 'مسار الحصة التجريبية',
  'Teacher Training Leads': 'طلبات تدريب المعلمين',
  'Training applications': 'طلبات التدريب',
  'New Leads': 'العملاء الجدد',
  'Awaiting first contact': 'بانتظار التواصل الأول',
  'Trials Scheduled': 'الحصص المجدولة',
  'Assigned to teachers': 'مُسندة إلى المعلمين',
  'Enrolled Students': 'الطلاب المسجلون',
  'Converted students': 'تم تحويلهم إلى طلاب',
  'Conversion Rate': 'معدل التحويل',
  'Lead to enrollment': 'من عميل إلى تسجيل',
  'Follow-ups Due Today': 'متابعات اليوم',
  'Admissions action': 'إجراءات فريق القبول',
  Search: 'بحث',
  'Search records': 'ابحث في السجلات',
  Status: 'الحالة',
  'Lead Type': 'نوع العميل',
  Program: 'البرنامج',
  Source: 'المصدر',
  Owner: 'المسؤول',
  'All statuses': 'كل الحالات',
  'All lead types': 'كل أنواع العملاء',
  'Teacher Training': 'تدريب معلمين',
  'All sources': 'كل المصادر',
  'All owners': 'كل المسؤولين',
  'All teachers': 'كل المعلمين',
  'Follow-up due today': 'متابعة مستحقة اليوم',
  From: 'من',
  To: 'إلى',
  Table: 'جدول',
  Pipeline: 'المسار',
  'Loading admissions pipeline': 'جارٍ تحميل مسار القبول',
  'No leads found': 'لا يوجد عملاء',
  'New website form submissions and manually added leads will appear here.':
    'ستظهر هنا الطلبات القادمة من الموقع والعملاء المضافون يدويًا.',
  '{{count}} leads': '{{count}} عميل',
  'Showing {{start}}-{{end}}': 'عرض {{start}}-{{end}}',
  Sort: 'الترتيب',
  Rows: 'الصفوف',
  'Newest first': 'الأحدث أولًا',
  'Oldest first': 'الأقدم أولًا',
  'Follow-up due': 'موعد المتابعة',
  'Name A-Z': 'الاسم أ-ي',
  'Status A-Z': 'الحالة أ-ي',
  Previous: 'السابق',
  Next: 'التالي',
  'Page {{current}} of {{total}}': 'صفحة {{current}} من {{total}}',
  Lead: 'العميل',
  Contact: 'التواصل',
  Acquisition: 'الاكتساب',
  Assignment: 'الإسناد',
  Dates: 'التواريخ',
  Actions: 'الإجراءات',
  'Country not set': 'الدولة غير محددة',
  website: 'الموقع',
  'Teacher Training form': 'نموذج تدريب المعلمين',
  'Free Trial form': 'نموذج الحصة التجريبية',
  Unassigned: 'غير معيّن',
  Reviewer: 'المراجع',
  'No teacher': 'لا يوجد معلم',
  'Created {{date}}': 'أُنشئ {{date}}',
  New: 'جديد',
  Contacted: 'تم التواصل',
  'No Response': 'لا يوجد رد',
  'Follow-up Later': 'متابعة لاحقًا',
  'Trial Scheduled': 'حصة مجدولة',
  'Trial Completed': 'الحصة مكتملة',
  Enrolled: 'مسجل',
  Lost: 'غير مهتم',
  'Student Lead': 'طلب طالب',
  'All programs': 'كل البرامج',
  'Select program': 'اختر البرنامج',
  'Loading programs...': 'جارٍ تحميل البرامج...',
  'Unable to load programs': 'تعذر تحميل البرامج',
  'No programs found': 'لا توجد برامج',
  'Previously selected program': 'البرنامج المحدد سابقًا',
};

type TranslateParams = Record<string, string | number>;

type DashboardLanguageContextValue = {
  language: DashboardLanguage;
  direction: 'ltr' | 'rtl';
  setLanguage: (language: DashboardLanguage) => void;
  t: (message: string, params?: TranslateParams) => string;
};

const DashboardLanguageContext = createContext<DashboardLanguageContextValue | null>(null);

function getInitialLanguage(): DashboardLanguage {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'ar') return saved;
  return document.documentElement.lang.startsWith('ar') ? 'ar' : 'en';
}

export function DashboardLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<DashboardLanguage>(getInitialLanguage);
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  const context = useMemo<DashboardLanguageContextValue>(
    () => ({
      language,
      direction,
      setLanguage,
      t(message, params) {
        let result = language === 'ar' ? arabic[message] || message : message;
        Object.entries(params || {}).forEach(([key, value]) => {
          result = result.split(`{{${key}}}`).join(String(value));
        });
        return result;
      },
    }),
    [direction, language],
  );

  return (
    <DashboardLanguageContext.Provider value={context}>
      <div className="dashboard-language-root" dir={direction} lang={language}>
        {children}
      </div>
    </DashboardLanguageContext.Provider>
  );
}

export function useDashboardLanguage() {
  const context = useContext(DashboardLanguageContext);
  if (!context) throw new Error('Dashboard language context is unavailable.');
  return context;
}

export function DashboardLanguageSelect({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useDashboardLanguage();

  return (
    <label className={`dashboard-language-select ${className}`.trim()}>
      <span className="dashboard-sr-only">{t('Language')}</span>
      <select
        aria-label={t('Language')}
        value={language}
        onChange={(event) => setLanguage(event.target.value as DashboardLanguage)}
      >
        <option value="en">English</option>
        <option value="ar">العربية</option>
      </select>
    </label>
  );
}
