/* ============================================================
   THE OOVI — Cart state & helpers
   Storage: localStorage['oovi_cart'] = JSON array of items
   Item shape: { id, name, color, size, price, qty }
   Broadcasts 'oovi:cart-changed' on any mutation so UI can react.
   ============================================================ */
(() => {
  const KEY = 'oovi_cart';
  const PRICE_PRE_ORDER = 299.99;

  const formatPrice = (n) => `${n.toFixed(2).replace('.', ',')} lei`;

  const read = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      
      // Validate and clean items to prevent NaN or undefined errors
      return parsed.map(item => {
        if (item.price === undefined || isNaN(item.price)) {
          item.price = PRICE_PRE_ORDER;
        }
        if (item.qty === undefined || isNaN(item.qty)) {
          item.qty = 1;
        }
        if (!item.name) {
          item.name = 'Hanorac Oovi';
        }
        return item;
      }).filter(item => item.id);
    } catch { return []; }
  };

  const write = (items) => {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('oovi:cart-changed', { detail: { items } }));
  };

  const makeId = (color, size) => `oovi-${color}-${size}`.toLowerCase();

  const add = (item) => {
    const items = read();
    const id = makeId(item.color, item.size);
    const existing = items.find(i => i.id === id);
    if (existing) {
      existing.qty = Math.min(10, existing.qty + (item.qty || 1));
    } else {
      items.push({
        id,
        name: item.name || 'Hanorac Oovi',
        color: item.color,
        size: item.size,
        price: PRICE_PRE_ORDER,
        qty: item.qty || 1
      });
    }
    write(items);
  };

  const updateQty = (id, qty) => {
    const items = read();
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, Math.min(10, qty));
    write(items);
  };

  const remove = (id) => {
    const items = read().filter(i => i.id !== id);
    write(items);
  };

  const clear = () => {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent('oovi:cart-changed', { detail: { items: [] } }));
  };

  const count = () => read().reduce((s, i) => s + i.qty, 0);
  const subtotal = () => read().reduce((s, i) => s + i.price * i.qty, 0);

  // Cart count badge in nav — auto-updates on cart change
  const renderBadge = () => {
    const badge = document.querySelector('[data-cart-count]');
    if (!badge) return;
    const c = count();
    badge.textContent = String(c);
    badge.classList.toggle('is-visible', c > 0);
  };
  renderBadge();
  window.addEventListener('oovi:cart-changed', renderBadge);

  // Public API
  window.OoviCart = {
    add,
    updateQty,
    remove,
    clear,
    read,
    count,
    subtotal,
    formatPrice,
    PRICE_PRE_ORDER,
    makeId,
  };

  /* ============================================================
     Color & size dictionaries (single source of truth)
     ============================================================ */
  window.OoviCatalog = {
    colors: {
      antracit: { name: 'Antracit', hex: '#3C3F41' },
      rose:     { name: 'Rose',     hex: '#B78E8D' },
    },
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  };

  // Generate an order ID for confirmation page (8-char)
  window.OoviCart.generateOrderId = () => {
    const t = Date.now().toString(36).toUpperCase().slice(-5);
    const r = Math.random().toString(36).toUpperCase().slice(2, 5);
    return `OVI-${t}${r}`;
  };
})();
