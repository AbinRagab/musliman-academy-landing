import { NextResponse, type NextRequest } from 'next/server';
import { defaultLanguage, isLanguage, localizedPath } from './lib/languages';

// The site root has no page of its own: send visitors to a localized homepage.
// Legacy `/?lang=xx` links move permanently to `/xx`, keeping booking context
// such as `program` and `type`; browsers carry `#fragments` across redirects.
export function proxy(request: NextRequest) {
  const destination = request.nextUrl.clone();
  // Accept the forms the old client accepted, such as `AR` or `ar-EG`.
  const requested = destination.searchParams.get('lang')?.toLowerCase().split('-')[0];
  destination.searchParams.delete('lang');
  destination.pathname = localizedPath(isLanguage(requested) ? requested : defaultLanguage);
  // Next.js sends same-host redirects with a relative Location header.
  return NextResponse.redirect(destination, isLanguage(requested) ? 308 : 307);
}

export const config = {
  matcher: '/',
};
