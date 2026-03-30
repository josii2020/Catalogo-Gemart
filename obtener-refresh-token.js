// ============================================
// obtener-refresh-token.js
// ============================================
// Ejecuta este script para obtener tu refresh token permanente.
//
// USO:
//   1. Edita las variables APP_KEY y APP_SECRET abajo con tus datos
//   2. Ejecuta: node obtener-refresh-token.js
//   3. Abre el link que aparece en tu navegador
//   4. Autoriza la app y copia el código que te da Dropbox
//   5. Pega el código en la terminal cuando te lo pida
//   6. ¡Listo! Te dará tu REFRESH_TOKEN permanente

const http = require("http");
const https = require("https");
const url = require("url");

// ═══════════════════════════════════════════
// EDITA ESTOS VALORES CON TUS DATOS:
const APP_KEY = "bt7mri359by8zbq";
const APP_SECRET = "u5picpffmu7pxc3";
// ═══════════════════════════════════════════

const REDIRECT_URI = "http://localhost:8089/callback";

if (APP_KEY === "PEGA_TU_APP_KEY_AQUI" || APP_SECRET === "PEGA_TU_APP_SECRET_AQUI") {
  console.log("");
  console.log("═══════════════════════════════════════════════════════");
  console.log("  ERROR: Edita este archivo primero");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  console.log("  1. Abre este archivo con: notepad obtener-refresh-token.js");
  console.log("  2. Reemplaza PEGA_TU_APP_KEY_AQUI con tu App Key de Dropbox");
  console.log("  3. Reemplaza PEGA_TU_APP_SECRET_AQUI con tu App Secret");
  console.log("  4. Guarda y ejecuta de nuevo: node obtener-refresh-token.js");
  console.log("");
  process.exit(1);
}

// Paso 1: Generar URL de autorización
const authUrl =
  `https://www.dropbox.com/oauth2/authorize` +
  `?client_id=${APP_KEY}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&token_access_type=offline`;

console.log("");
console.log("═══════════════════════════════════════════════════════");
console.log("  OBTENER REFRESH TOKEN DE DROPBOX");
console.log("═══════════════════════════════════════════════════════");
console.log("");
console.log("  1. Abre este link en tu navegador:");
console.log("");
console.log(`  ${authUrl}`);
console.log("");
console.log("  2. Autoriza la app en Dropbox");
console.log("  3. Serás redirigido automáticamente...");
console.log("");
console.log("  Esperando autorización...");
console.log("");

// Paso 2: Servidor local para capturar el código
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === "/callback") {
    const code = parsedUrl.query.code;

    if (!code) {
      res.writeHead(400);
      res.end("Error: no se recibió código de autorización");
      return;
    }

    // Paso 3: Intercambiar código por refresh token
    const postData = new URLSearchParams({
      code: code,
      grant_type: "authorization_code",
      client_id: APP_KEY,
      client_secret: APP_SECRET,
      redirect_uri: REDIRECT_URI,
    }).toString();

    try {
      const tokenRes = await new Promise((resolve, reject) => {
        const tokenReq = https.request(
          "https://api.dropboxapi.com/oauth2/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(postData),
            },
          },
          (response) => {
            let body = "";
            response.on("data", (chunk) => (body += chunk));
            response.on("end", () => resolve(JSON.parse(body)));
          }
        );
        tokenReq.on("error", reject);
        tokenReq.write(postData);
        tokenReq.end();
      });

      if (tokenRes.refresh_token) {
        console.log("═══════════════════════════════════════════════════════");
        console.log("  ¡ÉXITO! Tu refresh token permanente es:");
        console.log("═══════════════════════════════════════════════════════");
        console.log("");
        console.log(`  ${tokenRes.refresh_token}`);
        console.log("");
        console.log("═══════════════════════════════════════════════════════");
        console.log("  Ahora agrega estas variables en Vercel:");
        console.log("═══════════════════════════════════════════════════════");
        console.log("");
        console.log(`  DROPBOX_REFRESH_TOKEN = ${tokenRes.refresh_token}`);
        console.log(`  DROPBOX_APP_KEY = ${APP_KEY}`);
        console.log(`  DROPBOX_APP_SECRET = ${APP_SECRET}`);
        console.log("");
        console.log("  Y puedes ELIMINAR la variable DROPBOX_ACCESS_TOKEN");
        console.log("═══════════════════════════════════════════════════════");

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
          <html><body style="font-family:sans-serif;text-align:center;padding:60px">
            <h1 style="color:#25a162">✅ ¡Listo!</h1>
            <p>Tu refresh token fue generado exitosamente.</p>
            <p>Revisa la terminal para ver el token y las instrucciones.</p>
            <p>Ya puedes cerrar esta ventana.</p>
          </body></html>
        `);
      } else {
        console.error("Error al obtener refresh token:", tokenRes);
        res.writeHead(500);
        res.end("Error al obtener el token. Revisa la terminal.");
      }
    } catch (err) {
      console.error("Error:", err);
      res.writeHead(500);
      res.end("Error de conexión");
    }

    // Cerrar servidor después de 2 segundos
    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 2000);
  }
});

server.listen(8089, () => {
  // Abrir navegador automáticamente
  const { exec } = require("child_process");
  const command =
    process.platform === "win32"
      ? `start "" "${authUrl}"`
      : process.platform === "darwin"
      ? `open "${authUrl}"`
      : `xdg-open "${authUrl}"`;
  exec(command);
});
