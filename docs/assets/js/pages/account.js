/**
 * Account Management Page Script
 * 帳戶管理：個人資料、頭像上傳、密碼重設、帳號刪除
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, updateProfile, signOut, sendPasswordResetEmail, reload, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, setDoc, doc, serverTimestamp, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZs2a35ENke7G8K7pzAMKCY3HOoi-IUcU",
  authDomain: "uxshari-670fd.firebaseapp.com",
  projectId: "uxshari-670fd",
  storageBucket: "uxshari-670fd.firebasestorage.app",
  appId: "1:907540538791:web:ed98ef4ba51c96de43c282"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 工具函數
const encEmail = (e) => btoa(e).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

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

const profileSection = document.getElementById('profile-section');
const authSection = document.getElementById('auth-section');
const avatarSection = document.getElementById('avatar-section');
const settingsSection = document.getElementById('settings-section');
const membershipSection = document.getElementById('membership-section');
const paymentsSection = document.getElementById('payments-section');
const emailEl = document.getElementById('userEmail');
const displayNameEl = document.getElementById('userDisplayName');
const saveBtn = document.getElementById('saveProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refresh-profile');
const triggerResetBtn = document.getElementById('trigger-reset');
const deleteAccountBtn = document.getElementById('delete-account-btn');

// Avatar elements
const avatarPreview = document.getElementById('avatar-preview');
const avatarFile = document.getElementById('avatar-file');
const avatarUploadBtn = document.getElementById('avatar-upload-btn');
const avatarCropOpen = document.getElementById('avatar-crop-open');

// Save toast
const toast = document.createElement('div');
toast.className = 'save-toast';
toast.innerHTML = '<span class="icon"><i class="fas fa-check"></i></span><span>已儲存</span>';
document.body.appendChild(toast);
function showSavedToast() {
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

// Input validation hints
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const displayNameInput = document.getElementById('userDisplayName');

emailInput?.addEventListener('blur', function () {
  const hint = document.getElementById('email-hint');
  if (this.validity.typeMismatch || this.validity.valueMissing) hint?.classList.add('show');
  else hint?.classList.remove('show');
});
passwordInput?.addEventListener('input', function () {
  const hint = document.getElementById('password-hint');
  if (this.value.length > 0 && this.value.length < 6) hint?.classList.add('show');
  else hint?.classList.remove('show');
});
displayNameInput?.addEventListener('input', function () {
  const hint = document.getElementById('displayname-hint');
  if (this.value.length > 0 && (this.value.length < 2 || this.value.length > 50)) hint?.classList.add('show');
  else hint?.classList.remove('show');
});

function updateNavbarAvatar(url) {
  try {
    if (!url) return;
    try { localStorage.setItem('userAvatar', url); sessionStorage.setItem('userAvatar', url); } catch (_) {}
    let navImg = document.getElementById('userAvatar');
    if (navImg && navImg.tagName === 'IMG') {
      navImg.src = url;
    } else {
      const navLink = document.querySelector('#mainNavbar a[href="account.html"]') || document.querySelector('a[href="account.html"]');
      if (navLink) {
        const img = document.createElement('img');
        img.id = 'userAvatar';
        img.alt = 'User Avatar';
        img.className = 'rounded-circle';
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.objectFit = 'cover';
        img.src = url;
        navLink.innerHTML = '';
        navLink.appendChild(img);
      }
    }
  } catch (_) { }
}

// Auth gating
onAuthStateChanged(auth, async (user) => {
  document.getElementById('loading-overlay').style.display = 'none';
  if (user) {
    authSection.classList.add('d-none');
    profileSection.classList.remove('d-none');
    avatarSection.classList.remove('d-none');
    settingsSection.classList.remove('d-none');
    membershipSection.classList.remove('d-none');
    paymentsSection.classList.remove('d-none');
    emailEl.textContent = user.email || '';
    displayNameEl.value = user.displayName || '';
    if (user.photoURL) { avatarPreview.src = user.photoURL; updateNavbarAvatar(user.photoURL); }
    
    // 載入會員資料與付款紀錄（即時監聽）
    if (user.email) {
      const docRef = doc(db, "users_by_email", encEmail(user.email));
      
      // 使用 onSnapshot 實現即時更新
      onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log('📊 [ACCOUNT] Firestore 資料更新:', data);
          
          // 更新會員狀態（修正目標節點 + 名稱調整）
          const statusBadge = document.getElementById('membership-badge-container');
          const statusText = document.getElementById('membership-status');
          const memberSince = document.getElementById('member-since');

          if (data.isPaid) {
            if (statusBadge) statusBadge.innerHTML = '<span class="badge bg-primary rounded-pill"><i class="fas fa-crown me-2"></i>VIP會員</span>';
            if (statusText) statusText.textContent = 'VIP會員';
          } else {
            if (statusBadge) statusBadge.innerHTML = '<span class="badge bg-light text-dark fs-6"><i class="fas fa-star me-2"></i>普通會員</span>';
            if (statusText) statusText.textContent = '普通會員';
          }
          
          // 顯示註冊日期
          if (data.createdAt) {
            const createdDate = toDate(data.createdAt);
            if (createdDate) {
              memberSince.textContent = createdDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
            }
          }
          
          // 顯示付款紀錄
          const payments = data.payments || [];
          const paymentsList = document.getElementById('payments-list');
          
          if (payments.length > 0) {
            paymentsList.innerHTML = payments.slice().reverse().map(p => {
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
          } else {
            paymentsList.innerHTML = '<p class="text-muted mb-0">尚無付款紀錄</p>';
          }
        } else {
          console.warn('⚠️ [ACCOUNT] Firestore 文檔不存在');
        }
      }, (error) => {
        console.error('❌ [ACCOUNT] Firestore 監聽錯誤:', error);
      });
    }
  } else {
    profileSection.classList.add('d-none');
    avatarSection.classList.add('d-none');
    settingsSection.classList.add('d-none');
    membershipSection.classList.add('d-none');
    paymentsSection.classList.add('d-none');
    authSection.classList.remove('d-none');
  }
});

// Email/password Login or Signup
document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput?.value?.trim();
  const pwd = passwordInput?.value;
  const errorEl = document.getElementById('error');
  if (!email || !pwd) return;
  errorEl?.classList.add('d-none');
  errorEl && (errorEl.textContent = '');
  try {
    await signInWithEmailAndPassword(auth, email, pwd);
  } catch (err) {
    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pwd);
        await setDoc(doc(db, 'users', cred.user.uid), { email, role: 'free', createdAt: serverTimestamp() }, { merge: true });
      } catch (signupErr) {
        errorEl && (errorEl.textContent = signupErr.message);
        errorEl?.classList.remove('d-none');
      }
    } else {
      errorEl && (errorEl.textContent = err.message);
      errorEl?.classList.remove('d-none');
    }
  }
});

// Google login
document.getElementById('google-auth')?.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    const errorEl = document.getElementById('error');
    errorEl && (errorEl.textContent = err.message);
    errorEl?.classList.remove('d-none');
  }
});

// 保存暱稱（同步到 Auth + Firestore）
saveBtn?.addEventListener('click', async function () {
  const user = auth.currentUser;
  if (!user) return;
  const name = (displayNameEl.value || '').trim();
  try {
    const statusEl = document.getElementById('profile-status');
    if (statusEl) { statusEl.textContent = '保存中…'; statusEl.classList.remove('success', 'error'); }
    await updateProfile(user, { displayName: name });
    try {
      await setDoc(doc(db, 'users', user.uid), { displayName: name, email: user.email || null, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) { console.warn('Firestore 同步暱稱失敗（已忽略）:', e?.message || e); }
    showSavedToast();
    if (statusEl) { statusEl.textContent = '已保存！'; statusEl.classList.add('success'); }
  } catch (err) {
    const statusEl = document.getElementById('profile-status');
    if (statusEl) { statusEl.textContent = '保存失敗：' + (err?.message || err); statusEl.classList.add('error'); }
    alert('❌ 更新失敗：' + err.message);
  }
});

// 登出
logoutBtn?.addEventListener('click', async function () {
  try { await signOut(auth); window.location.href = '/index.html'; }
  catch (err) { alert('❌ 登出錯誤：' + err.message); }
});

// 重新載入資料
refreshBtn?.addEventListener('click', async function () {
  try {
    await reload(auth.currentUser);
    const u = auth.currentUser; if (!u) return;
    displayNameEl.value = u.displayName || '';
    if (u.photoURL) avatarPreview.src = u.photoURL;
  } catch (err) { alert('❌ 重新載入失敗：' + err.message); }
});

// 密碼重設（透過彈窗中的 email 填入當前 email）
triggerResetBtn?.addEventListener('click', async function () {
  const u = auth.currentUser;
  if (!u?.email) return alert('請先登入');
  try { await sendPasswordResetEmail(auth, u.email); alert('已寄出密碼重設信到：' + u.email); }
  catch (err) { alert('❌ 寄送失敗：' + err.message); }
});

// 提供密碼重設 modal 控制（與舊 inline 調用相容）
window.openPasswordResetModal = () => {
  const modal = document.getElementById('password-reset-modal');
  if (!modal) return;
  modal.classList.add('active'); modal.style.display = 'block'; modal.style.opacity = '1'; modal.style.visibility = 'visible';
  document.body.style.overflow = 'hidden';
  const resetEmail = document.getElementById('reset-email');
  const u = auth.currentUser; if (u?.email && resetEmail) resetEmail.value = u.email;
};

const closeReset = () => {
  const modal = document.getElementById('password-reset-modal');
  if (!modal) return; modal.classList.remove('active'); modal.style.opacity = '0'; modal.style.visibility = 'hidden';
  setTimeout(() => modal.style.display = 'none', 300); document.body.style.overflow = '';
};

document.getElementById('close-reset-modal')?.addEventListener('click', closeReset);
document.getElementById('cancel-reset')?.addEventListener('click', closeReset);
document.getElementById('submit-reset')?.addEventListener('click', async () => {
  const email = document.getElementById('reset-email')?.value;
  if (!email) return alert('請輸入電子郵件地址！');
  try { await sendPasswordResetEmail(auth, email); alert('密碼重設連結已發送到您的電子郵件！'); closeReset(); }
  catch (error) { alert('發送密碼重設連結失敗：' + error.message); }
});

// Avatar upload + crop
let cropper;
avatarUploadBtn?.addEventListener('click', () => avatarFile.click());
avatarFile?.addEventListener('change', (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  const reader = new FileReader(); reader.onload = () => openCropperModal(reader.result); reader.readAsDataURL(file);
});

function openCropperModal(dataUrl) {
  const modalEl = document.createElement('div');
  modalEl.className = 'modal fade'; modalEl.tabIndex = -1;
  modalEl.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content" data-clarity-mask="true">
        <div class="modal-header">
          <h5 class="modal-title"><i class="fas fa-crop me-2"></i>裁剪頭像</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="crop-container" data-clarity-mask="true"><img id="crop-image" src="${dataUrl}" alt="Crop"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-primary-shari" id="confirm-crop">裁剪並保存</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modalEl);
  const bsModal = new bootstrap.Modal(modalEl); bsModal.show();

  modalEl.addEventListener('shown.bs.modal', () => {
    const img = modalEl.querySelector('#crop-image');
    if (img.complete) initCropper(img); else img.addEventListener('load', () => initCropper(img));
  });

  function initCropper(img) {
    cropper = new Cropper(img, {
      aspectRatio: 1, viewMode: 1, dragMode: 'move', background: true, autoCropArea: 0.9,
      responsive: true, restore: false, guides: true, center: true, highlight: true,
      cropBoxMovable: true, cropBoxResizable: true, toggleDragModeOnDblclick: false,
      minCropBoxWidth: 100, minCropBoxHeight: 100,
      ready: function () { console.log('✅ Cropper initialized'); }
    });
  }

  modalEl.addEventListener('hidden.bs.modal', () => { try { cropper?.destroy(); } catch (_) { } modalEl.remove(); });

  const confirmBtn = modalEl.querySelector('#confirm-crop');
  const cancelBtn = modalEl.querySelector('[data-bs-dismiss="modal"]');
  confirmBtn?.addEventListener('click', async () => {
    try {
      confirmBtn.disabled = true; cancelBtn?.setAttribute('disabled', 'true');
      confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>保存中…';

      const canvas = cropper.getCroppedCanvas({ width: 256, height: 256, imageSmoothingQuality: 'high' });
      let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
      if (!blob) blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      if (!blob) throw new Error('裁剪失敗');

      const user = auth.currentUser; if (!user) throw new Error('請先登入');
      const timestamp = Date.now();
      const fileRef = sRef(storage, `avatars/${user.uid}_${timestamp}.jpg`);
      await uploadBytes(fileRef, blob, { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000', customMetadata: { optimized: 'true' } });
      const url = await getDownloadURL(fileRef);

      await updateProfile(user, { photoURL: url });
      try {
        await setDoc(doc(db, 'users', user.uid), { photoURL: url, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) { console.warn('Firestore 同步頭像失敗（已忽略）:', e?.message || e); }

      // Storage hygiene: remove older avatars for this user
      try {
        const list = await listAll(sRef(storage, 'avatars'));
        const prefix = `${user.uid}_`;
        const toDelete = list.items.filter(it => it.name.startsWith(prefix) && it.fullPath !== fileRef.fullPath);
        await Promise.allSettled(toDelete.map(obj => deleteObject(obj)));
      } catch (e) { console.warn('清理舊頭像失敗（已忽略）:', e?.message || e); }

      // Update preview and navbar + persist avatar URL
      avatarPreview.src = url;
      updateNavbarAvatar(url);
      confirmBtn.blur(); bsModal.hide();
      showSavedToast();
      const statusEl = document.getElementById('avatar-status');
      if (statusEl) { statusEl.textContent = '已保存！'; statusEl.classList.remove('error'); statusEl.classList.add('success'); }
    } catch (err) {
      const statusEl = document.getElementById('avatar-status');
      if (statusEl) { statusEl.textContent = '保存失敗：' + (err?.message || err); statusEl.classList.remove('success'); statusEl.classList.add('error'); }
      alert('❌ 上載失敗：' + err.message);
    } finally {
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.innerHTML = '裁剪並保存'; }
      cancelBtn?.removeAttribute('disabled');
    }
  });
  modalEl.addEventListener('hidden.bs.modal', () => { try { avatarUploadBtn?.focus(); } catch (_) { } });
}

// Delete account with re-auth
deleteAccountBtn?.addEventListener('click', function () {
  const modal = new bootstrap.Modal(document.getElementById('delete-reauth-modal')); modal.show();
});

document.getElementById('confirm-delete')?.addEventListener('click', async function () {
  const password = document.getElementById('reauth-password').value; if (!password) return alert('請輸入密碼');
  const user = auth.currentUser; if (!user?.email) return alert('請先登入');
  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    await deleteDoc(doc(db, 'users', user.uid));
    await deleteUser(user);
    alert('帳號已刪除，感謝使用 UXShari'); window.location.href = '/index.html';
  } catch (err) {
    if (err.code === 'auth/wrong-password') alert('❌ 密碼錯誤，請重試');
    else if (err.code === 'auth/requires-recent-login') alert('❌ 請登出後重新登入，再執行刪除');
    else alert('❌ 刪除失敗：' + err.message);
  }
});
