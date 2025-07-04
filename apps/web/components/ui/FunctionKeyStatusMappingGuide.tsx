'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface StatusMapping {
  keyName: string;
  statusName: string;
  description?: string;
}

interface FunctionKeyStatusMappingGuideProps {
  mappings: StatusMapping[];
  className?: string;
}

export function FunctionKeyStatusMappingGuide({ 
  mappings,
  className
}: FunctionKeyStatusMappingGuideProps) {
  if (!mappings || mappings.length === 0) {
    return null;
  }
  
  return (
    <div className={cn("text-xs p-1 border rounded-md border-border", className)}>
      <h3 className="text-xs font-medium text-center text-card-foreground mb-1">Raccourcis Statuts</h3>
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
        {mappings.map((mapping) => (
          <div key={mapping.keyName} className="flex items-center space-x-1 px-1 py-0.5 border rounded-md bg-muted/50">
            <Badge variant="outline" className="px-1 py-0 text-xs">
              {mapping.keyName}
            </Badge>
            <span className="text-foreground whitespace-nowrap" title={mapping.statusName}>
              {mapping.statusName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

FunctionKeyStatusMappingGuide.displayName = 'FunctionKeyStatusMappingGuide'; 