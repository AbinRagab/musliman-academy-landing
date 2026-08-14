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
  const logoWebp =
    variant === 'light'
      ? '/assets/optimized/musliman-logo-dark-bg-transparent.webp'
      : '/assets/optimized/musliman-logo-light-bg-transparent.webp';

  return (
    <a
      className={`brand-logo brand-logo--${variant}`}
      href="#home"
      aria-label="Musliman Academy home"
    >
      <picture>
        <source srcSet={logoWebp} type="image/webp" />
        <img
          className="brand-logo__image"
          src={logoSrc}
          alt="Musliman Academy"
          width="640"
          height="247"
          loading="eager"
          decoding="async"
        />
      </picture>
    </a>
  );
}
