/**
 * Dashboard Page Script
 * 會員專區：預約管理、產品商店、付款紀錄
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyCZs2a35ENke7G8K7pzAMKCY3HOoi-IUcU",
  authDomain: "uxshari-670fd.firebaseapp.com",
  projectId: "uxshari-670fd",
  appId: "1:907540538791:web:ed98ef4ba51c96de43c282"
};

if (!getApps().length) initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// 工具函數
const encEmail = (e) => btoa(e).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
const hideLoading = () => document.getElementById('loading-overlay').style.display = 'none';
const showLoading = () => document.getElementById('loading-overlay').style.display = 'flex';

// 日期解析與格式化（容錯處理）
function toDate(val) {
  try {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    const t = typeof val;
    if (t === 'number') {
      const ms = val < 1e12 ? val * 1000 : val;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    if (t === 'string') {
      const s = val.trim();
      if (/^\d+$/.test(s)) {
        const n = Number(s);
        return toDate(n);
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    if (t === 'object') {
      if (typeof val.seconds === 'number') {
        const ms = val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1e6);
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof val._seconds === 'number') {
        const ms = val._seconds * 1000 + Math.floor((val._nanoseconds || 0) / 1e6);
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof val.toDate === 'function') {
        try {
          const d = val.toDate();
          return isNaN(d?.getTime?.()) ? null : d;
        } catch {}
      }
    }
  } catch (_) {}
  return null;
}

function formatTW(val) {
  const d = toDate(val);
  if (!d) return '日期未知';
  try {
    return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return d.toISOString();
  }
}

// 金額顯示（容錯）
function formatAmount(pay) {
  const cur = (pay?.currency || 'USD').toUpperCase();
  let amt = null;
  if (typeof pay?.amount === 'number') amt = pay.amount;
  else if (typeof pay?.amount_total === 'number') amt = pay.amount_total / 100;
  else if (typeof pay?.amount_usd === 'number') amt = pay.amount_usd;
  else if (typeof pay?.unit_amount === 'number') amt = pay.unit_amount / 100;
  else if (typeof pay?.amount_cents === 'number') amt = pay.amount_cents / 100;
  else if (typeof pay?.price === 'number') amt = pay.price;
  const amtStr = (amt == null || Number.isNaN(amt)) ? '-' : Number(amt).toFixed(2);
  return { currency: cur, amountStr: amtStr };
}

// UI 元素
const elements = {
  userName: document.getElementById('user-name'),
  statusBadge: document.getElementById('status-badge-container'),
  creditsCount: document.getElementById('credits-count'),
  creditsCard: document.getElementById('credits-card'),
  bookBtn: document.getElementById('book-session-btn'),
  buyLink: document.getElementById('buy-link'),
  noCreditsAlert: document.getElementById('no-credits-alert'),
  hasCreditsAlert: document.getElementById('has-credits-alert'),
  paymentsList: document.getElementById('payments-list'),
  logoutBtn: document.getElementById('logout-btn')
};

// 登出功能
elements.logoutBtn.addEventListener('click', async () => {
  if (confirm('確定要登出嗎？')) {
    try {
      await signOut(auth);
      window.location.href = '/index.html';
    } catch (error) {
      console.error('登出錯誤:', error);
      alert('登出失敗，請重試');
    }
  }
});

// 更新 UI
function updateUI(userData) {
  console.log("📊 [DASHBOARD] updateUI 被呼叫，完整資料：", userData);
  const credits = userData?.credits ?? 0;
  const isPaid = userData?.isPaid ?? false;
  const payments = userData?.payments ?? [];
  console.log("📅 [DASHBOARD] 解析結果 - credits:", credits, "payments:", payments.length);

  // 更新額度顯示（帶動畫）
  elements.creditsCount.textContent = credits;
  elements.creditsCard.classList.add('credits-updated');
  setTimeout(() => elements.creditsCard.classList.remove('credits-updated'), 500);

  // 更新會員狀態徽章
  if (isPaid) {
    elements.statusBadge.innerHTML = `
      <span class="status-badge paid">
        <i class="fas fa-crown"></i>
        付費會員
      </span>
    `;
  } else {
    elements.statusBadge.innerHTML = `
      <span class="status-badge free">
        <i class="fas fa-star"></i>
        免費會員
      </span>
    `;
  }

  // 更新預約按鈕
  if (credits > 0) {
    elements.bookBtn.disabled = false;
    elements.bookBtn.innerHTML = '<i class="fas fa-calendar-check me-2"></i> 立即預約 50 分鐘輔導';
    elements.bookBtn.onclick = async () => {
      try {
        elements.bookBtn.disabled = true;
        elements.bookBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> 準備預約連結...';
        const workerBase = 'https://uxshari-workers.uxshari.workers.dev';
        const res = await fetch(`${workerBase}/api/create-scheduling-link?email=${encodeURIComponent(auth.currentUser.email)}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || '建立預約連結失敗');
        window.open(data.url, '_blank');
      } catch (e) {
        alert(e.message || '無法建立預約連結，請稍後再試');
      } finally {
        elements.bookBtn.disabled = false;
        elements.bookBtn.innerHTML = '<i class="fas fa-calendar-check me-2"></i> 立即預約 50 分鐘輔導';
      }
    };
    elements.noCreditsAlert.classList.add('d-none');
    elements.hasCreditsAlert.classList.remove('d-none');
  } else {
    elements.bookBtn.disabled = true;
    elements.bookBtn.innerHTML = '<i class="fas fa-lock me-2"></i> 需先購買預約額度';
    elements.noCreditsAlert.classList.remove('d-none');
    elements.hasCreditsAlert.classList.add('d-none');
  }

  // 更新付款紀錄
  if (payments.length > 0) {
    elements.paymentsList.innerHTML = payments.slice().reverse().map(p => {
      const { currency, amountStr } = formatAmount(p);
      return `
      <div class="d-flex justify-content-between align-items-center border-bottom py-3">
        <div>
          <div class="fw-bold">${currency} $${amountStr}</div>
          <div class="small text-muted">${formatTW(p.createdAt)}</div>
          ${p.receiptUrl ? `<a class="small" href="${p.receiptUrl}" target="_blank">查看收據</a>` : ''}
        </div>
        <span class="badge bg-success">已完成</span>
      </div>
      `;
    }).join('');
  }
}

// 監聽認證狀態
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    hideLoading();
    window.location.href = '/index.html';
    return;
  }

  // 更新用戶名稱
  elements.userName.textContent = user.displayName || user.email?.split('@')[0] || '會員';

  // 更新購買連結（預填 email）
  if (user.email) {
    const workerBase = 'https://uxshari-workers.uxshari.workers.dev';
    elements.buyLink.href = `${workerBase}/api/checkout-redirect?email=${encodeURIComponent(user.email)}&origin=${encodeURIComponent(location.origin)}`;
    elements.buyLink.target = '_self';
  }

  // 讀取 Firestore 資料（即時監聽）
  if (user.email) {
    const docRef = doc(db, "users_by_email", encEmail(user.email));
    console.log("🔍 [DASHBOARD] 開始監聽 Firestore：", `users_by_email/${encEmail(user.email)}`);

    // 使用 onSnapshot 實現即時更新
    onSnapshot(docRef, (snapshot) => {
      hideLoading();
      console.log("📩 [DASHBOARD] Firestore snapshot 收到，exists:", snapshot.exists());
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log("✅ [DASHBOARD] Firestore 完整資料：", data);
        updateUI(data);
      } else {
        console.warn("⚠️ [DASHBOARD] Firestore 文檔不存在");
        updateUI({});
      }
    }, (error) => {
      console.error('❌ [DASHBOARD] Firestore 監聽錯誤:', error);
      hideLoading();
      alert('無法載入資料，請重新整理頁面');
    });
  } else {
    hideLoading();
  }
});

// ============================================================
// 🛍️ 產品商店功能
// ============================================================
const WORKER_BASE = 'https://uxshari-workers.uxshari.workers.dev';
let allProducts = [];
let userPurchasedProducts = [];
let currentFilter = 'all';

// 產品類型圖標和顯示名稱
const productTypeConfig = {
  tool: { icon: '🧰', name: '工具', class: 'product-type-tool' },
  course: { icon: '📚', name: '課程', class: 'product-type-course' },
  challenge: { icon: '🎯', name: '挑戰', class: 'product-type-challenge' },
  resource: { icon: '📦', name: '資源', class: 'product-type-resource' }
};

// 載入產品列表
async function loadProducts() {
  try {
    const response = await fetch(`${WORKER_BASE}/api/products?active=true`);
    const data = await response.json();

    if (data.ok) {
      allProducts = data.products;
      renderProducts();
    } else {
      throw new Error(data.error || '載入產品失敗');
    }
  } catch (error) {
    console.error('❌ 載入產品錯誤:', error);
    document.getElementById('products-loading').innerHTML = `
      <div class="text-center text-danger">
        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
        <p>載入產品失敗，請重新整理頁面</p>
      </div>
    `;
  }
}

// 載入使用者已購產品
async function loadUserPurchases(email) {
  try {
    const response = await fetch(`${WORKER_BASE}/api/user/purchased-products?email=${encodeURIComponent(email)}`);
    const data = await response.json();

    if (data.ok) {
      userPurchasedProducts = data.purchasedProducts || [];
      if (allProducts.length > 0) {
        renderProducts();
      }
    }
  } catch (error) {
    console.error('❌ 載入購買紀錄錯誤:', error);
  }
}

// 檢查產品是否已購買
function isPurchased(productId) {
  return userPurchasedProducts.some(p => p.productId === productId);
}

// 獲取產品進度
function getProductProgress(productId) {
  const purchase = userPurchasedProducts.find(p => p.productId === productId);
  return purchase?.progress || null;
}

// 渲染產品卡片
function renderProducts() {
  const grid = document.getElementById('products-grid');
  const loading = document.getElementById('products-loading');
  const empty = document.getElementById('products-empty');
  const searchInput = document.getElementById('product-search');

  if (!grid || !loading || !empty || !searchInput) {
    console.error('❌ Required DOM elements not found');
    return;
  }

  const searchTerm = searchInput.value.toLowerCase();

  // 篩選產品
  let filtered = allProducts.filter(p => {
    const matchFilter = currentFilter === 'all' || p.type === currentFilter;
    const matchSearch = !searchTerm ||
      p.title.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      (p.tags || []).some(tag => tag.toLowerCase().includes(searchTerm));
    return matchFilter && matchSearch;
  });

  loading.classList.add('d-none');

  if (filtered.length === 0) {
    empty.classList.remove('d-none');
    grid.innerHTML = '';
    return;
  }

  empty.classList.add('d-none');

  // 渲染卡片
  grid.innerHTML = filtered.map(product => {
    const config = productTypeConfig[product.type] || productTypeConfig.tool;
    const purchased = isPurchased(product.id);
    const progress = getProductProgress(product.id);
    const progressPercent = progress ? Math.round((progress.completedUnits.length / progress.totalUnits) * 100) : 0;

    return `
      <div class="col-md-6 col-lg-4">
        <div class="product-card" data-product-id="${product.id}">
          <div class="position-relative product-card-image-wrapper">
            <img src="${product.coverImage || 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=1200&h=800&fit=crop'}" 
                 class="product-card-image" 
                 alt="${product.title}"
                 loading="lazy"
                 onerror="this.src='https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=1200&h=800&fit=crop'">
            <span class="product-badge ${purchased ? 'unlocked' : 'locked'}">
              <i class="fas ${purchased ? 'fa-check-circle' : 'fa-lock'} me-1"></i>
              ${purchased ? '已解鎖' : '$' + product.price}
            </span>
          </div>
          
          <div class="p-3 flex-grow-1 d-flex flex-column">
            <div class="${config.class} product-type-icon">
              ${config.icon}
            </div>
            
            <h5 class="mb-2">${product.title}</h5>
            <p class="text-muted small mb-3">${product.description}</p>
            
            ${progress ? `
              <div class="mb-3">
                <div class="d-flex justify-content-between small text-muted mb-1">
                  <span>學習進度</span>
                  <span>${progress.completedUnits.length}/${progress.totalUnits} 單元</span>
                </div>
                <div class="product-progress">
                  <div class="product-progress-bar" style="width: ${progressPercent}%"></div>
                </div>
              </div>
            ` : ''}
            
            ${(product.tags || []).length > 0 ? `
              <div class="product-tags">
                ${product.tags.slice(0, 3).map(tag => `
                  <span class="product-tag">${tag}</span>
                `).join('')}
              </div>
            ` : ''}
            
            <div class="mt-auto pt-3">
              ${purchased ? `
                <button class="btn btn-success w-100" onclick="window.dashboardAccessProduct('${product.id}', '${product.type}', '${product.contentUrl || product.downloadUrl}')">
                  <i class="fas fa-${product.type === 'tool' ? 'download' : 'play-circle'} me-2"></i>
                  ${product.type === 'tool' ? '下載' : product.type === 'course' ? '繼續學習' : '開始挑戰'}
                </button>
              ` : `
                <button class="btn btn-primary-shari w-100" onclick="window.dashboardPurchaseProduct('${product.id}')">
                  <i class="fas fa-shopping-cart me-2"></i>
                  購買 - $${product.price}
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 購買產品
window.dashboardPurchaseProduct = async function (productId) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    alert('請先登入');
    return;
  }

  try {
    const btn = event.target.closest('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> 處理中...';

    const response = await fetch(`${WORKER_BASE}/api/checkout/create-product-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        userEmail: user.email
      })
    });

    const data = await response.json();

    if (data.ok && data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      throw new Error(data.error || '建立付款頁面失敗');
    }
  } catch (error) {
    console.error('❌ 購買錯誤:', error);
    alert(error.message || '購買失敗，請重試');
    event.target.closest('button').disabled = false;
    event.target.closest('button').innerHTML = '<i class="fas fa-shopping-cart me-2"></i> 購買';
  }
};

// 存取產品
window.dashboardAccessProduct = function (productId, type, url) {
  if (type === 'course') {
    window.location.href = `/lesson.html?course=${productId}`;
  } else if (type === 'challenge') {
    window.location.href = `/challenge.html?id=${productId}`;
  } else if (url) {
    window.open(url, '_blank');
  } else {
    alert('此產品暫無內容連結');
  }
};

// 篩選按鈕事件
document.getElementById('product-filter-buttons')?.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    document.querySelectorAll('#product-filter-buttons button').forEach(btn => {
      btn.classList.remove('active');
    });
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderProducts();
  }
});

// 搜尋事件
document.getElementById('product-search')?.addEventListener('input', () => {
  renderProducts();
});

// 初始化產品
loadProducts();

// 當使用者登入後載入已購產品
onAuthStateChanged(auth, (user) => {
  if (user && user.email) {
    loadUserPurchases(user.email);
  }
});
