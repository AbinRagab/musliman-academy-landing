# Musliman Academy Public Site

This is the incremental Next.js replacement for the public marketing website.
The existing Vite application remains the production source for the dashboard
until the public site reaches visual and functional parity.

## Local development

```bash
npm install
npm run dev
```

## Environment variables

The public booking form continues to use the existing Supabase project and Edge
Function. Configure it with `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. The existing Vite dashboard continues to use
the equivalent `VITE_SUPABASE_*` variables.

## Deployment boundary

- `www.muslimanacademy.com`: this Next.js app after migration approval.
- `app.muslimanacademy.com`: the existing Vite dashboard after the split.
