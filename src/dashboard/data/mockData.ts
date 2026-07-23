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
