"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Props for the internal SortableItem wrapper.
 *
 * @property id - Unique identifier for the sortable item
 * @property children - Content to render inside the sortable wrapper
 */
interface SortableItemProps {
  id: string;
  children: ReactNode;
}

/**
 * Internal wrapper that makes a child element sortable via drag handle.
 *
 * @param props - Sortable item configuration
 * @returns Draggable item with grip handle
 * @internal
 */

function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute top-3 left-2 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="size-4 text-slate-400" />
      </div>
      <div className="pl-8">{children}</div>
    </div>
  );
}

/**
 * Props for the DraggableList component.
 *
 * @template T - Type of items in the list
 * @property items - Array of items to render and reorder
 * @property onReorder - Callback with reordered items after drag-and-drop
 * @property renderItem - Render function for each list item
 * @property getItemId - Function to extract unique ID from each item
 */
export interface DraggableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  getItemId: (item: T) => string;
}

/**
 * Generic drag-and-drop reorderable list component.
 * Uses @dnd-kit for accessible keyboard and pointer-based sorting.
 *
 * @template T - Type of items in the list
 * @param props - List configuration with items and callbacks
 * @returns Sortable list with drag handles
 *
 * @example
 * ```tsx
 * <DraggableList
 *   items={experiences}
 *   onReorder={setExperiences}
 *   getItemId={(item) => item._id}
 *   renderItem={(item, index) => <ExperienceCard {...item} />}
 * />
 * ```
 */

export default function DraggableList<T>({ items, onReorder, renderItem, getItemId }: DraggableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => getItemId(item) === active.id);
      const newIndex = items.findIndex((item) => getItemId(item) === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(getItemId)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {items.map((item, index) => (
            <SortableItem key={getItemId(item)} id={getItemId(item)}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
