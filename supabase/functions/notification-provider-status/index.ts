import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const emailConfigured = Boolean(
    Deno.env.get('RESEND_API_KEY')
    || Deno.env.get('SENDGRID_API_KEY')
    || Deno.env.get('SMTP_HOST'),
  );
  const whatsappConfigured = Boolean(
    Deno.env.get('WHATSAPP_TOKEN')
    && Deno.env.get('WHATSAPP_PHONE_NUMBER_ID'),
  );

  return jsonResponse({
    emailConfigured,
    whatsappConfigured,
  });
});
