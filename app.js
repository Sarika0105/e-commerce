(() => {
  "use strict";

  /* ----------------------------
     Product catalog with symbols
  ---------------------------- */
  const PRODUCTS = [
    {
      id: "p1",
      title: "Wireless Headphones",
      price: 2999,
      category: "audio",
      image: "🎧",
      description: "Comfortable wireless headphones with long battery life."
    },
    {
      id: "p2",
      title: "Smartphone Stand",
      price: 499,
      category: "accessories",
      image: "📱",
      description: "Portable phone stand for desks and travel."
    },
    {
      id: "p3",
      title: "Portable Charger 10,000mAh",
      price: 1299,
      category: "power",
      image: "🔋",
      description: "Lightweight power bank with two USB ports."
    },
    {
      id: "p4",
      title: "Bluetooth Speaker",
      price: 1999,
      category: "audio",
      image: "🔊",
      description: "Compact Bluetooth speaker with deep bass and clear sound."
    },
    {
      id: "p5",
      title: "USB-C Charging Cable",
      price: 299,
      category: "accessories",
      image: "🔌",
      description: "Durable braided USB-C cable for fast charging."
    },
    {
      id: "p6",
      title: "Laptop Stand",
      price: 899,
      category: "accessories",
      image: "💻",
      description: "Ergonomic laptop stand to improve posture."
    },
    {
      id: "p7",
      title: "Smartwatch",
      price: 5499,
      category: "wearable",
      image: "⌚",
      description: "Stylish smartwatch with health tracking features."
    },
    {
      id: "p8",
      title: "Wireless Mouse",
      price: 799,
      category: "accessories",
      image: "🖱️",
      description: "Ergonomic wireless mouse with long battery life."
    }
  ];

  /* ----------------------------
     Helpers
  ---------------------------- */
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const formatCurrency = (n) => n.toLocaleString("en-IN", { style: "currency", currency: "INR" });
  const escapeHtml = (str = "") => String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  /* ----------------------------
     Cart persistence (localStorage)
  ---------------------------- */
  const CART_KEY = "eshop_cart_v1";
  const loadCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  const saveCart = (cart) => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); };
  const updateCartCount = () => {
    const cnt = loadCart().reduce((s, it) => s + (it.qty || 1), 0);
    qsa("#cartCount, #cartCountHeader, #cartCountHeader2").forEach(el => { if (el) el.textContent = cnt; });
  };

  /* ----------------------------
     Product Grid (Home page)
  ---------------------------- */
  const renderProductCard = (p) => {
    const el = document.createElement("article");
    el.className = "card";
    el.innerHTML = `
      <div style="font-size:48px;text-align:center">${p.image}</div>
      <div>
        <h3 class="text-sm">${escapeHtml(p.title)}</h3>
        <p class="muted">${escapeHtml(p.category)} • ${formatCurrency(p.price)}</p>
        <p class="text-sm">${escapeHtml(p.description)}</p>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn add-btn" data-id="${p.id}">Add to Cart</button>
          <button class="btn outline detail-btn" data-id="${p.id}">Details</button>
        </div>
      </div>`;
    return el;
  };

  const populateCategories = () => {
    const select = qs("#categorySelect");
    if (!select) return;
    const categories = Array.from(new Set(PRODUCTS.map(p => p.category)));
    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat[0].toUpperCase() + cat.slice(1);
      select.appendChild(opt);
    });
  };

  const renderProductsList = (list) => {
    const grid = qs("#productGrid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!list.length) {
      grid.innerHTML = `<p class="muted">No products found.</p>`;
      qs("#resultCount").textContent = "";
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(p => frag.appendChild(renderProductCard(p)));
    grid.appendChild(frag);
    qs("#resultCount").textContent = `${list.length} product(s)`;
  };

  /* ----------------------------
     Filters / Search / Sort
  ---------------------------- */
  const applyFilters = () => {
    const q = (qs("#searchInput")?.value || "").trim().toLowerCase();
    const cat = qs("#categorySelect")?.value || "all";
    const sort = qs("#sortSelect")?.value || "default";

    let list = PRODUCTS.filter(p =>
      (!q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
      (cat === "all" || p.category === cat)
    );

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);

    renderProductsList(list);
  };

  /* ----------------------------
     Modal
  ---------------------------- */
  const openProductModal = (id) => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const modal = qs("#productModal");
    const body = qs("#modalBody");
    body.innerHTML = `
      <div style="font-size:72px;text-align:center">${p.image}</div>
      <h2>${escapeHtml(p.title)}</h2>
      <p class="muted">${escapeHtml(p.category)} • ${formatCurrency(p.price)}</p>
      <p>${escapeHtml(p.description)}</p>
      <div style="margin-top:8px;display:flex;gap:8px">
        <button class="btn modal-add" data-id="${p.id}">Add to Cart</button>
        <button class="btn outline" id="closeModalBtn" type="button">Close</button>
      </div>`;
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "flex";
  };
  const closeModal = () => { const m = qs("#productModal"); if (m) { m.setAttribute("aria-hidden", "true"); m.style.display = "none"; } };

  /* ----------------------------
     Cart
  ---------------------------- */
  const addToCart = (id, qty = 1) => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const cart = loadCart();
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty += qty;
    else cart.push({ id: p.id, title: p.title, price: p.price, image: p.image, qty });
    saveCart(cart);
    showToast(`${p.title} added to cart`);
  };

  const removeFromCart = (id) => { saveCart(loadCart().filter(i => i.id !== id)); renderCartPage(); };

  const updateQty = (id, qty) => {
    const cart = loadCart();
    const item = cart.find(i => i.id === id);
    if (item) item.qty = Math.max(0, parseInt(qty) || 0);
    saveCart(cart.filter(i => i.qty > 0));
    renderCartPage();
  };

  const cartTotals = () => {
    const c = loadCart();
    const subtotal = c.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = subtotal * 0.18; // 18% GST
    const shipping = subtotal > 2000 ? 0 : 100;
    return { subtotal, tax, shipping, total: subtotal + tax + shipping };
  };

  const renderCartPage = () => {
    const area = qs("#cartArea");
    if (!area) return;
    const cart = loadCart();
    area.innerHTML = "";
    if (!cart.length) { area.innerHTML = `<p class="muted">Your cart is empty.</p>`; qs("#cartTotals").innerHTML = ""; updateCartCount(); return; }
    cart.forEach(item => {
      const d = document.createElement("div");
      d.className = "cart-item";
      d.innerHTML = `
        <div style="font-size:48px">${item.image}</div>
        <div style="flex:1">
          <strong>${escapeHtml(item.title)}</strong>
          <div class="muted">${formatCurrency(item.price)}</div>
          <div style="margin-top:8px">
            <label>Qty</label>
            <input type="number" min="0" value="${item.qty}" data-id="${item.id}" class="cart-qty">
            <button class="btn outline remove-btn" data-id="${item.id}">Remove</button>
          </div>
        </div>
        <div><strong>${formatCurrency(item.price * item.qty)}</strong></div>`;
      area.appendChild(d);
    });
    const t = cartTotals();
    qs("#cartTotals").innerHTML = `
      <p>Subtotal: ${formatCurrency(t.subtotal)}</p>
      <p>Tax (18%): ${formatCurrency(t.tax)}</p>
      <p>Shipping: ${formatCurrency(t.shipping)}</p>
      <hr><p><strong>Total: ${formatCurrency(t.total)}</strong></p>`;
    updateCartCount();
  };

  /* ----------------------------
     Checkout
  ---------------------------- */
  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!qs("#checkoutForm").checkValidity()) { qs("#checkoutForm").reportValidity(); return; }
    if (!loadCart().length) { qs("#checkoutMessage").textContent = "Your cart is empty."; return; }
    localStorage.removeItem(CART_KEY);
    updateCartCount();
    qs("#checkoutMessage").textContent = "Order placed successfully — Thank you!";
  };

  /* ----------------------------
     Contact
  ---------------------------- */
  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!qs("#contactForm").checkValidity()) { qs("#contactForm").reportValidity(); return; }
    qs("#contactMessageOutput").textContent = "Message sent successfully!";
    qs("#contactForm").reset();
  };

  /* ----------------------------
     Toast
  ---------------------------- */
  const showToast = (msg) => {
    let t = qs("#toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      Object.assign(t.style, { position:"fixed",top:"12px",right:"12px",background:"#111827",color:"#fff",padding:"8px 12px",borderRadius:"8px" });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(() => { t.style.display = "none"; }, 1500);
  };

  /* ----------------------------
     Init
  ---------------------------- */
  const init = () => {
    qsa("#year").forEach(el => el.textContent = new Date().getFullYear());
    populateCategories();
    if (qs("#productGrid")) renderProductsList(PRODUCTS);
    if (qs("#featuredGrid")) PRODUCTS.slice(0, 3).forEach(p => qs("#featuredGrid").appendChild(renderProductCard(p)));

    ["#searchInput","#categorySelect","#sortSelect"].forEach(sel => qs(sel)?.addEventListener("input", applyFilters));
    document.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.classList.contains("add-btn")) addToCart(t.dataset.id);
      if (t.classList.contains("detail-btn")) openProductModal(t.dataset.id);
      if (t.classList.contains("modal-add")) addToCart(t.dataset.id);
      if (t.id === "closeModalBtn") closeModal();
      if (t.classList.contains("remove-btn")) removeFromCart(t.dataset.id);
    });
    document.addEventListener("input", (e) => { if (e.target.classList?.contains("cart-qty")) updateQty(e.target.dataset.id, e.target.value); });
    qs("#checkoutForm")?.addEventListener("submit", handleCheckoutSubmit);
    qs("#contactForm")?.addEventListener("submit", handleContactSubmit);
    updateCartCount();
    renderCartPage();
  };

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
