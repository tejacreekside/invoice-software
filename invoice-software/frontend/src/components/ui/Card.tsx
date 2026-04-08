import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export default function Card({ title, description, className = '', children }: CardProps) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || description) && (
        <div className="card-header">
          {title && <h2>{title}</h2>}
          {description && <p>{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
