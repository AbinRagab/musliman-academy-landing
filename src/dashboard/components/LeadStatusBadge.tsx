import StatusBadge from './StatusBadge';
import type { LeadStatus } from '../services/leadsService';

const labelByStatus: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  no_response: 'No Response',
  follow_up_later: 'Follow-up Later',
  trial_scheduled: 'Trial Scheduled',
  trial_completed: 'Trial Completed',
  enrolled: 'Enrolled',
  lost: 'Lost',
};

export default function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <StatusBadge label={labelByStatus[status] || status} />;
}
