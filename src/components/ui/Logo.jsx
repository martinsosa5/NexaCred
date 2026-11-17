export default function Logo({ light = false, size = 22 }) {
  return (
    <span className="logo" style={{ color: light ? '#fff' : 'var(--graphite)', fontSize: size }}>
      <img className="logo-mark" src="/nexacred-mark.svg" width={size * 1.8} height={size * 1.512} alt="" aria-hidden="true" />
      <span className="logo-text">
        Nexa<span style={{ color: light ? '#85d8f5' : 'var(--blue)' }}>Cred</span>
      </span>
    </span>
  );
}
