import { getCatalog, refreshCatalog } from "@/lib/dropbox";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const catalog = forceRefresh ? await refreshCatalog() : await getCatalog();

    return Response.json(catalog, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    return Response.json({ error: error.message, categories: [], products: [] }, { status: 500 });
  }
}
