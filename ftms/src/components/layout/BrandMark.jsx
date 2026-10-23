export default function BrandMark({ size = 30 }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M16 6v20" stroke="var(--accent-ink)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="5" stroke="var(--accent-ink)" strokeWidth="2.2" />
      <path d="M6.5 11.5h2.5v9H6.5M25.5 11.5H23v9h2.5" stroke="var(--accent-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
