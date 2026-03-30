"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "MAISON BIJOUX";
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "Gs";

function formatPrice(price) {
  if (!price) return "Consultar";
  return `${CURRENCY} ${price.toLocaleString()}`;
}

function PedidoContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const data = searchParams.get("items");
      if (data) {
        const decoded = JSON.parse(decodeURIComponent(atob(data)));
        setItems(decoded);
      }
    } catch (e) {
      console.error("Error parsing items:", e);
    }
    setLoaded(true);
  }, [searchParams]);

  const total = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);

  if (!loaded) return null;

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAF7F4; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.brandLine} />
        <h1 style={styles.brand}>{STORE_NAME}</h1>
        <p style={styles.tagline}>Detalle del Pedido</p>
        <div style={styles.brandLine} />
      </header>

      {items.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>No se encontraron productos</p>
          <p style={styles.emptySub}>El link puede haber expirado o ser inválido</p>
        </div>
      ) : (
        <main style={styles.main}>
          <div style={styles.itemCount}>
            {items.length} producto{items.length > 1 ? "s" : ""} en este pedido
          </div>

          <div style={styles.grid}>
            {items.map((item, i) => (
              <div key={i} style={styles.card}>
                {item.img ? (
                  <img src={item.img} alt={item.name} style={styles.cardImg} />
                ) : (
                  <div style={styles.cardImgPlaceholder}>Sin imagen</div>
                )}
                <div style={styles.cardBody}>
                  {item.category && (
                    <span style={styles.cardCategory}>{item.category}</span>
                  )}
                  <h3 style={styles.cardName}>{item.name}</h3>
                  {item.desc && <p style={styles.cardDesc}>{item.desc}</p>}
                  <div style={styles.cardFooter}>
                    <span style={styles.cardPrice}>{formatPrice(item.price)}</span>
                    <span style={styles.cardQty}>x{item.qty || 1}</span>
                  </div>
                  {item.price && item.qty > 1 && (
                    <p style={styles.cardSubtotal}>
                      Subtotal: {formatPrice(item.price * item.qty)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {total > 0 && (
            <div style={styles.totalBar}>
              <span style={styles.totalLabel}>Total del pedido</span>
              <span style={styles.totalValue}>{formatPrice(total)}</span>
            </div>
          )}
        </main>
      )}

      <footer style={styles.footer}>
        <div style={styles.brandLine} />
        <p style={styles.footerText}>{STORE_NAME} © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default function PedidoPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>Cargando pedido...</div>}>
      <PedidoContent />
    </Suspense>
  );
}

const styles = {
  root: {
    fontFamily: "'Jost', sans-serif",
    background: "#FAF7F4",
    color: "#2C2420",
    minHeight: "100vh",
  },
  header: {
    textAlign: "center",
    padding: "40px 20px 24px",
    background: "linear-gradient(180deg, #FFFDFB 0%, #FAF7F4 100%)",
    borderBottom: "1px solid #E8DDD2",
  },
  brandLine: { width: 60, height: 1, background: "#C9A96E", margin: "0 auto 8px" },
  brand: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 28,
    fontWeight: 300,
    letterSpacing: 6,
    color: "#2C2420",
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 2,
    color: "#8B6D47",
    fontWeight: 400,
    marginTop: 6,
    textTransform: "uppercase",
  },
  main: { maxWidth: 900, margin: "0 auto", padding: "28px 20px 60px" },
  itemCount: {
    fontSize: 14,
    color: "#7A6E66",
    marginBottom: 20,
    fontWeight: 300,
  },
  grid: { display: "flex", flexDirection: "column", gap: 16 },
  card: {
    display: "flex",
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #E8DDD2",
  },
  cardImg: {
    width: 160,
    minHeight: 160,
    objectFit: "cover",
    display: "block",
    flexShrink: 0,
  },
  cardImgPlaceholder: {
    width: 160,
    minHeight: 160,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F5F0EB",
    color: "#7A6E66",
    fontSize: 13,
    flexShrink: 0,
  },
  cardBody: { padding: "16px 20px", flex: 1 },
  cardCategory: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#8B6D47",
    fontWeight: 500,
  },
  cardName: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 20,
    fontWeight: 500,
    color: "#2C2420",
    marginTop: 4,
    lineHeight: 1.3,
  },
  cardDesc: {
    fontSize: 13,
    color: "#7A6E66",
    marginTop: 4,
    fontWeight: 300,
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  cardPrice: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 22,
    fontWeight: 600,
    color: "#8B6D47",
  },
  cardQty: {
    fontSize: 14,
    color: "#7A6E66",
    background: "#F5F0EB",
    padding: "4px 12px",
    borderRadius: 16,
    fontWeight: 500,
  },
  cardSubtotal: {
    fontSize: 13,
    color: "#7A6E66",
    marginTop: 6,
    fontWeight: 400,
  },
  totalBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    padding: "20px 24px",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #E8DDD2",
  },
  totalLabel: {
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#7A6E66",
  },
  totalValue: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 28,
    fontWeight: 600,
    color: "#8B6D47",
  },
  empty: { textAlign: "center", padding: "80px 20px" },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 22,
    color: "#2C2420",
  },
  emptySub: { fontSize: 14, color: "#7A6E66", marginTop: 8, fontWeight: 300 },
  footer: { textAlign: "center", padding: "32px 20px" },
  footerText: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 13,
    letterSpacing: 2,
    color: "#7A6E66",
  },
};
