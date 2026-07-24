import { CSS } from '@dnd-kit/utilities';
import { useDraggable } from '@dnd-kit/core';
import LeadCard from './LeadCard';
import type { LeadRecord } from '../services/leadsService';

export default function LeadKanbanCard({
  lead,
  canDrag,
  onOpen,
  onQuickStatus,
}: {
  lead: LeadRecord;
  canDrag: boolean;
  onOpen: (lead: LeadRecord) => void;
  onQuickStatus: (lead: LeadRecord) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
    disabled: !canDrag,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      className={`lead-kanban-card${isDragging ? ' is-dragging' : ''}${canDrag ? ' is-draggable' : ''}`}
      style={style}
      {...attributes}
      {...listeners}
    >
      <LeadCard lead={lead} onOpen={onOpen} onQuickStatus={onQuickStatus} />
    </div>
  );
}
