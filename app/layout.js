import "./globals.css";

export const metadata = {
  title: `${process.env.NEXT_PUBLIC_STORE_NAME || "Catálogo de Joyas"} — Colección Exclusiva`,
  description: "Explora nuestra colección exclusiva de joyas y accesorios. Catálogo sincronizado automáticamente.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
