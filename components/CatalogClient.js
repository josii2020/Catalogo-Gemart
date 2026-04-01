"use client";

import { useState, useCallback, useMemo } from "react";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "MAISON BIJOUX";
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "595981123456";
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "Gs";
const PRODUCTS_PER_PAGE = 24;

// ─── Icons ───
const Icon = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Cart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  WhatsApp: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Sync: ({ spinning }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={spinning ? { animation: "spin 1s linear infinite" } : {}}><path d="M21.5 2v6h-6"/><path d="M2.5 22v-6h6"/><path d="M2 11.5a10 10 0 0 1 18.8-4.3"/><path d="M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>,
  Minus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
  Dropbox: () => <svg width="14" height="14" viewBox="0 0 528 512" fill="#0061FF"><path d="M264.4 116.3l-132 84.3 132 84.3-132 84.3L0 284.9l132.3-84.3L0 116.3 132.3 32l132.1 84.3zM131.6 395.7l132-84.3 132 84.3-132 84.3-132-84.3zm132.8-111.6l132-84.3-132-84.3L396.4 32l132 84.3-132 84.3 132 84.3-132 84.2z"/></svg>,
  ChevLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevRight: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>,
};

function formatPrice(price) {
  if (!price) return "Consultar";
  return `${CURRENCY} ${price.toLocaleString()}`;
}

export default function CatalogClient({ initialData }) {
  const [data, setData] = useState(initialData);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [customer, setCustomer] = useState({ nombre: "", cedula: "", celular: "", ciudad: "", departamento: "", extras: "" });

  const [lastSyncTime, setLastSyncTime] = useState(null);
  useState(() => {
    if (data.lastSync) setLastSyncTime(new Date(data.lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
  });

  // Resync
  const resync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/dropbox?refresh=true");
      const newData = await res.json();
      setData(newData);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    } catch (err) { console.error("Sync error:", err); }
    setSyncing(false);
  }, []);

  // Filter + paginate
  const filtered = useMemo(() => {
    return (data.products || []).filter((p) => {
      const matchCat = activeCategory === "Todos" || p.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || (p.desc || "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [data.products, activeCategory, search]);

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filtered.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);

  // Reset page on filter change
  const handleCategoryChange = (cat) => { setActiveCategory(cat); setPage(1); };
  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };

  // Cart
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...product, qty: 1 }];
    });
  };
  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));
  const updateQty = (id, delta) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)).filter((i) => i.qty > 0));
  };
  const cartTotal = cart.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // WhatsApp with order link
  const generateOrderLink = (products) => {
    // Excluir URLs de imágenes del link (son muy largas) - la página de pedido las cargará
    const itemData = products.map((p) => ({ n: p.name, p: p.price, q: p.qty || 1, c: p.category, d: p.desc || "" }));
    try {
      const json = JSON.stringify(itemData);
      const encoded = btoa(unescape(encodeURIComponent(json)));
      return `${window.location.origin}/pedido?items=${encoded}`;
    } catch {
      return `${window.location.origin}/pedido`;
    }
  };

  const sendProductWA = (p) => {
    const link = generateOrderLink([{ ...p, qty: 1 }]);
    const msg = `¡Hola! Me interesa: *${p.name}*${p.price ? ` — ${formatPrice(p.price)}` : ""}\n\nVer producto: ${link}\n\n¿Está disponible?`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendCartWA = () => {
    if (!customer.nombre || !customer.celular) {
      setShowForm(true);
      return;
    }
    const link = generateOrderLink(cart);
    const items = cart.map((i) => `• ${i.name} x${i.qty}${i.price ? ` — ${formatPrice(i.price * i.qty)}` : ""}`).join("\n");
    const customerInfo = `*Datos del cliente:*\nNombre: ${customer.nombre}\nCédula: ${customer.cedula}\nCelular: ${customer.celular}\nCiudad: ${customer.ciudad}\nDepartamento: ${customer.departamento}${customer.extras ? `\nNotas: ${customer.extras}` : ""}`;
    const msg = `¡Hola! Quiero realizar un pedido:\n\n${items}${cartTotal ? `\n\nTotal: ${formatPrice(cartTotal)}` : ""}\n\n${customerInfo}\n\nVer pedido con fotos: ${link}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="catalog-root">
      {/* ─── HEADER ─── */}
      <header className="header">
        <div className="header-inner">
          <div className="brand-area">
            <div className="brand-line" />
            <h1 className="brand">GEMART</h1>
            <p className="tagline">Joyas & Accesorios · Colección Exclusiva</p>
            <div className="brand-line" />
          </div>

          <div className="sync-bar">
            <Icon.Dropbox />
            <span className="sync-text">
              {syncing ? "Sincronizando..." : data.error ? `Error: ${data.error}` : `Sincronizado · ${lastSyncTime || ""}`}
              {data.totalProducts ? ` · ${data.totalProducts} productos` : ""}
            </span>
            <button onClick={resync} className="sync-btn" title="Resincronizar"><Icon.Sync spinning={syncing} /></button>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <Icon.Search />
              <input type="text" placeholder="Buscar joyas..." value={search} onChange={handleSearchChange} className="search-input" />
            </div>
            <button onClick={() => setCartOpen(true)} className="cart-btn">
              <Icon.Cart />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>

          <div className="cat-tabs">
            {["Todos", ...(data.categories || [])].map((cat) => (
              <button key={cat} onClick={() => handleCategoryChange(cat)} className={`cat-tab ${activeCategory === cat ? "active" : ""}`}>
                {cat}
                {cat !== "Todos" && <span className="cat-count">({(data.products || []).filter(p => p.category === cat).length})</span>}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ─── HERO BANNER ─── */}
      {data.bannerImg && activeCategory === "Todos" && !search && (
        <div className="hero">
          <img src={data.bannerImg} alt={STORE_NAME} className="hero-img" />
          <div className="hero-overlay">
            <div className="hero-content">
              <p className="hero-subtitle">Elegancia que te define</p>
              <button className="hero-btn" onClick={() => document.querySelector('.main')?.scrollIntoView({ behavior: 'smooth' })}>
                Explorar Colección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CATEGORY HIGHLIGHTS ─── */}
      {activeCategory === "Todos" && !search && (data.categories || []).length > 0 && (
        <div className="cat-highlights">
          <h2 className="cat-highlights-title">Nuestras Categorías</h2>
          <div className="cat-highlights-grid">
            {(data.categories || []).map((cat) => {
              const catProducts = (data.products || []).filter(p => p.category === cat);
              const firstImg = catProducts.find(p => p.img)?.img;
              const catPrice = catProducts[0]?.price;
              return (
                <div key={cat} className="cat-highlight-card" onClick={() => handleCategoryChange(cat)}>
                  {firstImg ? <img src={firstImg} alt={cat} className="cat-highlight-img" /> : <div className="cat-highlight-placeholder" />}
                  <div className="cat-highlight-overlay">
                    <h3 className="cat-highlight-name">{cat}</h3>
                    <p className="cat-highlight-count">{catProducts.length} productos{catPrice ? ` · ${formatPrice(catPrice)}` : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── PRODUCTS GRID ─── */}
      <main className="main">
        {filtered.length === 0 ? (
          <div className="empty">
            <p className="empty-title">No se encontraron joyas</p>
            <p className="empty-sub">Prueba con otra búsqueda o categoría</p>
          </div>
        ) : (
          <>
            <div className="results-info">
              Mostrando {(page - 1) * PRODUCTS_PER_PAGE + 1}-{Math.min(page * PRODUCTS_PER_PAGE, filtered.length)} de {filtered.length} productos
            </div>
            <div className="grid">
              {paginatedProducts.map((product, i) => (
                <div key={product.id} className="card" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="card-img-wrap" onClick={() => setSelectedProduct(product)}>
                    {product.img ? <img src={product.img} alt={product.name} className="card-img" loading="lazy" /> : <div className="card-img-placeholder">Sin imagen</div>}
                    <span className="card-category">{product.category}</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-name">{product.name}</h3>
                    {product.desc && <p className="card-desc">{product.desc}</p>}
                    <div className="card-footer">
                      <span className="card-price">{formatPrice(product.price)}</span>
                      <div className="card-actions">
                        <button onClick={() => sendProductWA(product)} className="wa-btn" title="Consultar por WhatsApp"><Icon.WhatsApp /></button>
                        <button onClick={() => addToCart(product)} className="add-btn" title="Agregar al carrito"><Icon.Plus /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn">
                  <Icon.ChevLeft /> Anterior
                </button>
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="page-dots">...</span>}
                        <button onClick={() => setPage(p)} className={`page-num ${page === p ? "active" : ""}`}>{p}</button>
                      </span>
                    ))}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn">
                  Siguiente <Icon.ChevRight />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── PRODUCT MODAL ─── */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedProduct(null)} className="modal-close"><Icon.X /></button>
            {selectedProduct.img ? <img src={selectedProduct.img} alt={selectedProduct.name} className="modal-img" /> : <div className="modal-img-placeholder">Sin imagen</div>}
            <div className="modal-body">
              <span className="modal-cat">{selectedProduct.category}</span>
              <h2 className="modal-name">{selectedProduct.name}</h2>
              {selectedProduct.desc && <p className="modal-desc">{selectedProduct.desc}</p>}
              <p className="modal-price">{formatPrice(selectedProduct.price)}</p>
              <div className="modal-actions">
                <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} className="modal-add-btn">Agregar al carrito</button>
                <button onClick={() => sendProductWA(selectedProduct)} className="modal-wa-btn"><Icon.WhatsApp /> Consultar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CART SIDEBAR ─── */}
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2 className="cart-title">Tu Selección</h2>
              <button onClick={() => setCartOpen(false)} className="cart-close"><Icon.X /></button>
            </div>
            {cart.length === 0 ? (
              <div className="cart-empty">
                <p className="cart-empty-title">Tu carrito está vacío</p>
                <p className="cart-empty-sub">Explora la colección y encuentra tu pieza perfecta</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      {item.img && <img src={item.img} alt={item.name} className="cart-item-img" />}
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-price">{formatPrice(item.price)}</p>
                        <div className="qty-row">
                          <button onClick={() => updateQty(item.id, -1)} className="qty-btn"><Icon.Minus /></button>
                          <span className="qty-num">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="qty-btn"><Icon.Plus /></button>
                          <button onClick={() => removeFromCart(item.id)} className="remove-btn"><Icon.Trash /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-total-row">
                    <span className="cart-total-label">Total</span>
                    <span className="cart-total-value">{formatPrice(cartTotal)}</span>
                  </div>
                  {!showForm ? (
                    <button onClick={() => setShowForm(true)} className="checkout-btn"><Icon.WhatsApp /> Finalizar Pedido</button>
                  ) : (
                    <div className="customer-form">
                      <p className="form-title">Datos para el envío</p>
                      <input className="form-input" placeholder="Nombre y Apellido *" value={customer.nombre} onChange={(e) => setCustomer({...customer, nombre: e.target.value})} />
                      <input className="form-input" placeholder="Nº de Cédula" value={customer.cedula} onChange={(e) => setCustomer({...customer, cedula: e.target.value})} />
                      <input className="form-input" placeholder="Nº de Celular *" value={customer.celular} onChange={(e) => setCustomer({...customer, celular: e.target.value})} />
                      <div className="form-row">
                        <input className="form-input form-half" placeholder="Ciudad" value={customer.ciudad} onChange={(e) => setCustomer({...customer, ciudad: e.target.value})} />
                        <input className="form-input form-half" placeholder="Departamento" value={customer.departamento} onChange={(e) => setCustomer({...customer, departamento: e.target.value})} />
                      </div>
                      <textarea className="form-textarea" placeholder="Notas adicionales (talle, color, dedicatoria...)" value={customer.extras} onChange={(e) => setCustomer({...customer, extras: e.target.value})} rows={2} />
                      {(!customer.nombre || !customer.celular) && <p className="form-required">* Nombre y celular son obligatorios</p>}
                      <button onClick={sendCartWA} disabled={!customer.nombre || !customer.celular} className="checkout-btn" style={{marginTop: 10, opacity: (!customer.nombre || !customer.celular) ? 0.5 : 1}}><Icon.WhatsApp /> Enviar Pedido por WhatsApp</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <footer className="footer">
        <div className="footer-line" />
        <p className="footer-text">{STORE_NAME} © {new Date().getFullYear()}</p>
        <p className="footer-sub">Catálogo sincronizado automáticamente con Dropbox</p>
      </footer>

      {/* ─── STYLES ─── */}
      <style jsx>{`
        .catalog-root { min-height: 100vh; }
        .header { background: linear-gradient(180deg, #FFFDFB 0%, var(--cream) 100%); border-bottom: 1px solid var(--border); padding: 28px 20px 0; position: sticky; top: 0; z-index: 50; }
        .header-inner { max-width: 1200px; margin: 0 auto; }
        .brand-area { text-align: center; margin-bottom: 16px; }
        .brand-line { width: 60px; height: 1px; background: var(--gold-light); margin: 0 auto 8px; }
        .brand { font-family: var(--font-display); font-size: 30px; font-weight: 300; letter-spacing: 8px; color: var(--dark); line-height: 1.2; }
        .tagline { font-size: 11px; letter-spacing: 3px; color: var(--warm-gray); font-weight: 300; margin-top: 4px; text-transform: uppercase; }
        .sync-bar { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 5px 14px; background: var(--cream-dark); border-radius: 20px; width: fit-content; margin: 0 auto 14px; }
        .sync-text { font-size: 11px; color: var(--warm-gray); letter-spacing: 0.3px; }
        .sync-btn { background: none; border: none; color: var(--gold); cursor: pointer; padding: 4px; display: flex; border-radius: 50%; transition: background 0.2s; }
        .sync-btn:hover { background: var(--gold-glow); }
        .toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .search-box { flex: 1; display: flex; align-items: center; gap: 10px; background: var(--white); border: 1px solid var(--border); border-radius: 28px; padding: 10px 18px; color: var(--warm-gray); }
        .search-input { flex: 1; border: none; outline: none; font-size: 14px; font-family: var(--font-body); background: transparent; color: var(--dark); font-weight: 300; }
        .cart-btn { position: relative; background: var(--dark); color: #fff; border: none; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; }
        .cart-btn:hover { transform: translateY(-2px); }
        .cart-badge { position: absolute; top: -4px; right: -4px; background: var(--gold); color: #fff; font-size: 10px; font-weight: 600; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
        .cat-tabs { display: flex; gap: 0; overflow-x: auto; border-bottom: 1px solid var(--border); -ms-overflow-style: none; scrollbar-width: none; }
        .cat-tabs::-webkit-scrollbar { display: none; }
        .cat-tab { background: none; border: none; padding: 12px 18px; font-size: 12px; font-family: var(--font-body); font-weight: 400; letter-spacing: 1.2px; color: var(--warm-gray); text-transform: uppercase; border-bottom: 2px solid transparent; white-space: nowrap; cursor: pointer; transition: all 0.25s; display: flex; align-items: center; gap: 4px; }
        .cat-tab:hover { color: var(--gold); }
        .cat-tab.active { color: var(--gold); border-bottom-color: var(--gold); font-weight: 500; }
        .cat-count { font-size: 10px; color: var(--warm-gray); font-weight: 300; }
        .main { max-width: 1200px; margin: 0 auto; padding: 20px 20px 60px; }
        .results-info { font-size: 13px; color: var(--warm-gray); margin-bottom: 16px; font-weight: 300; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .card { background: var(--white); border-radius: 12px; overflow: hidden; border: 1px solid var(--border); animation: fadeUp 0.4s ease both; transition: transform 0.3s, box-shadow 0.3s; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(139,109,71,0.1); }
        .card-img-wrap { position: relative; overflow: hidden; aspect-ratio: 1; cursor: pointer; background: var(--cream-dark); }
        .card-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s; }
        .card:hover .card-img { transform: scale(1.05); }
        .card-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--warm-gray); font-size: 13px; }
        .card-category { position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); padding: 3px 10px; border-radius: 16px; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: var(--gold); font-weight: 500; }
        .card-body { padding: 12px 14px 14px; }
        .card-name { font-family: var(--font-display); font-size: 17px; font-weight: 500; color: var(--dark); line-height: 1.3; }
        .card-desc { font-size: 12px; color: var(--warm-gray); margin-top: 3px; font-weight: 300; }
        .card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
        .card-price { font-family: var(--font-display); font-size: 19px; font-weight: 600; color: var(--gold); }
        .card-actions { display: flex; gap: 6px; }
        .wa-btn, .add-btn { border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; }
        .wa-btn { background: #25D366; color: #fff; }
        .add-btn { background: var(--dark); color: #fff; }
        .wa-btn:hover, .add-btn:hover { transform: translateY(-2px); }

        /* Pagination */
        .pagination { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 32px; padding: 20px 0; }
        .page-btn { display: flex; align-items: center; gap: 4px; background: var(--white); border: 1px solid var(--border); border-radius: 24px; padding: 8px 16px; font-family: var(--font-body); font-size: 13px; color: var(--dark); cursor: pointer; transition: all 0.2s; }
        .page-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
        .page-btn:disabled { opacity: 0.4; cursor: default; }
        .page-numbers { display: flex; align-items: center; gap: 4px; }
        .page-num { background: none; border: 1px solid transparent; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-family: var(--font-body); font-size: 14px; color: var(--warm-gray); cursor: pointer; transition: all 0.2s; }
        .page-num:hover { border-color: var(--border); }
        .page-num.active { background: var(--gold); color: #fff; border-color: var(--gold); font-weight: 500; }
        .page-dots { color: var(--warm-gray); padding: 0 4px; }

        /* Empty */
        .empty { text-align: center; padding: 80px 20px; }
        .empty-title { font-family: var(--font-display); font-size: 22px; color: var(--dark); }
        .empty-sub { font-size: 14px; color: var(--warm-gray); margin-top: 8px; font-weight: 300; }

        /* Hero Banner */
        .hero { position: relative; width: 100%; height: 420px; overflow: hidden; }
        .hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(44,36,32,0.65) 0%, rgba(44,36,32,0.2) 60%, transparent 100%); display: flex; align-items: center; }
        .hero-content { padding: 40px 48px; max-width: 1200px; margin: 0 auto; width: 100%; }
        .hero-title { font-family: var(--font-display); font-size: 48px; font-weight: 300; color: #fff; letter-spacing: 6px; line-height: 1.1; text-shadow: 0 2px 20px rgba(0,0,0,0.3); }
        .hero-subtitle { font-size: 16px; color: rgba(255,255,255,0.85); margin-top: 12px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase; }
        .hero-btn { margin-top: 28px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); color: #fff; border: 1px solid rgba(255,255,255,0.4); border-radius: 28px; padding: 12px 32px; font-family: var(--font-body); font-size: 13px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: all 0.3s; }
        .hero-btn:hover { background: rgba(255,255,255,0.25); border-color: rgba(255,255,255,0.6); transform: translateY(-1px); }

        /* Category Highlights */
        .cat-highlights { max-width: 1200px; margin: 0 auto; padding: 40px 20px 16px; }
        .cat-highlights-title { font-family: var(--font-display); font-size: 26px; font-weight: 400; color: var(--dark); text-align: center; margin-bottom: 24px; letter-spacing: 2px; }
        .cat-highlights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
        .cat-highlight-card { position: relative; height: 200px; border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; }
        .cat-highlight-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(139,109,71,0.15); }
        .cat-highlight-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s; }
        .cat-highlight-card:hover .cat-highlight-img { transform: scale(1.08); }
        .cat-highlight-placeholder { width: 100%; height: 100%; background: var(--cream-dark); }
        .cat-highlight-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(44,36,32,0.75) 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; }
        .cat-highlight-name { font-family: var(--font-display); font-size: 22px; font-weight: 500; color: #fff; text-shadow: 0 1px 8px rgba(0,0,0,0.3); }
        .cat-highlight-count { font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 4px; font-weight: 300; letter-spacing: 0.5px; }

        @media (max-width: 640px) {
          .hero { height: 300px; }
          .hero-title { font-size: 32px; letter-spacing: 4px; }
          .hero-subtitle { font-size: 13px; }
          .hero-content { padding: 24px; }
          .cat-highlights-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .cat-highlight-card { height: 150px; }
          .cat-highlight-name { font-size: 17px; }
        }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(44,36,32,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; animation: fadeIn 0.2s ease; }
        .modal { background: var(--white); border-radius: 16px; overflow: hidden; max-width: 460px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; animation: scaleIn 0.3s ease; }
        .modal-close { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; color: var(--dark); }
        .modal-img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
        .modal-img-placeholder { width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: var(--cream-dark); color: var(--warm-gray); }
        .modal-body { padding: 22px; }
        .modal-cat { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); font-weight: 500; }
        .modal-name { font-family: var(--font-display); font-size: 26px; font-weight: 500; margin-top: 4px; }
        .modal-desc { font-size: 14px; color: var(--warm-gray); margin-top: 8px; font-weight: 300; line-height: 1.6; }
        .modal-price { font-family: var(--font-display); font-size: 26px; font-weight: 600; color: var(--gold); margin-top: 14px; }
        .modal-actions { display: flex; gap: 10px; margin-top: 18px; }
        .modal-add-btn { flex: 1; background: var(--dark); color: #fff; border: none; border-radius: 28px; padding: 12px; font-size: 13px; font-family: var(--font-body); cursor: pointer; }
        .modal-wa-btn { display: flex; align-items: center; gap: 6px; background: #25D366; color: #fff; border: none; border-radius: 28px; padding: 12px 20px; font-size: 13px; font-family: var(--font-body); cursor: pointer; }

        /* Cart */
        .cart-overlay { position: fixed; inset: 0; background: rgba(44,36,32,0.45); backdrop-filter: blur(3px); z-index: 100; animation: fadeIn 0.2s ease; }
        .cart-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 380px; max-width: 92vw; background: var(--white); display: flex; flex-direction: column; z-index: 101; box-shadow: -8px 0 40px rgba(0,0,0,0.1); animation: slideInRight 0.3s ease; }
        .cart-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--border); }
        .cart-title { font-family: var(--font-display); font-size: 22px; font-weight: 400; }
        .cart-close { background: none; border: none; cursor: pointer; color: var(--warm-gray); padding: 4px; }
        .cart-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; }
        .cart-empty-title { font-family: var(--font-display); font-size: 20px; }
        .cart-empty-sub { font-size: 13px; color: var(--warm-gray); margin-top: 8px; text-align: center; font-weight: 300; }
        .cart-items { flex: 1; overflow-y: auto; padding: 14px 22px; }
        .cart-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .cart-item-img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; }
        .cart-item-info { flex: 1; }
        .cart-item-name { font-family: var(--font-display); font-size: 15px; font-weight: 500; }
        .cart-item-price { font-size: 13px; color: var(--gold); font-weight: 500; margin-top: 2px; }
        .qty-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
        .qty-btn { background: var(--cream); border: 1px solid var(--border); border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--dark); }
        .qty-num { font-size: 14px; font-weight: 500; min-width: 20px; text-align: center; }
        .remove-btn { background: none; border: none; cursor: pointer; color: #cc6b6b; margin-left: auto; padding: 4px; }
        .cart-footer { border-top: 1px solid var(--border); padding: 20px 22px; }
        .cart-total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .cart-total-label { font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: var(--warm-gray); }
        .cart-total-value { font-family: var(--font-display); font-size: 24px; font-weight: 600; color: var(--gold); }
        .checkout-btn { width: 100%; background: #25D366; color: #fff; border: none; border-radius: 28px; padding: 13px; font-size: 14px; font-family: var(--font-body); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: transform 0.2s; }
        .checkout-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .checkout-btn:disabled { cursor: default; }

        /* Customer Form */
        .customer-form { display: flex; flex-direction: column; gap: 8px; }
        .form-title { font-family: var(--font-display); font-size: 18px; color: var(--dark); margin-bottom: 4px; }
        .form-input { width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; font-family: var(--font-body); font-size: 13px; color: var(--dark); background: var(--cream); outline: none; transition: border-color 0.2s; }
        .form-input:focus { border-color: var(--gold); }
        .form-row { display: flex; gap: 8px; }
        .form-half { flex: 1; }
        .form-textarea { width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; font-family: var(--font-body); font-size: 13px; color: var(--dark); background: var(--cream); outline: none; resize: none; transition: border-color 0.2s; }
        .form-textarea:focus { border-color: var(--gold); }
        .form-required { font-size: 11px; color: var(--gold); font-weight: 400; }

        /* Footer */
        .footer { text-align: center; padding: 32px 20px 28px; }
        .footer-line { width: 40px; height: 1px; background: var(--border); margin: 0 auto 14px; }
        .footer-text { font-family: var(--font-display); font-size: 13px; letter-spacing: 2px; color: var(--warm-gray); }
        .footer-sub { font-size: 11px; color: #b5a08a; margin-top: 4px; font-weight: 300; }

        @media (max-width: 640px) {
          .brand { font-size: 22px; letter-spacing: 5px; }
          .grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .card-name { font-size: 14px; }
          .card-price { font-size: 16px; }
          .cat-tab { padding: 10px 12px; font-size: 10px; }
          .pagination { flex-wrap: wrap; gap: 8px; }
          .page-btn { padding: 6px 12px; font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
