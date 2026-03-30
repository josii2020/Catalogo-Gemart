# 💎 Catálogo de Joyas — Sincronizado con Dropbox

Catálogo web profesional que se sincroniza automáticamente con tu Dropbox.
Cuando agregas o eliminas fotos en Dropbox, la web se actualiza sola.

---

## 🚀 Cómo funciona

```
Tu Dropbox                          Tu Web
─────────────                       ──────────
/Catalogo/                          ┌─────────────────┐
  ├── Anillos/                      │  MAISON BIJOUX   │
  │   ├── Anillo Sol.jpg    ──►     │  ┌───┐ ┌───┐    │
  │   └── Anillo Luna.jpg  ──►     │  │ 📷│ │ 📷│    │
  ├── Collares/                     │  └───┘ └───┘    │
  │   └── Collar Perla.jpg  ──►    │  ┌───┐           │
  ├── Pulseras/                     │  │ 📷│           │
  │   └── ...                       │  └───┘           │
  └── precios.json (opcional)       └─────────────────┘
```

**Agregar producto** → sube una foto a la carpeta → aparece en la web
**Eliminar producto** → borra la foto → desaparece de la web
**Nueva categoría** → crea una carpeta nueva → aparece como tab

---

## 📋 Configuración paso a paso

### 1. Crear la app en Dropbox

1. Ve a https://www.dropbox.com/developers/apps
2. Click **"Create app"**
3. Elige **"Scoped access"**
4. Elige **"Full Dropbox"**
5. Ponle un nombre (ej: "Mi Catálogo de Joyas")
6. En **Permissions**, activa:
   - `files.metadata.read`
   - `files.content.read`
7. Click **"Submit"**
8. Vuelve a **Settings** → genera un **Access Token**

### 2. Organizar tus carpetas en Dropbox

Crea esta estructura:

```
/Catalogo/
  ├── Anillos/
  │   ├── Anillo Solsticio.jpg
  │   ├── Anillo Aurora.png
  │   └── (más fotos...)
  ├── Collares/
  │   ├── Collar Lumière.jpg
  │   └── (más fotos...)
  ├── Pulseras/
  │   └── (más fotos...)
  ├── Aretes/
  │   └── (más fotos...)
  └── precios.json          ← OPCIONAL (ver abajo)
```

**Reglas:**
- Cada **carpeta** = una **categoría** en la web
- Cada **foto** = un **producto** (el nombre del archivo = nombre del producto)
- Formatos aceptados: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

### 3. Precios (opcional)

Crea un archivo `precios.json` en la raíz de `/Catalogo/`:

```json
{
  "Anillo Solsticio": {
    "price": 245000,
    "desc": "Oro 18k con diamante central"
  },
  "Collar Lumière": {
    "price": 385000,
    "desc": "Cadena de oro con perla"
  }
}
```

- La **clave** debe coincidir exactamente con el nombre del archivo (sin extensión)
- `price` = precio en tu moneda (número entero)
- `desc` = descripción corta (opcional)
- Productos sin entrada en `precios.json` muestran "Consultar precio"

### 4. Configurar el proyecto

```bash
# Clonar o copiar el proyecto
cd catalogo-joyas

# Instalar dependencias
npm install

# Editar .env.local con tus datos
# (ver el archivo para todas las opciones)
```

Edita `.env.local`:
```
DROPBOX_ACCESS_TOKEN=tu_token_nuevo
DROPBOX_ROOT_PATH=/Catalogo
NEXT_PUBLIC_WHATSAPP_NUMBER=595981123456
NEXT_PUBLIC_STORE_NAME=TU MARCA
NEXT_PUBLIC_CURRENCY=₲
```

### 5. Probar localmente

```bash
npm run dev
```

Abre http://localhost:3000

### 6. Desplegar en Vercel (GRATIS)

1. Sube el proyecto a GitHub
2. Ve a https://vercel.com → "New Project"
3. Importa tu repositorio de GitHub
4. En **Environment Variables**, agrega las mismas variables de `.env.local`
5. Click **Deploy**

¡Listo! Tu catálogo estará online y se sincronizará cada 60 segundos.

---

## ⚙️ Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DROPBOX_ACCESS_TOKEN` | Token de tu app de Dropbox | `sl.u.xxxxx` |
| `DROPBOX_ROOT_PATH` | Carpeta raíz en Dropbox | `/Catalogo` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Tu WhatsApp con código de país | `595981123456` |
| `NEXT_PUBLIC_STORE_NAME` | Nombre de tu tienda | `MAISON BIJOUX` |
| `NEXT_PUBLIC_CURRENCY` | Símbolo de moneda | `₲` |
| `REVALIDATE_SECONDS` | Frecuencia de sincronización | `60` |

---

## 🔄 Sobre la sincronización

- La web revisa Dropbox cada **60 segundos** (configurable)
- Usa **ISR** (Incremental Static Regeneration) de Next.js
- Primer visitante ve datos del cache → se refresca en background
- El botón 🔄 en la web fuerza una sincronización inmediata
- Los links de imágenes son temporales (4 horas), se renuevan automáticamente

---

## 🔒 Seguridad

- **NUNCA** compartas tu access token en chats, correos o código público
- Agrega `.env.local` a tu `.gitignore` (ya está incluido)
- El token solo se usa en el servidor (nunca llega al navegador del cliente)
- Para producción, considera usar un **Refresh Token** con OAuth 2.0

---

## 📱 Funcionalidades

- ✅ Sincronización automática con Dropbox
- ✅ Categorías por carpetas
- ✅ Buscador en tiempo real
- ✅ Filtros por categoría
- ✅ Carrito de compras
- ✅ Botón de WhatsApp por producto
- ✅ Envío del carrito completo por WhatsApp
- ✅ Modal de detalle del producto
- ✅ Diseño responsive (móvil + desktop)
- ✅ Precios opcionales via precios.json
