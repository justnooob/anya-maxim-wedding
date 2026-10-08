// Retired: production uses long polling. Never accept updates here.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST() { return new Response(null, {status: 410}); }
