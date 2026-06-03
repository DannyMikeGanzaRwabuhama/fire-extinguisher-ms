import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusColors = {
  OPERATIONAL: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-transparent',
  EXPIRED:     'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-transparent',
  SCHEDULED:   'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-transparent',
  COMPLETED:   'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-transparent',
  CANCELLED:   'bg-muted text-muted-foreground border-transparent',
  ONGOING:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-transparent',
};

interface StatusBadgeProps {
  status: keyof typeof statusColors;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-muted text-muted-foreground border-transparent';
  return (
    <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${colorClass}`}>
      {status}
    </Badge>
  );
}
