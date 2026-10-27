import { teachers } from '../../../lib/catalog';

// The approved portraits are bundled as data URIs; serve each one as a static
// file so profile metadata can reference it with an absolute URL.
export const dynamicParams = false;

export function generateStaticParams() {
  return teachers.map(teacher => ({ file: `${teacher.id}.jpg` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const teacher = teachers.find(candidate => `${candidate.id}.jpg` === file);
  const match = teacher?.photo.match(/^data:(image\/jpeg);base64,(.+)$/);
  if (!match) return new Response('Not found', { status: 404 });
  return new Response(Buffer.from(match[2], 'base64'), {
    headers: { 'Content-Type': match[1], 'Cache-Control': 'public, max-age=86400' },
  });
}
