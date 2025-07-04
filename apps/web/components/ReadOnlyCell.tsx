import React from 'react';

interface ReadOnlyCellProps {
  value: string | null | undefined;
  emptyPlaceholder?: string;
}

export const ReadOnlyCell: React.FC<ReadOnlyCellProps> = React.memo(({
  value,
  emptyPlaceholder = 'Vide',
}) => {
  return (
    <div className="p-2 h-full min-h-[30px] flex items-center w-full">
      {value ? (
        <span>{String(value)}</span>
      ) : (
        <span className="text-muted-foreground italic">{emptyPlaceholder}</span>
      )}
    </div>
  );
});

ReadOnlyCell.displayName = 'ReadOnlyCell'; 