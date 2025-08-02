import type { VisitStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

const statusConfig = {
  'on-schedule': {
    label: 'On Schedule',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  },
  'approaching': {
    label: 'Approaching',
    icon: AlertTriangle,
    className: 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  },
  'overdue': {
    label: 'Overdue',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  },
  'no-visits': {
    label: 'No Visits',
    icon: HelpCircle,
    className: 'bg-muted text-muted-foreground border',
  },
};

type StatusBadgeProps = {
  status: VisitStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
      config.className,
      className,
    )}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </div>
  );
}
