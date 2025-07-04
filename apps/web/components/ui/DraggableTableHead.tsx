'use client';

import React, { useRef } from 'react';
import { useDrag, useDrop, XYCoord, DragSourceMonitor, DropTargetMonitor } from 'react-dnd';
import { flexRender, Header } from '@tanstack/react-table';
import { TableHead } from './table'; // Notre composant TableHead existant
// import { Contact } from '@/types/contact'; // Supprimé car non utilisé dans ce composant générique

const DND_ITEM_TYPE = 'COLUMN';

interface DraggableTableHeadProps<TData, TValue> extends React.ThHTMLAttributes<HTMLTableCellElement> {
  header: Header<TData, TValue>;
  index: number;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
  id: string; // L'ID de la colonne, ex: header.id
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export function DraggableTableHead<TData, TValue>({
  header,
  index,
  moveColumn,
  id,
  style,
  ...rest
}: DraggableTableHeadProps<TData, TValue>) {
  const ref = useRef<HTMLTableCellElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: DND_ITEM_TYPE,
    collect(monitor: DropTargetMonitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      if (!hoverBoundingRect) return; // Vérification ajoutée

      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return; // Vérification ajoutée

      const hoverClientX = (clientOffset as XYCoord).x - hoverBoundingRect.left;

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return;
      }

      moveColumn(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: DND_ITEM_TYPE,
    item: () => {
      return { id, index, type: DND_ITEM_TYPE }; // type ajouté ici
    },
    collect: (monitor: DragSourceMonitor<DragItem, unknown>) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const draggingStyle = isDragging ? { opacity: 0.4 } : {};

  return (
    <TableHead
      ref={ref}
      key={header.id} // key est déjà géré par le composant parent lors du map
      style={{
        ...style,
        ...draggingStyle,
        cursor: 'move',
        width: header.getSize(),
        display: 'flex',
        alignItems: 'center',
      }}
      {...rest}
      data-handler-id={handlerId} // Utilisation correcte de handlerId
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </TableHead>
  );
} 