/** Lightweight endpoint pinged by the keep-warm scheduled function. */
export function GET() {
  return Response.json({ ok: true, at: new Date().toISOString() });
}
