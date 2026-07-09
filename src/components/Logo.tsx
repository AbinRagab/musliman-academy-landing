interface LogoProps {
  /**
   * dark  = logo suitable for light/white navbar
   * light = logo suitable for dark/navy background
   */
  variant?: 'light' | 'dark';
}

export default function Logo({ variant = 'dark' }: LogoProps) {
  const logoSrc =
    variant === 'light'
      ? '/assets/musliman-logo-dark-bg-transparent.png'
      : '/assets/musliman-logo-light-bg-transparent.png';

  return (
    <a
      className={`brand-logo brand-logo--${variant}`}
      href="#home"
      aria-label="Musliman Academy home"
    >
      <img
        className="brand-logo__image"
        src={logoSrc}
        alt="Musliman Academy"
        loading="eager"
      />
    </a>
  );
}
