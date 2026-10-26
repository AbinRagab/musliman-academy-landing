import { cp, lstat, mkdir, readdir, rm, unlink } from 'node:fs/promises';
import { URL, fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(repositoryRoot, 'public');
const destination = path.join(repositoryRoot, 'apps', 'public-site', 'public');
const metadataRoutes = new Set(['robots.txt', 'sitemap.xml', 'manifest.webmanifest']);

// A Windows checkout of the old symlink may be a text file; on other systems
// it may still be a symlink. Remove either without following the link.
try {
  const current = await lstat(destination);
  if (current.isDirectory()) {
    await rm(destination, { recursive: true, force: true });
  } else {
    await unlink(destination);
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

await mkdir(destination, { recursive: true });
for (const entry of await readdir(source, { withFileTypes: true })) {
  if (metadataRoutes.has(entry.name)) continue;
  await cp(path.join(source, entry.name), path.join(destination, entry.name), {
    recursive: true,
  });
}
