import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

export default function FormField({ label, optional, className = '', children }: FormFieldProps) {
  return (
    <label className={`form-field ${className}`.trim()}>
      <div className="form-field-label">
        <span>{label}</span>
        {optional && <span className="form-field-optional">Optional</span>}
      </div>
      {children}
    </label>
  );
}
