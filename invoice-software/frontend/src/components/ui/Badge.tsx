import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const statusMap: Record<string, BadgeVariant> = {
  paid: 'success',
  overdue: 'danger',
  pending: 'warning',
  draft: 'primary',
};

export default function Badge({ children, variant = 'primary' }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const variant = statusMap[normalized] ?? 'primary';
  return <Badge variant={variant}>{status}</Badge>;
}
