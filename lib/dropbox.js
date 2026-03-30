// ============================================
// lib/dropbox.js — Conexión con Dropbox usando Refresh Token
// ============================================
// Usa OAuth2 refresh token para obtener access tokens automáticamente.
// El refresh token NO expira, así que la conexión es permanente.

const DROPBOX_API = "https://api.dropboxapi.com/2";
const DROPBOX_CONTENT = "https://content.dropboxapi.com/2";

// Cache del access token en memoria
let cachedAccessToken = null;
let tokenExpiresAt = 0;

// Obtener un access token fresco usando el refresh token
async function getAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;

  if (!refreshToken) {
    const directToken = process.env.DROPBOX_ACCESS_TOKEN;
    if (!directToken) {
      throw new Error(
        "Configurar DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET"
      );
    }
    return directToken;
  }

  if (!appKey || !appSecret) {
    throw new Error(
      "DROPBOX_APP_KEY y DROPBOX_APP_SECRET son requeridos con DROPBOX_REFRESH_TOKEN"
    );
  }

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: appKey,
      client_secret: appSecret,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error renovando token de Dropbox: ${err}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  console.log("Token de Dropbox renovado exitosamente");
  return cachedAccessToken;
}

function getRootPath() {
  return process.env.DROPBOX_ROOT_PATH || "";
}

async function listCategories() {
  const token = await getAccessToken();
  const rootPath = getRootPath();

  const res = await fetch(`${DROPBOX_API}/files/list_folder`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: rootPath, recursive: false, include_deleted: false }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dropbox listCategories error: ${err}`);
  }

  const data = await res.json();
  return data.entries
    .filter((e) => e[".tag"] === "folder")
    .map((e) => ({ name: e.name, path: e.path_lower }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function listProductsInCategory(categoryPath) {
  const token = await getAccessToken();

  const res = await fetch(`${DROPBOX_API}/files/list_folder`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: categoryPath, recursive: false, include_deleted: false }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dropbox listProducts error: ${err}`);
  }

  const data = await res.json();
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

  return data.entries
    .filter((e) => {
      if (e[".tag"] !== "file") return false;
      const ext = e.name.toLowerCase().slice(e.name.lastIndexOf("."));
      return imageExtensions.includes(ext);
    })
    .map((e) => {
      const dotIndex = e.name.lastIndexOf(".");
      return {
        id: e.id,
        name: e.name.slice(0, dotIndex),
        fileName: e.name,
        path: e.path_lower,
        modified: e.server_modified,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getTemporaryLink(filePath) {
  const token = await getAccessToken();

  const res = await fetch(`${DROPBOX_API}/files/get_temporary_link`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: filePath }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dropbox getTemporaryLink error: ${err}`);
  }

  const data = await res.json();
  return data.link;
}

async function loadPrices() {
  const token = await getAccessToken();
  const rootPath = getRootPath();
  const pricePath = `${rootPath}/precios.json`;

  try {
    const res = await fetch(`${DROPBOX_CONTENT}/files/download`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({ path: pricePath }),
      },
    });
    if (!res.ok) return {};
    const text = await res.text();
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function getCatalog() {
  try {
    const [categories, prices] = await Promise.all([listCategories(), loadPrices()]);

    const catalogPromises = categories.map(async (cat) => {
      const products = await listProductsInCategory(cat.path);

      const productsWithImages = await Promise.all(
        products.map(async (product) => {
          let imageUrl;
          try {
            imageUrl = await getTemporaryLink(product.path);
          } catch (imgErr) {
            console.error(`Error getting image for ${product.name}:`, imgErr.message);
            imageUrl = null;
          }

          const priceInfo = prices[product.name] || {};
          return {
            id: product.id,
            name: product.name,
            category: cat.name,
            img: imageUrl,
            price: priceInfo.price || null,
            desc: priceInfo.desc || "",
            modified: product.modified,
          };
        })
      );

      return { name: cat.name, products: productsWithImages };
    });

    const catalog = await Promise.all(catalogPromises);

    return {
      categories: catalog.map((c) => c.name),
      products: catalog.flatMap((c) => c.products),
      lastSync: new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    console.error("Error loading catalog from Dropbox:", error);
    return { categories: [], products: [], lastSync: null, error: error.message };
  }
}

export async function getProductImage(filePath) {
  return getTemporaryLink(filePath);
}
