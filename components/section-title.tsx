import { ReactNode } from "react";

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <span>{description}</span> : null}
      </div>
      {action}
    </div>
  );
}

