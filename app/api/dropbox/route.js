// ============================================
// app/api/dropbox/route.js — API endpoint del catálogo
// ============================================
// Se llama desde el frontend para obtener productos
// Revalida automáticamente según REVALIDATE_SECONDS

import { getCatalog } from "@/lib/dropbox";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await getCatalog();

    return Response.json(catalog, {
      headers: {
        "Cache-Control": `s-maxage=${process.env.REVALIDATE_SECONDS || 60}, stale-while-revalidate`,
      },
    });
  } catch (error) {
    return Response.json(
      { error: error.message, categories: [], products: [] },
      { status: 500 }
    );
  }
}
