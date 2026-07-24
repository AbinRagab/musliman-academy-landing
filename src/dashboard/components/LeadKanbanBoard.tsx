import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import LeadCard from './LeadCard';
import LeadKanbanColumn, { type LeadKanbanColumnConfig } from './LeadKanbanColumn';
import type { LeadRecord, LeadStatus } from '../services/leadsService';

const columns: LeadKanbanColumnConfig[] = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'no_response', label: 'No Response' },
  { status: 'follow_up_later', label: 'Follow-up Later' },
  { status: 'trial_scheduled', label: 'Trial Scheduled' },
  { status: 'trial_completed', label: 'Trial Completed' },
  { status: 'enrolled', label: 'Enrolled' },
  { status: 'lost', label: 'Lost' },
];

export default function LeadKanbanBoard({
  leads,
  canDrag = false,
  onMoveLead,
  onOpenLead,
  onQuickStatus,
}: {
  leads: LeadRecord[];
  canDrag?: boolean;
  onMoveLead?: (lead: LeadRecord, status: LeadStatus) => void | Promise<void>;
  onOpenLead: (lead: LeadRecord) => void;
  onQuickStatus: (lead: LeadRecord) => void;
}) {
  const [activeLead, setActiveLead] = useState<LeadRecord | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveLead((event.active.data.current?.lead as LeadRecord | undefined) || null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const lead = event.active.data.current?.lead as LeadRecord | undefined;
    const status = event.over?.data.current?.status as LeadStatus | undefined;

    setActiveLead(null);

    if (!lead || !status || lead.status === status || !onMoveLead) {
      return;
    }

    await onMoveLead(lead, status);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveLead(null)}
    >
      <div className={`lead-kanban${canDrag ? ' is-draggable' : ''}`}>
        {columns.map((column) => (
          <LeadKanbanColumn
            key={column.status}
            column={column}
            leads={leads.filter((lead) => lead.status === column.status)}
            canDrag={canDrag}
            onOpenLead={onOpenLead}
            onQuickStatus={onQuickStatus}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeLead && (
          <div className="lead-card-drag-overlay">
            <LeadCard lead={activeLead} onOpen={() => undefined} onQuickStatus={() => undefined} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
