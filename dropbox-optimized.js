// ============================================
// lib/dropbox.js — Optimizado para 2000+ productos
// ============================================
// - Cache en servidor (refresca cada 5 min, no cada visita)
// - Procesa imágenes en lotes de 10
// - Soporte de paginación
// - Extrae precio del nombre de carpeta

const DROPBOX_API = "https://api.dropboxapi.com/2";
const DROPBOX_CONTENT = "https://content.dropboxapi.com/2";

// ─── Token cache ─────────────────────────────
let cachedAccessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) return cachedAccessToken;

  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;

  if (!refreshToken) {
    const directToken = process.env.DROPBOX_ACCESS_TOKEN;
    if (!directToken) throw new Error("Configurar DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET");
    return directToken;
  }
  if (!appKey || !appSecret) throw new Error("DROPBOX_APP_KEY y DROPBOX_APP_SECRET requeridos");

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: appKey, client_secret: appSecret }),
  });

  if (!res.ok) throw new Error(`Error renovando token: ${await res.text()}`);
  const data = await res.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedAccessToken;
}

// ─── Catalog cache ───────────────────────────
let catalogCache = null;
let catalogCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

function getRootPath() {
  return process.env.DROPBOX_ROOT_PATH || "";
}

// ─── Dropbox API helpers ─────────────────────
async function listFolder(path) {
  const token = await getAccessToken();
  let allEntries = [];
  let hasMore = true;
  let cursor = null;

  while (hasMore) {
    const url = cursor ? `${DROPBOX_API}/files/list_folder/continue` : `${DROPBOX_API}/files/list_folder`;
    const body = cursor ? { cursor } : { path, recursive: false, include_deleted: false, limit: 2000 };

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Dropbox list error: ${await res.text()}`);
    const data = await res.json();
    allEntries = allEntries.concat(data.entries);
    hasMore = data.has_more;
    cursor = data.cursor;
  }

  return allEntries;
}

async function getTemporaryLink(filePath) {
  const token = await getAccessToken();
  const res = await fetch(`${DROPBOX_API}/files/get_temporary_link`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ path: filePath }),
  });
  if (!res.ok) throw new Error(`getTemporaryLink error: ${await res.text()}`);
  const data = await res.json();
  return data.link;
}

// Procesar imágenes en lotes para no saturar Dropbox
async function getLinksInBatches(products, batchSize = 10) {
  const results = [];
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (p) => {
        try {
          const img = await getTemporaryLink(p.path);
          return { ...p, img };
        } catch {
          return { ...p, img: null };
        }
      })
    );
    results.push(...batchResults);
  }
  return results;
}

async function loadPrices() {
  const token = await getAccessToken();
  const pricePath = `${getRootPath()}/precios.json`;
  try {
    const res = await fetch(`${DROPBOX_CONTENT}/files/download`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Dropbox-API-Arg": JSON.stringify({ path: pricePath }) },
    });
    if (!res.ok) return {};
    return JSON.parse(await res.text());
  } catch { return {}; }
}

function extractPriceFromCategory(name) {
  const match = name.match(/(\d+)\s*mil/i);
  if (match) return parseInt(match[1]) * 1000;
  const direct = name.match(/(\d+)/);
  if (direct && parseInt(direct[1]) > 100) return parseInt(direct[1]);
  return null;
}

// ─── Main: build full catalog with cache ─────
async function buildCatalog() {
  const [entries, prices] = await Promise.all([listFolder(getRootPath()), loadPrices()]);

  // Separar carpetas y archivos sueltos en raíz
  const folders = entries.filter((e) => e[".tag"] === "folder").sort((a, b) => a.name.localeCompare(b.name));
  const imageExts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

  // Procesar cada categoría
  const allProducts = [];
  const categories = [];

  for (const folder of folders) {
    const catName = folder.name;
    const catPrice = extractPriceFromCategory(catName);
    categories.push(catName);

    const catEntries = await listFolder(folder.path_lower);
    const imageFiles = catEntries.filter((e) => {
      if (e[".tag"] !== "file") return false;
      return imageExts.includes(e.name.toLowerCase().slice(e.name.lastIndexOf(".")));
    });

    // Preparar productos sin imágenes primero
    const products = imageFiles.map((e) => {
      const dotIdx = e.name.lastIndexOf(".");
      const name = e.name.slice(0, dotIdx);
      const priceInfo = prices[name] || {};
      return {
        id: e.id,
        name,
        category: catName,
        path: e.path_lower,
        price: priceInfo.price || catPrice || null,
        desc: priceInfo.desc || "",
        img: null,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Obtener links de imágenes en lotes
    const withImages = await getLinksInBatches(products, 10);
    allProducts.push(...withImages);
  }

  return {
    categories,
    products: allProducts,
    lastSync: new Date().toISOString(),
    totalProducts: allProducts.length,
    error: null,
  };
}

// ─── Exported: cached catalog ────────────────
export async function getCatalog() {
  // Usar cache si es válido
  if (catalogCache && Date.now() - catalogCacheTime < CACHE_DURATION) {
    return catalogCache;
  }

  try {
    console.log("Reconstruyendo catálogo desde Dropbox...");
    const catalog = await buildCatalog();
    catalogCache = catalog;
    catalogCacheTime = Date.now();
    console.log(`Catálogo listo: ${catalog.totalProducts} productos en ${catalog.categories.length} categorías`);
    return catalog;
  } catch (error) {
    console.error("Error building catalog:", error);
    // Si hay cache viejo, usarlo aunque esté expirado
    if (catalogCache) return { ...catalogCache, error: error.message };
    return { categories: [], products: [], lastSync: null, error: error.message };
  }
}

// Forzar reconstrucción del cache
export async function refreshCatalog() {
  catalogCache = null;
  catalogCacheTime = 0;
  return getCatalog();
}

export async function getProductImage(filePath) {
  return getTemporaryLink(filePath);
}
