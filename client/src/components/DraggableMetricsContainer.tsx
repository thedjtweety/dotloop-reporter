import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';

import { useSortable, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { MetricId } from '@/hooks/useMetricsOrder';

interface DraggableMetricProps {
  id: MetricId;
  isEditMode: boolean;
  children: React.ReactNode;
}

/**
 * Individual draggable metric card wrapper
 */
function DraggableMetric({ id, isEditMode, children }: DraggableMetricProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-2 hover:bg-accent/20 rounded transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className={isEditMode ? 'pl-12' : ''}>
        {children}
      </div>
    </div>
  );
}

interface DraggableMetricsContainerProps {
  metricsOrder: MetricId[];
  isEditMode: boolean;
  onReorder: (newOrder: MetricId[]) => void;
  children: React.ReactNode;
}

/**
 * Container component that wraps metrics with drag-and-drop functionality
 * Uses @dnd-kit for modern, accessible drag-and-drop
 */
export function DraggableMetricsContainer({
  metricsOrder,
  isEditMode,
  onReorder,
  children,
}: DraggableMetricsContainerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = metricsOrder.indexOf(active.id as MetricId);
      const newIndex = metricsOrder.indexOf(over.id as MetricId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(metricsOrder, oldIndex, newIndex);
        onReorder(newOrder);
      }
    }
  };

  if (!isEditMode) {
    // When not in edit mode, render children without drag-and-drop context
    return <>{children}</>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={metricsOrder}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}

export { DraggableMetric };
