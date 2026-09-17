import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="route-not-found">
      <Image
        src="/assets/musliman-logo-light-bg-transparent.png"
        alt="Musliman Academy"
        width={640}
        height={247}
      />
      <p className="route-not-found__code">404</p>
      <h1>Page not found</h1>
      <p>The page you requested does not exist or may have moved.</p>
      <Link href="/">Return to Musliman Academy</Link>
    </main>
  );
}
