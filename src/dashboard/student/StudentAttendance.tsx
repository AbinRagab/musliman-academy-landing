import { useEffect, useMemo, useState } from 'react';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu from '../components/DashboardActionMenu';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import ProgramSelect from '../components/ProgramSelect';
import SectionCard from '../components/SectionCard';
import {
  AttendanceBadge,
  StudentModal,
  StudentPageHeader,
  StudentStatCard,
} from '../components/student/StudentPortalComponents';
import { fetchStudentAttendanceData, reportAttendanceIssue, type StudentAttendanceFilters } from '../services/studentAttendanceService';
import { type StudentAttendanceRecord, type StudentAttendanceStatus } from '../services/studentService';
import { DashboardText } from '../i18n/DashboardLanguageProvider';

export default function StudentAttendance() {
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [issueRecord, setIssueRecord] = useState<StudentAttendanceRecord | null>(null);
  const [filters, setFilters] = useState<StudentAttendanceFilters>({ month: 'all', status: 'all', program: 'all' });

  useEffect(() => {
    fetchStudentAttendanceData().then((data) => setRecords(data.records));
  }, []);

  const filteredRecords = useMemo(() => records.filter((record) => {
    const statusMatches = filters.status === 'all' || record.status === filters.status;
    const programMatches = filters.program === 'all' || record.programId === filters.program || record.program === filters.program;
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

  const columns: Array<DataTableColumn<StudentAttendanceRecord>> = [
    { header: 'Class Date', accessor: 'classDate' },
    { header: 'Class', accessor: 'className' },
    { header: 'Teacher', accessor: 'teacher' },
    { header: 'Status', accessor: (row) => <AttendanceBadge status={row.status} /> },
    { header: 'Notes', accessor: 'notes' },
    { header: 'Action', accessor: (row) => <DashboardActionMenu actions={[{ label: 'Report Issue', onClick: () => setIssueRecord(row) }]} /> },
  ];

  return (
    <div className="dashboard-page dashboard-page--management">
      {issueRecord && (
        <StudentModal
          title="Report Attendance Issue"
          description="Attendance is view-only. Send a correction request if something looks wrong."
          onClose={() => setIssueRecord(null)}
          footer={<ActionButton type="submit" form="student-attendance-issue-form"><DashboardText>Submit Report</DashboardText></ActionButton>}
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
              <span><DashboardText>Selected attendance record</DashboardText></span>
              <input readOnly value={`${issueRecord.classDate} - ${issueRecord.className} - ${issueRecord.status}`} />
            </label>
            <label>
              <span><DashboardText>Reason</DashboardText></span>
              <select name="reason">
                <option><DashboardText>Status looks incorrect</DashboardText></option>
                <option><DashboardText>I joined but was marked absent</DashboardText></option>
                <option><DashboardText>Late record needs review</DashboardText></option>
                <option><DashboardText>Other attendance issue</DashboardText></option>
              </select>
            </label>
            <label>
              <span><DashboardText>Message</DashboardText></span>
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
            <span><DashboardText>Month</DashboardText></span>
            <select value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))}>
              <option value="all"><DashboardText>All months</DashboardText></option>
              <option value="Jul"><DashboardText>July 2026</DashboardText></option>
              <option value="Aug"><DashboardText>August 2026</DashboardText></option>
            </select>
          </label>
          <label>
            <span><DashboardText>Status</DashboardText></span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as StudentAttendanceStatus | 'all' }))}>
              <option value="all"><DashboardText>All statuses</DashboardText></option>
              <option value="present"><DashboardText>Present</DashboardText></option>
              <option value="absent"><DashboardText>Absent</DashboardText></option>
              <option value="late"><DashboardText>Late</DashboardText></option>
              <option value="excused"><DashboardText>Excused</DashboardText></option>
            </select>
          </label>
          <ProgramSelect label="Program / class" value={filters.program} onChange={(value) => setFilters((current) => ({ ...current, program: value }))} includeAllOption />
        </div>
      </SectionCard>

      <SectionCard title="Attendance History" subtitle="Teacher-marked attendance records">
        <DataTable columns={columns} rows={filteredRecords} getRowKey={(row) => row.id} />
      </SectionCard>
    </div>
  );
}
