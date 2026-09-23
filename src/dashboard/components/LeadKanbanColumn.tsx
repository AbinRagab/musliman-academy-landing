import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import LeadStatusBadge from './LeadStatusBadge';
import LeadKanbanCard from './LeadKanbanCard';
import type { LeadRecord, LeadStatus } from '../services/leadsService';
import { DashboardText } from '../i18n/DashboardLanguageProvider';

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
  const [visibleCount, setVisibleCount] = useState(10);
  const { isOver, setNodeRef } = useDroppable({
    id: column.status,
    data: { status: column.status },
  });
  const visibleLeads = leads.slice(0, visibleCount);
  const hiddenCount = Math.max(leads.length - visibleLeads.length, 0);

  return (
    <section ref={setNodeRef} className={`lead-kanban__column${isOver ? ' is-over' : ''}`}>
      <div className="lead-kanban__header">
        <LeadStatusBadge status={column.status} />
        <strong>{leads.length}</strong>
      </div>
      <div className="lead-kanban__cards">
        {leads.length ? (
          <>
            {visibleLeads.map((lead) => (
              <LeadKanbanCard
                key={lead.id}
                lead={lead}
                canDrag={canDrag}
                onOpen={onOpenLead}
                onQuickStatus={onQuickStatus}
              />
            ))}
            {hiddenCount > 0 && (
              <button className="lead-kanban__show-more" type="button" onClick={() => setVisibleCount((current) => current + 10)}>
                <DashboardText>Show 10 more (</DashboardText>{hiddenCount} <DashboardText>hidden)</DashboardText>
              </button>
            )}
          </>
        ) : (
          <div className="lead-kanban__empty"><DashboardText>No</DashboardText> {column.label.toLowerCase()} <DashboardText>leads</DashboardText></div>
        )}
      </div>
    </section>
  );
}
