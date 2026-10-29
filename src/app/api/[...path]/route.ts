import { NextRequest, NextResponse } from 'next/server';
import { handle } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function run(req: NextRequest) {
  let body: any = {};
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    // multipart (image uploads) is handed to api.ts as { form }; everything else stays JSON as before
    if ((req.headers.get('content-type') || '').startsWith('multipart/form-data')) body = { form: await req.formData().catch(() => undefined) };
    else body = await req.json().catch(() => ({}));
  }
  const [status, data] = await handle(req.method, req.nextUrl.pathname, body, req.headers.get('authorization') || '');
  return NextResponse.json(data, { status });
}

export { run as GET, run as POST, run as PATCH, run as PUT, run as DELETE };
