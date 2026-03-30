// ============================================
// lib/dropbox.js — Conexión real con Dropbox API
// ============================================
// Estructura esperada en Dropbox:
//
// /Catalogo/
//   ├── Anillos/
//   │   ├── Anillo Solsticio.jpg
//   │   ├── Anillo Aurora.png
//   │   └── ...
//   ├── Collares/
//   │   ├── Collar Lumière.jpg
//   │   └── ...
//   ├── Pulseras/
//   │   └── ...
//   └── precios.json   ← OPCIONAL (ver formato abajo)
//
// precios.json (opcional, en la raíz de /Catalogo):
// {
//   "Anillo Solsticio": { "price": 245000, "desc": "Oro 18k con diamante" },
//   "Collar Lumière": { "price": 385000, "desc": "Cadena de oro con perla" }
// }
//
// Si un producto NO está en precios.json, aparece como "Consultar precio"

const DROPBOX_API = "https://api.dropboxapi.com/2";
const DROPBOX_CONTENT = "https://content.dropboxapi.com/2";

function getToken() {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("DROPBOX_ACCESS_TOKEN no configurado en .env.local");
  return token;
}

function getRootPath() {
  return process.env.DROPBOX_ROOT_PATH || "";
}

// Listar carpetas (categorías) dentro de la raíz
async function listCategories() {
  const token = getToken();
  const rootPath = getRootPath();

  const res = await fetch(`${DROPBOX_API}/files/list_folder`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: rootPath,
      recursive: false,
      include_deleted: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dropbox listCategories error: ${err}`);
  }

  const data = await res.json();

  // Solo carpetas (no archivos)
  return data.entries
    .filter((e) => e[".tag"] === "folder")
    .map((e) => ({
      name: e.name,
      path: e.path_lower,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Listar fotos dentro de una carpeta (categoría)
async function listProductsInCategory(categoryPath) {
  const token = getToken();

  const res = await fetch(`${DROPBOX_API}/files/list_folder`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: categoryPath,
      recursive: false,
      include_deleted: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dropbox listProducts error: ${err}`);
  }

  const data = await res.json();

  // Solo archivos de imagen
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  return data.entries
    .filter((e) => {
      if (e[".tag"] !== "file") return false;
      const ext = e.name.toLowerCase().slice(e.name.lastIndexOf("."));
      return imageExtensions.includes(ext);
    })
    .map((e) => {
      // Nombre del producto = nombre del archivo sin extensión
      const dotIndex = e.name.lastIndexOf(".");
      const productName = e.name.slice(0, dotIndex);

      return {
        id: e.id,
        name: productName,
        fileName: e.name,
        path: e.path_lower,
        modified: e.server_modified,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Obtener link temporal de imagen
async function getTemporaryLink(filePath) {
  const token = getToken();

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

// Obtener thumbnail (más rápido para la grilla)
async function getThumbnail(filePath, size = "w480h320") {
  const token = getToken();

  const res = await fetch(`${DROPBOX_CONTENT}/files/get_thumbnail_v2`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({
        resource: { ".tag": "path", path: filePath },
        format: { ".tag": "jpeg" },
        size: { ".tag": size },
        mode: { ".tag": "bestfit" },
      }),
    },
  });

  if (!res.ok) return null;

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

// Cargar precios.json (opcional)
async function loadPrices() {
  const token = getToken();
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
    // Si no existe precios.json, simplemente retornamos vacío
    return {};
  }
}

// ============================================
// FUNCIÓN PRINCIPAL: Obtener todo el catálogo
// ============================================
export async function getCatalog() {
  try {
    // 1. Obtener categorías y precios en paralelo
    const [categories, prices] = await Promise.all([
      listCategories(),
      loadPrices(),
    ]);

    // 2. Obtener productos de cada categoría en paralelo
    const catalogPromises = categories.map(async (cat) => {
      const products = await listProductsInCategory(cat.path);

      // 3. Obtener links temporales para las imágenes
      const productsWithImages = await Promise.all(
        products.map(async (product) => {
          let imageUrl;
          try {
            imageUrl = await getTemporaryLink(product.path);
          } catch {
            imageUrl = null;
          }

          // Buscar precio en precios.json
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

      return {
        name: cat.name,
        products: productsWithImages,
      };
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
    return {
      categories: [],
      products: [],
      lastSync: null,
      error: error.message,
    };
  }
}

// Obtener link de imagen individual (para el modal de detalle)
export async function getProductImage(filePath) {
  return getTemporaryLink(filePath);
}
