/* ============================================
   OMNILYX Theme JavaScript
   ============================================ */

'use strict';

// ─── UTILITIES ───────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function formatMoney(cents) {
  const amount = (cents / 100).toFixed(2);
  return window.theme.moneyFormat
    ? window.theme.moneyFormat.replace('{{amount}}', amount).replace('{{amount_no_decimals}}', Math.round(cents/100))
    : '₹' + amount;
}

// ─── STICKY HEADER ───────────────────────────
function initStickyHeader() {
  const header = $('#SiteHeader');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ─── NAV DRAWER ──────────────────────────────
function initNavDrawer() {
  const toggle  = $('#NavToggle');
  const drawer  = $('#NavDrawer');
  const close   = $('#NavClose');
  const overlay = $('#NavOverlay');
  const backdrop = $('#Backdrop');
  if (!toggle || !drawer) return;

  function open() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    backdrop && backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    backdrop && backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', open);
  close && close.addEventListener('click', closeDrawer);
  overlay && overlay.addEventListener('click', closeDrawer);
  backdrop && backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => e.key === 'Escape' && closeDrawer());
}

// ─── SEARCH MODAL ────────────────────────────
function initSearch() {
  const toggle  = $('#SearchToggle');
  const modal   = $('#SearchModal');
  const close   = $('#SearchClose');
  const overlay = $('#SearchOverlay');
  const input   = $('#SearchInput');
  if (!toggle || !modal) return;

  function open() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    setTimeout(() => input && input.focus(), 100);
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', open);
  close && close.addEventListener('click', closeModal);
  overlay && overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => e.key === 'Escape' && closeModal());
}

// ─── CART DRAWER ─────────────────────────────
const Cart = {
  drawer:   null,
  overlay:  null,
  itemsEl:  null,
  footEl:   null,
  subtotal: null,
  countEl:  null,

  init() {
    this.drawer   = $('#CartDrawer');
    this.overlay  = $('#CartOverlay');
    this.itemsEl  = $('#CartItems');
    this.footEl   = $('#CartFoot');
    this.subtotal = $('#CartSubtotal');
    this.countEl  = $('#CartCount');
    const headerCount = $('#HeaderCartCount');

    $('#CartToggle')?.addEventListener('click', () => this.open());
    $('#CartClose')?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => e.key === 'Escape' && this.close());

    // Init count from theme data
    this.updateCount(window.theme.cartCount || 0);
  },

  open() {
    if (!this.drawer) return;
    this.drawer.classList.add('open');
    this.drawer.setAttribute('aria-hidden', 'false');
    $('#CartToggle')?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    this.refresh();
  },

  close() {
    if (!this.drawer) return;
    this.drawer.classList.remove('open');
    this.drawer.setAttribute('aria-hidden', 'true');
    $('#CartToggle')?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  },

  async refresh() {
    try {
      const res  = await fetch(window.theme.routes.cart);
      const data = await res.json();
      this.render(data);
    } catch (e) {
      console.error('Cart fetch error:', e);
    }
  },

  render(cart) {
    this.updateCount(cart.item_count);
    if (!this.itemsEl) return;

    if (cart.item_count === 0) {
      this.itemsEl.innerHTML = `
        <div class="cart-drawer-empty">
          <svg width="56" height="56" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <p>Your bag is empty</p>
          <a href="/collections/all" class="btn btn--primary">Shop Now →</a>
        </div>`;
      this.footEl && (this.footEl.style.display = 'none');
      return;
    }

    this.itemsEl.innerHTML = cart.items.map(item => `
      <div class="cart-drawer-item" data-line-item-key="${item.key}">
        <img class="cart-drawer-item__img"
             src="${item.image ? item.image.replace('_small', '_medium') : ''}"
             alt="${item.product_title}" loading="lazy">
        <div>
          <a href="${item.url}" class="cart-drawer-item__title">${item.product_title}</a>
          ${item.variant_title !== 'Default Title' ? `<p class="cart-drawer-item__variant">${item.variant_title}</p>` : ''}
          <div class="qty-control" style="margin-top:.5rem;transform:scale(.85);transform-origin:left">
            <button class="qty-btn cart-drawer-qty-minus" data-key="${item.key}" data-qty="${item.quantity - 1}" aria-label="Decrease">−</button>
            <span class="qty-input" style="width:36px;font-size:.8rem">${item.quantity}</span>
            <button class="qty-btn cart-drawer-qty-plus" data-key="${item.key}" data-qty="${item.quantity + 1}" aria-label="Increase">+</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.5rem">
          <span class="cart-drawer-item__price">${formatMoney(item.final_line_price)}</span>
          <button class="cart-item__remove cart-drawer-remove" data-key="${item.key}" aria-label="Remove item">Remove</button>
        </div>
      </div>`).join('');

    if (this.subtotal) this.subtotal.textContent = formatMoney(cart.total_price);
    if (this.footEl) this.footEl.style.display = 'block';

    // Bind actions
    $$('.cart-drawer-qty-minus, .cart-drawer-qty-plus', this.drawer).forEach(btn => {
      btn.addEventListener('click', () => this.changeItem(btn.dataset.key, parseInt(btn.dataset.qty)));
    });
    $$('.cart-drawer-remove', this.drawer).forEach(btn => {
      btn.addEventListener('click', () => this.changeItem(btn.dataset.key, 0));
    });
  },

  async changeItem(key, qty) {
    try {
      const res = await fetch(window.theme.routes.cartChange, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id: key, quantity: qty })
      });
      const data = await res.json();
      this.render(data);
    } catch (e) {
      console.error('Cart change error:', e);
    }
  },

  updateCount(count) {
    const countEl = $('#HeaderCartCount');
    const drawerCount = $('#CartCount');
    if (countEl) {
      countEl.textContent = count;
      countEl.classList.toggle('hidden', count === 0);
    }
    if (drawerCount) drawerCount.textContent = `(${count})`;
  }
};

// ─── ADD TO CART ─────────────────────────────
async function addToCart(variantId, qty = 1, btn = null) {
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Adding...';
  }
  try {
    const res = await fetch(window.theme.routes.cartAdd, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: qty })
    });
    const data = await res.json();
    if (data.status === 422) throw new Error(data.description);

    Cart.open();
    if (btn) {
      btn.textContent = 'Added! ✓';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Add to Bag →';
      }, 2500);
    }
  } catch (e) {
    console.error('Add to cart error:', e);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Error — Try again';
      setTimeout(() => { btn.textContent = 'Add to Bag →'; }, 2000);
    }
  }
}

// ─── PRODUCT PAGE ────────────────────────────
function initProductPage() {
  const form = $('#ProductForm');
  if (!form) return;

  // Gallery Thumbs
  const mainImg = $('#MainProductImage');
  $$('.product-gallery__thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      if (mainImg) mainImg.src = thumb.dataset.src;
      $$('.product-gallery__thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // Variant Buttons
  const variantInput = $('#VariantId');
  $$('.variant-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = $$('.variant-btn').filter(b => b.dataset.optionName === btn.dataset.optionName);
      group.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateSelectedVariant();
    });
  });

  function updateSelectedVariant() {
    const selected = {};
    $$('.variant-btn.selected').forEach(btn => {
      selected[btn.dataset.optionName] = btn.dataset.value;
    });
    // Find matching variant from product JSON
    const productDataEl = document.getElementById('ProductJSON');
    if (!productDataEl) return;
    const product = JSON.parse(productDataEl.textContent);
    const variant = product.variants.find(v =>
      v.options.every((opt, i) => opt === selected[product.options[i]])
    );
    if (variant && variantInput) {
      variantInput.value = variant.id;
      const addBtn = $('#AddToCart');
      if (addBtn) {
        addBtn.disabled = !variant.available;
        addBtn.textContent = variant.available ? 'Add to Bag →' : 'Sold Out';
      }
      // Update price
      const priceEl = $('.product-price');
      if (prizeEl && variant.price) priceEl.textContent = formatMoney(variant.price);
    }
  }

  // Quantity
  const qtyInput = $('#QtyInput');
  $('#QtyMinus')?.addEventListener('click', () => {
    if (qtyInput && parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
  });
  $('#QtyPlus')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = parseInt(qtyInput.value) + 1;
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = variantInput?.value || form.querySelector('[name="id"]')?.value;
    const qty = parseInt(qtyInput?.value || 1);
    const btn = $('#AddToCart');
    if (id) await addToCart(id, qty, btn);
  });
}

// ─── QUICK ADD BUTTONS (Collection/Cards) ────
function initQuickAdd() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.product-card__atc-btn');
    if (!btn) return;
    e.preventDefault();
    const variantId = btn.dataset.variantId;
    if (!variantId) {
      window.location = btn.dataset.productUrl;
      return;
    }
    await addToCart(variantId, 1, btn);
  });
}

// ─── CART PAGE QTY ───────────────────────────
function initCartPage() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.cart-qty-minus, .cart-qty-plus');
    if (!btn) return;
    const line = parseInt(btn.dataset.line);
    const input = document.querySelector(`.cart-qty-input[data-line="${line}"]`);
    if (!input) return;
    let qty = parseInt(input.value);
    if (btn.classList.contains('cart-qty-minus')) qty = Math.max(0, qty - 1);
    else qty += 1;
    input.value = qty;
    await updateCartLine(line, qty);
  });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.cart-item__remove');
    if (!btn) return;
    const line = parseInt(btn.dataset.line);
    await updateCartLine(line, 0);
  });
}

async function updateCartLine(line, qty) {
  try {
    const res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line, quantity: qty })
    });
    if (qty === 0) window.location.reload();
    else {
      const data = await res.json();
      Cart.updateCount(data.item_count);
    }
  } catch (e) { console.error(e); }
}

// ─── ANNOUNCEMENTS / SMOOTH LINKS ────────────
function initSmoothLinks() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ─── INTERSECTION OBSERVER (Fade-in) ─────────
function initAnimations() {
  if (!window.IntersectionObserver) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  $$('.product-card, .testimonial-card, .about-pillar, .section-header').forEach(el => {
    el.classList.add('fade-up');
    obs.observe(el);
  });
}

// ─── VIEW TRANSITIONS (ZOOM EFFECT) ──────────
function initViewTransitions() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.product-card__link') || e.target.closest('.product-card__title');
    if (!link) return;
    
    const card = link.closest('.product-card');
    if (!card) return;
    
    const img = card.querySelector('.product-card__img');
    if (img) {
      img.style.viewTransitionName = 'product-main-image';
    }
  });
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initNavDrawer();
  initSearch();
  Cart.init();
  initProductPage();
  initQuickAdd();
  initCartPage();
  initSmoothLinks();
  initAnimations();
  initViewTransitions();
});
