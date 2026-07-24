export type DashboardRole = 'admin' | 'teacher' | 'student';
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const adminStats = [
  { label: 'Active Students', value: '428', trend: '+18 this month', icon: 'users' },
  { label: 'Teachers', value: '36', trend: '7 departments', icon: 'teacher' },
  { label: 'Upcoming Classes', value: '84', trend: 'Next 7 days', icon: 'calendar' },
  { label: 'Pending Free Trials', value: '19', trend: 'Needs follow-up', icon: 'gift' },
];

export const academyOperations = [
  { title: 'Trial conversion', value: '68%', meta: '12 enrolled from 18 completed trials' },
  { title: 'Attendance health', value: '94%', meta: 'Across Quran and Arabic programs' },
  { title: 'Payment collection', value: '91%', meta: '24 invoices pending review' },
];

export const recentClasses = [
  { time: '09:00 AM', className: 'Quran Reading - Level 2', teacher: 'Ust. Maryam Ali', students: '6 students', status: 'Live' },
  { time: '11:30 AM', className: 'Arabic for Beginners', teacher: 'Sh. Omar Khaled', students: '8 students', status: 'Scheduled' },
  { time: '04:00 PM', className: 'Tajweed Practice', teacher: 'Ust. Aisha Noor', students: '4 students', status: 'Scheduled' },
];

export const users = [
  {
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@example.com',
    role: 'Super Admin',
    status: 'Active',
    permissions: 'All permissions',
  },
  {
    name: 'Maryam Ali',
    email: 'maryam.ali@example.com',
    role: 'Teacher',
    status: 'Active',
    permissions: 'Classes, Attendance, Evaluations',
  },
  {
    name: 'Sara Ibrahim',
    email: 'sara.ibrahim@example.com',
    role: 'Student',
    status: 'Active',
    permissions: 'Student portal',
  },
  {
    name: 'Omar Khaled',
    email: 'omar.khaled@example.com',
    role: 'Admin',
    status: 'Pending',
    permissions: 'Students, Trials, Reports',
  },
];

export const permissionToggles = [
  'Manage Students',
  'Manage Attendance',
  'Manage Free Trials',
  'View Reports',
  'Manage Classes',
  'Manage Payments',
  'Accounts & Roles',
  'System Settings',
];

export const permissionsMatrix = [
  { permission: 'Manage Students', superAdmin: true, admin: true, teacher: false, student: false },
  { permission: 'Manage Attendance', superAdmin: true, admin: true, teacher: true, student: false },
  { permission: 'Manage Free Trials', superAdmin: true, admin: true, teacher: true, student: false },
  { permission: 'View Reports', superAdmin: true, admin: true, teacher: true, student: false },
  { permission: 'Manage Classes', superAdmin: true, admin: true, teacher: true, student: false },
  { permission: 'Manage Payments', superAdmin: true, admin: true, teacher: false, student: false },
  { permission: 'Accounts & Roles', superAdmin: true, admin: false, teacher: false, student: false },
  { permission: 'System Settings', superAdmin: true, admin: false, teacher: false, student: false },
];

export const studentProfile = {
  name: 'Yusuf Ahmed',
  course: 'Quran Reading',
  teacher: 'Ust. Maryam Ali',
  attendanceRate: '96%',
  totalClasses: 42,
  completedLessons: 31,
  currentCourse: 'Quran Reading Level 3',
};

export const studentTimetable = [
  { time: 'Mon 05:00 PM', className: 'Quran Reading', teacher: 'Ust. Maryam Ali', status: 'Upcoming' },
  { time: 'Wed 05:00 PM', className: 'Tajweed Practice', teacher: 'Ust. Maryam Ali', status: 'Scheduled' },
  { time: 'Sat 10:00 AM', className: 'Arabic Basics', teacher: 'Sh. Omar Khaled', status: 'Scheduled' },
];

export const teacherStats = [
  { label: 'Assigned Students', value: '38', trend: '6 new this month', icon: 'users' },
  { label: "Today's Classes", value: '7', trend: '3 completed', icon: 'calendar' },
  { label: 'Upcoming Free Trials', value: '5', trend: 'Next 48 hours', icon: 'gift' },
  { label: 'Pending Evaluations', value: '11', trend: 'Due this week', icon: 'clipboard' },
];

export const teacherSchedule = [
  { time: '08:30 AM', student: 'Yusuf Ahmed', program: 'Quran Reading', status: 'Completed' },
  { time: '10:00 AM', student: 'Lina Omar', program: 'Arabic Language', status: 'Live' },
  { time: '01:30 PM', student: 'Adam Khan', program: 'Tajweed', status: 'Upcoming' },
  { time: '06:00 PM', student: 'Noor Hassan', program: 'Islamic Studies', status: 'Upcoming' },
];

export const teacherStudents = [
  { student: 'Yusuf Ahmed', level: 'Level 3', nextClass: 'Mon 05:00 PM', attendance: '96%' },
  { student: 'Lina Omar', level: 'Beginner', nextClass: 'Today 10:00 AM', attendance: '91%' },
  { student: 'Adam Khan', level: 'Tajweed 1', nextClass: 'Today 01:30 PM', attendance: '88%' },
  { student: 'Noor Hassan', level: 'Level 2', nextClass: 'Today 06:00 PM', attendance: '94%' },
];

export const attendanceStudents = ['Yusuf Ahmed', 'Lina Omar', 'Adam Khan', 'Noor Hassan'];

export const studentEvaluations = [
  { student: 'Yusuf Ahmed', recitation: 5, tajweed: 4, understanding: 5, status: 'Ready' },
  { student: 'Lina Omar', recitation: 4, tajweed: 3, understanding: 4, status: 'Draft' },
  { student: 'Adam Khan', recitation: 3, tajweed: 4, understanding: 3, status: 'Needs Review' },
];

export const freeTrials = [
  { student: 'Musa Patel', program: 'Quran Reading', dateTime: 'Tomorrow, 04:30 PM' },
  { student: 'Hana Smith', program: 'Arabic Language', dateTime: 'Saturday, 11:00 AM' },
  { student: 'Ibrahim Lee', program: 'Teacher Training', dateTime: 'Sunday, 07:00 PM' },
];

export const adminLeads = [
  { name: 'Musa Patel', contact: '+44 7700 900112', program: 'Quran Reading', source: 'Website Trial Form', owner: 'Admissions Team', status: 'new', nextFollowUp: 'Today 06:00 PM' },
  { name: 'Hana Smith', contact: '+1 202 555 0184', program: 'Arabic Language', source: 'WhatsApp', owner: 'Omar Khaled', status: 'contacted', nextFollowUp: 'Tomorrow 11:30 AM' },
  { name: 'Ibrahim Lee', contact: '+61 421 555 014', program: 'Teacher Training', source: 'Referral', owner: 'Ahmed Hassan', status: 'trial_scheduled', nextFollowUp: 'Sat 07:00 PM' },
  { name: 'Amina Khan', contact: '+49 151 555 019', program: 'Tajweed', source: 'Instagram', owner: 'Admissions Team', status: 'follow_up_later', nextFollowUp: 'Mon 03:00 PM' },
];

export const adminStudents = [
  { name: 'Yusuf Ahmed', program: 'Quran Reading', teacher: 'Ust. Maryam Ali', level: 'Level 3', attendance: '96%', status: 'active', nextClass: 'Mon 05:00 PM' },
  { name: 'Lina Omar', program: 'Arabic Language', teacher: 'Sh. Omar Khaled', level: 'Beginner', attendance: '91%', status: 'active', nextClass: 'Today 10:00 AM' },
  { name: 'Adam Khan', program: 'Tajweed', teacher: 'Ust. Aisha Noor', level: 'Tajweed 1', attendance: '88%', status: 'active', nextClass: 'Today 01:30 PM' },
  { name: 'Noor Hassan', program: 'Islamic Studies', teacher: 'Ust. Fatima Zaid', level: 'Level 2', attendance: '94%', status: 'pending', nextClass: 'Today 06:00 PM' },
];

export const adminTeachers = [
  { name: 'Ust. Maryam Ali', specialization: 'Quran Reading, Tajweed', students: 42, trials: 4, availability: 'Weekdays evenings', status: 'active' },
  { name: 'Sh. Omar Khaled', specialization: 'Arabic Language', students: 35, trials: 3, availability: 'Morning and weekends', status: 'active' },
  { name: 'Ust. Aisha Noor', specialization: 'Tajweed, Memorization', students: 29, trials: 2, availability: 'Flexible', status: 'active' },
  { name: 'Ust. Fatima Zaid', specialization: 'Islamic Studies', students: 24, trials: 1, availability: 'Evenings', status: 'pending' },
];

export const adminPayments = [
  { student: 'Yusuf Ahmed', program: 'Quran Reading', packageName: '12 Sessions', amount: '$120', status: 'paid', nextDue: 'Aug 01, 2026' },
  { student: 'Lina Omar', program: 'Arabic Language', packageName: '8 Sessions', amount: '$88', status: 'pending', nextDue: 'Jul 28, 2026' },
  { student: 'Adam Khan', program: 'Tajweed', packageName: 'Monthly', amount: '$95', status: 'overdue', nextDue: 'Jul 18, 2026' },
  { student: 'Noor Hassan', program: 'Islamic Studies', packageName: 'Trial Conversion', amount: '$65', status: 'paid', nextDue: 'Aug 10, 2026' },
];

export const adminReports = [
  { report: 'Enrollment Funnel', owner: 'Admissions', period: 'July 2026', status: 'completed', metric: '68% conversion' },
  { report: 'Attendance Health', owner: 'Academic Manager', period: 'Weekly', status: 'completed', metric: '94% attendance' },
  { report: 'Teacher Capacity', owner: 'Operations', period: 'Next 14 days', status: 'scheduled', metric: '82% utilized' },
  { report: 'Revenue Summary', owner: 'Finance', period: 'July 2026', status: 'pending', metric: '$18.4k billed' },
];

export const rolePermissionMatrix = [
  { area: 'Dashboard access', superAdmin: true, admin: true, teacher: true, student: true, admissions: true, finance: true, viewer: true },
  { area: 'Leads CRM', superAdmin: true, admin: true, teacher: false, student: false, admissions: true, finance: false, viewer: true },
  { area: 'Trial classes', superAdmin: true, admin: true, teacher: true, student: false, admissions: true, finance: false, viewer: true },
  { area: 'Students', superAdmin: true, admin: true, teacher: true, student: false, admissions: true, finance: false, viewer: true },
  { area: 'Teachers', superAdmin: true, admin: true, teacher: false, student: false, admissions: false, finance: false, viewer: true },
  { area: 'Attendance', superAdmin: true, admin: true, teacher: true, student: true, admissions: false, finance: false, viewer: true },
  { area: 'Payments', superAdmin: true, admin: true, teacher: false, student: true, admissions: false, finance: true, viewer: true },
  { area: 'Reports', superAdmin: true, admin: true, teacher: true, student: false, admissions: true, finance: true, viewer: true },
  { area: 'Settings', superAdmin: true, admin: true, teacher: false, student: false, admissions: false, finance: false, viewer: false },
  { area: 'User management', superAdmin: true, admin: true, teacher: false, student: false, admissions: false, finance: false, viewer: false },
];

export const teacherPerformance = [
  { label: 'Attendance completion', value: 92 },
  { label: 'Average student progress', value: 78 },
  { label: 'Evaluation completion', value: 84 },
];

export const studentAttendanceHistory = [
  { date: 'Jul 22, 2026', className: 'Quran Reading', teacher: 'Ust. Maryam Ali', status: 'present', notes: 'Strong fluency in revision.' },
  { date: 'Jul 20, 2026', className: 'Tajweed Practice', teacher: 'Ust. Maryam Ali', status: 'late', notes: 'Joined 8 minutes late.' },
  { date: 'Jul 17, 2026', className: 'Arabic Basics', teacher: 'Sh. Omar Khaled', status: 'present', notes: 'Completed vocabulary review.' },
  { date: 'Jul 15, 2026', className: 'Quran Reading', teacher: 'Ust. Maryam Ali', status: 'absent', notes: 'Parent informed absence.' },
];

export const studentProgressTopics = [
  { topic: 'Madd letters review', score: 'Excellent', feedback: 'Clear improvement in elongation timing.' },
  { topic: 'Surah Al-Mulk revision', score: 'Good', feedback: 'Needs daily repetition for fluency.' },
  { topic: 'Arabic reading practice', score: 'In progress', feedback: 'Letter joining is improving steadily.' },
];

export const studentPaymentSummary = [
  { packageName: 'Quran Reading - 12 Sessions', status: 'paid', nextDue: 'Aug 01, 2026', remaining: '7 sessions' },
];
