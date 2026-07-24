import LeadCard from './LeadCard';
import LeadStatusBadge from './LeadStatusBadge';
import type { LeadRecord, LeadStatus } from '../services/leadsService';

const columns: Array<{ status: LeadStatus; label: string }> = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'follow_up_later', label: 'Follow-up Later' },
  { status: 'trial_scheduled', label: 'Trial Scheduled' },
  { status: 'trial_completed', label: 'Trial Completed' },
  { status: 'enrolled', label: 'Enrolled' },
  { status: 'lost', label: 'Lost' },
];

export default function LeadKanbanBoard({
  leads,
  onOpenLead,
  onQuickStatus,
}: {
  leads: LeadRecord[];
  onOpenLead: (lead: LeadRecord) => void;
  onQuickStatus: (lead: LeadRecord) => void;
}) {
  return (
    <div className="lead-kanban">
      {columns.map((column) => {
        const columnLeads = leads.filter((lead) => lead.status === column.status);

        return (
          <section className="lead-kanban__column" key={column.status}>
            <div className="lead-kanban__header">
              <LeadStatusBadge status={column.status} />
              <strong>{columnLeads.length}</strong>
            </div>
            <div className="lead-kanban__cards">
              {columnLeads.length ? (
                columnLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onOpen={onOpenLead} onQuickStatus={onQuickStatus} />
                ))
              ) : (
                <div className="lead-kanban__empty">No {column.label.toLowerCase()} leads</div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
