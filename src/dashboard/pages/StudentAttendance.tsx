import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import {
  AttendanceBadge,
  StudentModal,
  StudentPageHeader,
  StudentStatCard,
} from '../components/student/StudentPortalComponents';
import { fetchStudentAttendanceData, reportAttendanceIssue, type StudentAttendanceFilters } from '../services/studentAttendanceService';
import { type StudentAttendanceRecord, type StudentAttendanceStatus } from '../services/studentService';

export default function StudentAttendance() {
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [issueRecord, setIssueRecord] = useState<StudentAttendanceRecord | null>(null);
  const [filters, setFilters] = useState<StudentAttendanceFilters>({ month: 'all', status: 'all', program: 'all' });

  useEffect(() => {
    fetchStudentAttendanceData().then((data) => setRecords(data.records));
  }, []);

  const filteredRecords = useMemo(() => records.filter((record) => {
    const statusMatches = filters.status === 'all' || record.status === filters.status;
    const programMatches = filters.program === 'all' || record.program === filters.program;
    const monthMatches = filters.month === 'all' || record.classDate.includes(filters.month);
    return statusMatches && programMatches && monthMatches;
  }), [filters, records]);

  const summary = useMemo(() => {
    const present = records.filter((record) => record.status === 'present').length;
    const late = records.filter((record) => record.status === 'late').length;
    const absent = records.filter((record) => record.status === 'absent').length;
    const excused = records.filter((record) => record.status === 'excused').length;
    const rate = records.length ? Math.round(((present + late) / records.length) * 100) : 0;
    return { rate, present, late, absent, excused };
  }, [records]);

  const programs = Array.from(new Set(records.map((record) => record.program)));
  const columns: Array<DataTableColumn<StudentAttendanceRecord>> = [
    { header: 'Class Date', accessor: 'classDate' },
    { header: 'Class', accessor: 'className' },
    { header: 'Teacher', accessor: 'teacher' },
    { header: 'Status', accessor: (row) => <AttendanceBadge status={row.status} /> },
    { header: 'Notes', accessor: 'notes' },
    { header: 'Action', accessor: (row) => <ActionButton variant="ghost" onClick={() => setIssueRecord(row)}>Report Issue</ActionButton> },
  ];

  return (
    <div className="dashboard-page dashboard-page--management">
      {issueRecord && (
        <StudentModal
          title="Report Attendance Issue"
          description="Attendance is view-only. Send a correction request if something looks wrong."
          onClose={() => setIssueRecord(null)}
          footer={<ActionButton type="submit" form="student-attendance-issue-form">Submit Report</ActionButton>}
        >
          <form
            id="student-attendance-issue-form"
            className="dashboard-form"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              reportAttendanceIssue({
                attendanceId: issueRecord.id,
                reason: String(formData.get('reason') || ''),
                message: String(formData.get('message') || ''),
              }).then(() => setIssueRecord(null));
            }}
          >
            <label>
              <span>Selected attendance record</span>
              <input readOnly value={`${issueRecord.classDate} - ${issueRecord.className} - ${issueRecord.status}`} />
            </label>
            <label>
              <span>Reason</span>
              <select name="reason">
                <option>Status looks incorrect</option>
                <option>I joined but was marked absent</option>
                <option>Late record needs review</option>
                <option>Other attendance issue</option>
              </select>
            </label>
            <label>
              <span>Message</span>
              <textarea name="message" rows={4} required />
            </label>
          </form>
        </StudentModal>
      )}

      <StudentPageHeader title="Attendance" subtitle="Attendance history, status summary, and correction requests." />

      <div className="dashboard-stats-grid">
        <StudentStatCard label="Attendance Rate" value={`${summary.rate}%`} trend="Present and late sessions" icon="chart" />
        <StudentStatCard label="Present Count" value={summary.present} trend="Marked present" icon="checkCircle" />
        <StudentStatCard label="Absent Count" value={summary.absent} trend="Marked absent" icon="x" />
        <StudentStatCard label="Late / Excused" value={`${summary.late} / ${summary.excused}`} trend="Late and excused records" icon="clipboard" />
      </div>

      <SectionCard title="Filters" subtitle="Filter history by month, status, and program">
        <div className="dashboard-filters">
          <label>
            <span>Month</span>
            <select value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))}>
              <option value="all">All months</option>
              <option value="Jul">July 2026</option>
              <option value="Aug">August 2026</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as StudentAttendanceStatus | 'all' }))}>
              <option value="all">All statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </label>
          <label>
            <span>Program / class</span>
            <select value={filters.program} onChange={(event) => setFilters((current) => ({ ...current, program: event.target.value }))}>
              <option value="all">All programs</option>
              {programs.map((program) => <option key={program} value={program}>{program}</option>)}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Attendance History" subtitle="Teacher-marked attendance records">
        <DataTable columns={columns} rows={filteredRecords} getRowKey={(row) => row.id} />
      </SectionCard>
    </div>
  );
}
