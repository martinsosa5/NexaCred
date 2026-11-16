export default function Logo({ light = false, size = 22 }) {
  return (
    <span className="logo" style={{ color: light ? '#fff' : 'var(--graphite)', fontSize: size }}>
      <svg width={size * 1.35} height={size * 1.35} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--blue)" />
        <path d="M7 22l6-7 4 4 8-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="logo-text">
        Nexa<span style={{ color: light ? '#8fb6f5' : 'var(--blue)' }}>Cred</span>
      </span>
    </span>
  );
}
