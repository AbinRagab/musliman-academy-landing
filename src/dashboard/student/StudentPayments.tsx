import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu from '../components/DashboardActionMenu';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { ComposeMessageModal, PaymentSummaryCard, StudentPageHeader, StudentStatCard } from '../components/student/StudentPortalComponents';
import { sendStudentMessage } from '../services/studentMessagesService';
import { fetchStudentPaymentsData, getStudentPaymentReceiptUrl } from '../services/studentPaymentsService';
import { openExternalLink, type StudentPayment } from '../services/studentService';
import { DashboardText } from '../i18n/DashboardLanguageProvider';

export default function StudentPayments() {
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compose, setCompose] = useState<{ to: string; subject: string } | null>(null);

  useEffect(() => {
    fetchStudentPaymentsData()
      .then((data) => {
        setPayments(data.payments);
        setError('');
      })
      .catch((paymentError) => {
        if (import.meta.env.DEV) {
          console.error('Student payments fetch failed:', paymentError);
        }
        setError('Unable to load payment records.');
      })
      .finally(() => setLoading(false));
  }, []);

  const currentPackage = payments[0];
  const totals = useMemo(() => ({
    paidAmount: currentPackage?.paidAmount || 'Not provided',
    dueAmount: currentPackage?.dueAmount || 'Not provided',
    nextDueDate: currentPackage?.nextDueDate || 'Not scheduled',
    status: currentPackage?.status || 'pending',
  }), [currentPackage]);

  async function openReceipt(row: StudentPayment) {
    try {
      const url = await getStudentPaymentReceiptUrl(row);
      openExternalLink(url);
      setError('');
    } catch (receiptError) {
      setError(receiptError instanceof Error ? receiptError.message : 'Unable to open receipt.');
      setCompose({ to: 'Finance Team', subject: `Receipt request: ${row.packageName}` });
    }
  }

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
          onClick={() => (row.receiptUrl || row.receiptFilePath) ? openReceipt(row) : setCompose({ to: 'Finance Team', subject: `Receipt request: ${row.packageName}` })}
        >
          {(row.receiptUrl || row.receiptFilePath) ? 'View Receipt' : 'Request Receipt'}
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
            <DashboardText>Contact Finance</DashboardText>
          </ActionButton>
        )}
      />

      {currentPackage && <PaymentSummaryCard payment={currentPackage} onContact={() => setCompose({ to: 'Finance Team', subject: 'Payment document request' })} onReceipt={() => openReceipt(currentPackage)} />}

      <div className="dashboard-stats-grid">
        <StudentStatCard label="Paid Amount" value={totals.paidAmount} trend="Current package" icon="award" />
        <StudentStatCard label="Due Amount" value={totals.dueAmount} trend="Finance-managed status" icon="bell" />
        <StudentStatCard label="Next Due Date" value={totals.nextDueDate} trend="Package renewal" icon="calendar" />
        <StudentStatCard label="Payment Status" value={totals.status} trend="View only for student" icon="shieldCheck" />
      </div>

      <SectionCard title="Payment History" subtitle="Finance records are view-only in the student portal.">
        {loading && <p className="dashboard-empty-copy"><DashboardText>Loading payment records...</DashboardText></p>}
        {!loading && error && <p className="dashboard-inline-error">{error}</p>}
        {!loading && !error && payments.length === 0 && <p className="dashboard-empty-copy"><DashboardText>No payment records yet.</DashboardText></p>}
        {!loading && !error && payments.length > 0 && <DataTable columns={columns} rows={payments} getRowKey={(row) => row.id} />}
      </SectionCard>

      <SectionCard title="Payment Actions">
        <div className="student-card-actions">
          <DashboardActionMenu
            primaryAction={{
              label: 'Contact Academy to Pay',
              icon: <Icon name="support" size={15} />,
              onClick: () => setCompose({ to: 'Academy Team', subject: 'Payment arrangement request' }),
            }}
            actions={[
              { label: currentPackage?.invoiceUrl ? 'View Invoice' : 'Request Invoice', icon: <Icon name="eye" size={15} />, onClick: () => currentPackage?.invoiceUrl ? openExternalLink(currentPackage.invoiceUrl) : setCompose({ to: 'Finance Team', subject: 'Invoice request' }) },
              { label: currentPackage?.receiptUrl || currentPackage?.receiptFilePath ? 'Download Receipt' : 'Request Receipt', icon: <Icon name="download" size={15} />, onClick: () => currentPackage ? openReceipt(currentPackage) : setCompose({ to: 'Finance Team', subject: 'Receipt request' }) },
              { label: 'Contact Finance', icon: <Icon name="support" size={15} />, onClick: () => setCompose({ to: 'Finance Team', subject: 'Payment support request' }) },
            ]}
          />
        </div>
      </SectionCard>
    </div>
  );
}
