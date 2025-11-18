/**
 * Admin Panel Page Script
 * 管理員面板：產品管理 CRUD
 */

const WORKER_BASE = 'https://uxshari-workers.uxshari.workers.dev';
let adminKey = '';
let allProducts = [];
let editingProductId = null;

// 驗證管理員
document.getElementById('verify-btn')?.addEventListener('click', async () => {
  const key = document.getElementById('admin-key-input').value.trim();
  if (!key) {
    alert('請輸入管理員密鑰');
    return;
  }

  try {
    // 測試 API 呼叫驗證
    const response = await fetch(`${WORKER_BASE}/api/products?admin_key=${encodeURIComponent(key)}`);

    if (response.ok) {
      adminKey = key;
      document.getElementById('auth-section').classList.add('d-none');
      document.getElementById('admin-area').classList.remove('d-none');
      loadProducts();
    } else {
      alert('管理員密鑰錯誤');
    }
  } catch (error) {
    alert('驗證失敗：' + error.message);
  }
});

// 載入產品列表
async function loadProducts() {
  try {
    const response = await fetch(`${WORKER_BASE}/api/products`);
    const data = await response.json();

    if (data.ok) {
      allProducts = data.products;
      renderProducts();
    }
  } catch (error) {
    console.error('載入產品失敗:', error);
    document.getElementById('products-list').innerHTML = `
      <div class="alert alert-danger">
        載入失敗：${error.message}
      </div>
    `;
  }
}

// 渲染產品列表
function renderProducts() {
  const searchTerm = document.getElementById('search-products')?.value?.toLowerCase() || '';
  const filtered = allProducts.filter(p =>
    p.title.toLowerCase().includes(searchTerm) ||
    p.description.toLowerCase().includes(searchTerm) ||
    p.type.includes(searchTerm)
  );

  const countEl = document.getElementById('products-count');
  if (countEl) countEl.textContent = filtered.length;

  const listEl = document.getElementById('products-list');
  if (!listEl) return;

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="fas fa-box-open fa-3x mb-3"></i>
        <p>沒有產品</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = filtered.map(p => `
    <div class="product-list-item">
      <div class="row align-items-center">
        <div class="col-auto">
          <img src="${p.coverImage || '/assets/images/placeholder.jpg'}" 
               class="product-thumbnail" alt="${p.title}">
        </div>
        <div class="col">
          <div class="d-flex align-items-center mb-1">
            <span class="badge bg-primary me-2">${p.type}</span>
            <span class="status-indicator ${p.isActive ? 'active' : 'inactive'}"></span>
            <span class="small text-muted">${p.isActive ? '上架中' : '已下架'}</span>
            ${p.isFeatured ? '<span class="badge bg-warning ms-2">精選</span>' : ''}
          </div>
          <h5 class="mb-1">${p.title}</h5>
          <p class="text-muted small mb-2">${p.description}</p>
          <div class="small text-muted">
            <span class="me-3">💰 $${p.price}</span>
            <span class="me-3">📦 ${p.category || 'N/A'}</span>
            <span>🆔 ${p.id}</span>
          </div>
        </div>
        <div class="col-auto">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="editProduct('${p.id}')">
            <i class="fas fa-edit"></i> 編輯
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${p.id}', '${p.title}')">
            <i class="fas fa-trash"></i> 刪除
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// 搜尋
document.getElementById('search-products')?.addEventListener('input', renderProducts);

// 新增產品
document.getElementById('product-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  // 驗證 Stripe Price ID 格式
  const stripePriceId = document.getElementById('stripe-price-id').value.trim();
  if (!stripePriceId.startsWith('price_')) {
    alert('❌ Stripe Price ID 格式錯誤！\n\n必須從 Stripe Dashboard 複製真實的 Price ID\n正確格式：price_1QKm8xHNWqZ9vYjJ\n\n請先在 Stripe 建立產品，再複製 Price ID 過來。');
    document.getElementById('stripe-price-id').focus();
    return;
  }

  if (stripePriceId.length < 20) {
    alert('❌ Price ID 太短！\n\n這不像是真實的 Stripe Price ID。\n請確認已從 Stripe Dashboard 複製完整的 ID。');
    document.getElementById('stripe-price-id').focus();
    return;
  }

  const productData = {
    type: document.getElementById('product-type').value,
    title: document.getElementById('product-title').value,
    description: document.getElementById('product-description').value,
    price: parseFloat(document.getElementById('product-price').value),
    category: document.getElementById('product-category').value,
    level: document.getElementById('product-level').value,
    stripeProductId: document.getElementById('stripe-product-id').value,
    stripePriceId: document.getElementById('stripe-price-id').value,
    coverImage: document.getElementById('cover-image').value,
    downloadUrl: document.getElementById('download-url').value,
    contentUrl: document.getElementById('content-url').value,
    tags: document.getElementById('product-tags').value.split(',').map(t => t.trim()).filter(t => t),
    totalUnits: parseInt(document.getElementById('total-units').value) || 0,
    freeUnits: parseInt(document.getElementById('free-units').value) || 0,
    creditsReward: parseInt(document.getElementById('credits-reward').value) || 0,
    isActive: document.getElementById('is-active').checked,
    isFeatured: document.getElementById('is-featured').checked,
    previewAvailable: document.getElementById('preview-available').checked
  };

  try {
    const url = editingProductId
      ? `${WORKER_BASE}/api/products/${editingProductId}?admin_key=${encodeURIComponent(adminKey)}`
      : `${WORKER_BASE}/api/products?admin_key=${encodeURIComponent(adminKey)}`;

    const method = editingProductId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });

    const result = await response.json();

    if (result.ok) {
      alert(editingProductId ? '產品已更新！' : '產品已建立！');
      cancelEdit();
      loadProducts();
    } else {
      alert('操作失敗：' + result.error);
    }
  } catch (error) {
    alert('錯誤：' + error.message);
  }
});

// 編輯產品
window.editProduct = function (productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  editingProductId = productId;
  const formTitle = document.getElementById('form-title');
  const submitBtnText = document.getElementById('submit-btn-text');
  if (formTitle) formTitle.textContent = '編輯產品';
  if (submitBtnText) submitBtnText.textContent = '更新產品';

  document.getElementById('product-type').value = product.type;
  document.getElementById('product-title').value = product.title;
  document.getElementById('product-description').value = product.description;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-category').value = product.category || '';
  document.getElementById('product-level').value = product.level || 'beginner';
  document.getElementById('stripe-product-id').value = product.stripeProductId || '';
  document.getElementById('stripe-price-id').value = product.stripePriceId || '';
  document.getElementById('cover-image').value = product.coverImage || '';
  document.getElementById('download-url').value = product.downloadUrl || '';
  document.getElementById('content-url').value = product.contentUrl || '';
  document.getElementById('product-tags').value = (product.tags || []).join(', ');
  document.getElementById('total-units').value = product.totalUnits || 0;
  document.getElementById('free-units').value = product.freeUnits || 0;
  document.getElementById('credits-reward').value = product.creditsReward || 0;
  document.getElementById('is-active').checked = product.isActive ?? true;
  document.getElementById('is-featured').checked = product.isFeatured ?? false;
  document.getElementById('preview-available').checked = product.previewAvailable ?? false;

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 刪除產品
window.deleteProduct = async function (productId, title) {
  if (!confirm(`確定要刪除「${title}」嗎？此操作無法復原！`)) return;

  try {
    const response = await fetch(
      `${WORKER_BASE}/api/products/${productId}?admin_key=${encodeURIComponent(adminKey)}`,
      { method: 'DELETE' }
    );

    const result = await response.json();

    if (result.ok) {
      alert('產品已刪除！');
      loadProducts();
    } else {
      alert('刪除失敗：' + result.error);
    }
  } catch (error) {
    alert('錯誤：' + error.message);
  }
};

// 取消編輯
document.getElementById('cancel-btn')?.addEventListener('click', cancelEdit);

function cancelEdit() {
  editingProductId = null;
  const formTitle = document.getElementById('form-title');
  const submitBtnText = document.getElementById('submit-btn-text');
  if (formTitle) formTitle.textContent = '新增產品';
  if (submitBtnText) submitBtnText.textContent = '建立產品';
  document.getElementById('product-form')?.reset();
}
