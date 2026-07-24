import { useDroppable } from '@dnd-kit/core';
import LeadStatusBadge from './LeadStatusBadge';
import LeadKanbanCard from './LeadKanbanCard';
import type { LeadRecord, LeadStatus } from '../services/leadsService';

export type LeadKanbanColumnConfig = {
  status: LeadStatus;
  label: string;
};

export default function LeadKanbanColumn({
  column,
  leads,
  canDrag,
  onOpenLead,
  onQuickStatus,
}: {
  column: LeadKanbanColumnConfig;
  leads: LeadRecord[];
  canDrag: boolean;
  onOpenLead: (lead: LeadRecord) => void;
  onQuickStatus: (lead: LeadRecord) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.status,
    data: { status: column.status },
  });

  return (
    <section ref={setNodeRef} className={`lead-kanban__column${isOver ? ' is-over' : ''}`}>
      <div className="lead-kanban__header">
        <LeadStatusBadge status={column.status} />
        <strong>{leads.length}</strong>
      </div>
      <div className="lead-kanban__cards">
        {leads.length ? (
          leads.map((lead) => (
            <LeadKanbanCard
              key={lead.id}
              lead={lead}
              canDrag={canDrag}
              onOpen={onOpenLead}
              onQuickStatus={onQuickStatus}
            />
          ))
        ) : (
          <div className="lead-kanban__empty">No {column.label.toLowerCase()} leads</div>
        )}
      </div>
    </section>
  );
}
