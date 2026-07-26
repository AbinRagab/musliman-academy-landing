import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { ComposeMessageModal, PaymentSummaryCard, StudentPageHeader, StudentStatCard } from '../components/student/StudentPortalComponents';
import { sendStudentMessage } from '../services/studentMessagesService';
import { fetchStudentPaymentsData } from '../services/studentPaymentsService';
import { openExternalLink, type StudentPayment } from '../services/studentService';

export default function StudentPayments() {
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [compose, setCompose] = useState<{ to: string; subject: string } | null>(null);

  useEffect(() => {
    fetchStudentPaymentsData().then((data) => setPayments(data.payments));
  }, []);

  const currentPackage = payments[0];
  const totals = useMemo(() => ({
    paidAmount: currentPackage?.paidAmount || '$0',
    dueAmount: currentPackage?.dueAmount || '$0',
    nextDueDate: currentPackage?.nextDueDate || 'Not scheduled',
    status: currentPackage?.status || 'pending',
  }), [currentPackage]);

  const columns: Array<DataTableColumn<StudentPayment>> = [
    { header: 'Payment Date', accessor: 'paymentDate' },
    { header: 'Amount', accessor: (row) => row.paidAmount },
    { header: 'Currency', accessor: 'currency' },
    { header: 'Method', accessor: 'method' },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    {
      header: 'Receipt',
      accessor: (row) => (
        <ActionButton
          variant="ghost"
          onClick={() => row.receiptUrl ? openExternalLink(row.receiptUrl) : setCompose({ to: 'Finance Team', subject: `Receipt request: ${row.packageName}` })}
        >
          View Receipt
        </ActionButton>
      ),
    },
  ];

  return (
    <div className="dashboard-page dashboard-page--management">
      {compose && (
        <ComposeMessageModal
          to={compose.to}
          subject={compose.subject}
          onClose={() => setCompose(null)}
          onSend={(payload) => sendStudentMessage(payload).then(() => setCompose(null))}
        />
      )}

      <StudentPageHeader
        title="Package & Payments"
        subtitle="View package status, payment history, invoices, receipts, and remaining sessions."
        action={(
          <ActionButton onClick={() => setCompose({ to: 'Finance Team', subject: 'Payment support request' })}>
            <Icon name="support" size={17} />
            Contact Finance
          </ActionButton>
        )}
      />

      {currentPackage && <PaymentSummaryCard payment={currentPackage} onContact={() => setCompose({ to: 'Finance Team', subject: 'Payment document request' })} />}

      <div className="dashboard-stats-grid">
        <StudentStatCard label="Paid Amount" value={totals.paidAmount} trend="Current package" icon="award" />
        <StudentStatCard label="Due Amount" value={totals.dueAmount} trend="Finance-managed status" icon="bell" />
        <StudentStatCard label="Next Due Date" value={totals.nextDueDate} trend="Package renewal" icon="calendar" />
        <StudentStatCard label="Payment Status" value={totals.status} trend="View only for student" icon="shieldCheck" />
      </div>

      <SectionCard title="Payment History" subtitle="Finance records are view-only in the student portal.">
        <DataTable columns={columns} rows={payments} getRowKey={(row) => row.id} />
      </SectionCard>

      <SectionCard title="Payment Actions">
        <div className="student-card-actions">
          <ActionButton variant="secondary" onClick={() => setCompose({ to: 'Finance Team', subject: 'Invoice request' })}>
            <Icon name="eye" size={16} />
            View Invoice
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => setCompose({ to: 'Finance Team', subject: 'Receipt request' })}>
            <Icon name="download" size={16} />
            Download Receipt
          </ActionButton>
          <ActionButton onClick={() => setCompose({ to: 'Academy Team', subject: 'Payment arrangement request' })}>
            <Icon name="support" size={16} />
            Contact Academy Team to Pay
          </ActionButton>
        </div>
      </SectionCard>
    </div>
  );
}
