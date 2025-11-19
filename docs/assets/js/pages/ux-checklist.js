    import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
    import { getFirestore, doc, getDoc, setDoc, updateDoc, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

    // Firebase Config
    const firebaseConfig = {
      apiKey: "AIzaSyCZs2a35ENke7G8K7pzAMKCY3HOoi-IUcU",
      authDomain: "uxshari-670fd.firebaseapp.com",
      projectId: "uxshari-670fd",
      appId: "1:907540538791:web:ed98ef4ba51c96de43c282"
    };

    if (!getApps().length) initializeApp(firebaseConfig);
    const auth = getAuth();
    const db = getFirestore();
    // Enable offline persistence without top-level await for broader browser support
    enableIndexedDbPersistence(db).catch(() => {});

    const encEmail = (e) => btoa(e).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");

    // 專案類型與模板定義
    const projectTypes = [
      {
        id: 'ecommerce',
        name: '電商平台',
        icon: '🛒',
        desc: '購物、結帳、物流',
        template: {
          process: [
            { id: 'e_p1', text: '商品搜尋功能是否直覺？能否快速找到目標商品？', checked: false, suggestion: '建議：加入智能推薦、篩選條件' },
            { id: 'e_p2', text: '加入購物車流程是否順暢？', checked: false, suggestion: '參考：一鍵加購、批量選購' },
            { id: 'e_p3', text: '結帳步驟是否過於複雜？需要多少步驟完成？', checked: false, suggestion: '優化：減少表單欄位、支援快速結帳' },
            { id: 'e_p4', text: '付款方式是否多元？（信用卡、轉帳、第三方支付）', checked: false, suggestion: '提供：多種支付選項提升轉換率' },
            { id: 'e_p5', text: '訂單追蹤與退貨流程是否清晰？', checked: false, suggestion: '必備：即時物流追蹤、簡易退貨政策' }
          ],
          interface: [
            { id: 'e_i1', text: '商品圖片是否清晰？支援多角度檢視？', checked: false, suggestion: '建議：360度檢視、放大功能' },
            { id: 'e_i2', text: '商品描述是否完整？（規格、尺寸、材質）', checked: false, suggestion: '優化：結構化描述、對比表格' },
            { id: 'e_i3', text: '價格、折扣顯示是否清楚？', checked: false, suggestion: '透明：原價、折扣、運費一目了然' },
            { id: 'e_i4', text: '購物車圖示與商品數量提示是否明顯？', checked: false, suggestion: '設計：固定懸浮按鈕、數字徽章' },
            { id: 'e_i5', text: '行動版商品卡片是否易於瀏覽與點擊？', checked: false, suggestion: '響應式：大縮圖、清晰CTA' }
          ],
          context: [
            { id: 'e_c1', text: '首次訪客能否快速理解網站賣什麼？', checked: false, suggestion: '首頁：清晰價值主張、熱門商品' },
            { id: 'e_c2', text: '是否提供客服管道？（線上客服、FAQ）', checked: false, suggestion: '即時：聊天機器人、常見問題' },
            { id: 'e_c3', text: '網站載入速度是否夠快？（特別是商品圖片）', checked: false, suggestion: '優化：圖片壓縮、CDN加速' },
            { id: 'e_c4', text: '是否支援訪客結帳？（無需強制註冊）', checked: false, suggestion: '彈性：訪客結帳降低門檻' },
            { id: 'e_c5', text: '是否有信任指標？（評論、認證、退款保證）', checked: false, suggestion: '建立信任：用戶評價、安全標章' }
          ]
        }
      },
      {
        id: 'education',
        name: '教育平台',
        icon: '📚',
        desc: '課程、學習、進度',
        template: {
          process: [
            { id: 'ed_p1', text: '課程搜尋與篩選是否直覺？', checked: false, suggestion: '建議：依類別、難度、評分篩選' },
            { id: 'ed_p2', text: '註冊/登入流程是否簡潔？', checked: false, suggestion: '優化：社群登入、單頁註冊' },
            { id: 'ed_p3', text: '購買課程流程是否順暢？', checked: false, suggestion: '簡化：快速結帳、試看功能' },
            { id: 'ed_p4', text: '學習進度是否能自動儲存與同步？', checked: false, suggestion: '必備：跨裝置學習進度同步' },
            { id: 'ed_p5', text: '作業提交與批改流程是否清楚？', checked: false, suggestion: '明確：截止日期、提交狀態' }
          ],
          interface: [
            { id: 'ed_i1', text: '課程導航是否清晰？（章節、單元）', checked: false, suggestion: '設計：側邊欄目錄、進度條' },
            { id: 'ed_i2', text: '影片播放器是否易用？（速度調整、字幕）', checked: false, suggestion: '功能：倍速播放、重點筆記' },
            { id: 'ed_i3', text: '學習儀表板是否一目了然？', checked: false, suggestion: '視覺：學習時數、完成課程、成就' },
            { id: 'ed_i4', text: '課程資料下載是否方便？（講義、作業）', checked: false, suggestion: '便利：一鍵下載全部資料' },
            { id: 'ed_i5', text: '討論區與問答功能是否易於使用？', checked: false, suggestion: '互動：標籤分類、搜尋功能' }
          ],
          context: [
            { id: 'ed_c1', text: '新學員能否快速找到適合的課程？', checked: false, suggestion: '引導：推薦系統、學習路徑' },
            { id: 'ed_c2', text: '是否提供試看或免費課程？', checked: false, suggestion: '降低門檻：試看 10分鐘' },
            { id: 'ed_c3', text: '是否支援離線學習？', checked: false, suggestion: '彈性：下載課程離線觀看' },
            { id: 'ed_c4', text: '是否有學習提醒與激勵機制？', checked: false, suggestion: '持續學習：每日提醒、成就徽章' },
            { id: 'ed_c5', text: '行動裝置學習體驗是否流暢？', checked: false, suggestion: '優化：響應式設計、觸控友善' }
          ]
        }
      },
      {
        id: 'onboarding',
        name: 'App 引導',
        icon: '🚀',
        desc: '新手教學、權限',
        template: {
          process: [
            { id: 'ob_p1', text: '首次啟動時，價值主張是否清晰？', checked: false, suggestion: '建議：3秒內說明核心價值' },
            { id: 'ob_p2', text: '註冊流程是否簡潔？（3步驟內完成）', checked: false, suggestion: '優化：延後非必要資訊收集' },
            { id: 'ob_p3', text: '引導流程是否可跳過？', checked: false, suggestion: '彈性：提供「跳過」選項' },
            { id: 'ob_p4', text: '權限請求是否在適當時機出現？', checked: false, suggestion: '時機：用到才請求，說明原因' },
            { id: 'ob_p5', text: '完成引導後，使用者是否知道下一步？', checked: false, suggestion: '明確：CTA 引導第一個行動' }
          ],
          interface: [
            { id: 'ob_i1', text: '引導畫面是否視覺友善？（插圖、動畫）', checked: false, suggestion: '設計：簡潔插圖、流暢動畫' },
            { id: 'ob_i2', text: '進度指示器是否清楚？（第幾步/共幾步）', checked: false, suggestion: '視覺：進度點、百分比' },
            { id: 'ob_i3', text: '文字說明是否簡潔易懂？（避免專業術語）', checked: false, suggestion: '文案：口語化、關注利益點' },
            { id: 'ob_i4', text: '按鈕設計是否明確？（繼續、跳過、完成）', checked: false, suggestion: '清晰：主要CTA突出' },
            { id: 'ob_i5', text: '是否支援手勢操作？（滑動切換）', checked: false, suggestion: '互動：滑動換頁、點擊跳轉' }
          ],
          context: [
            { id: 'ob_c1', text: '引導內容是否能個人化？（依用戶類型）', checked: false, suggestion: '智能：依使用情境調整' },
            { id: 'ob_c2', text: '是否提供互動式教學？（而非純文字）', checked: false, suggestion: '體驗：讓用戶實際操作' },
            { id: 'ob_c3', text: '引導結束後，是否可重新查看？', checked: false, suggestion: '幫助：設定中提供教學重播' },
            { id: 'ob_c4', text: '首次使用是否有範例資料？', checked: false, suggestion: '降低門檻：預載範例內容' },
            { id: 'ob_c5', text: '是否追蹤引導完成率？（優化弱點）', checked: false, suggestion: '數據：分析流失步驟' }
          ]
        }
      },
      {
        id: 'saas',
        name: 'SaaS 工具',
        icon: '⚙️',
        desc: '協作、訂閱、儀表板',
        template: {
          process: [
            { id: 'saas_p1', text: '免費試用流程是否簡單？（無需信用卡）', checked: false, suggestion: '降低門檻：免卡試用' },
            { id: 'saas_p2', text: '資料匯入/匯出是否方便？', checked: false, suggestion: '必備：支援多種格式' },
            { id: 'saas_p3', text: '團隊協作邀請流程是否順暢？', checked: false, suggestion: '便利：Email 邀請、角色管理' },
            { id: 'saas_p4', text: '訂閱升級/降級流程是否清楚？', checked: false, suggestion: '透明：方案比較、無痛切換' },
            { id: 'saas_p5', text: '取消訂閱是否容易？（不刻意刁難）', checked: false, suggestion: '誠信：簡單取消建立信任' }
          ],
          interface: [
            { id: 'saas_i1', text: '儀表板是否清晰展示關鍵數據？', checked: false, suggestion: '設計：卡片式布局、圖表視覺化' },
            { id: 'saas_i2', text: '設定選項是否易於找到與調整？', checked: false, suggestion: '組織：分類清楚、搜尋功能' },
            { id: 'saas_i3', text: '通知系統是否不過度打擾？', checked: false, suggestion: '平衡：重要通知、可自訂' },
            { id: 'saas_i4', text: '搜尋功能是否強大且快速？', checked: false, suggestion: '必備：全局搜尋、快捷鍵' },
            { id: 'saas_i5', text: '深色模式支援是否完整？', checked: false, suggestion: '體驗：保護視力、節省電力' }
          ],
          context: [
            { id: 'saas_c1', text: '產品導覽是否針對不同角色？', checked: false, suggestion: '個人化：管理員vs使用者' },
            { id: 'saas_c2', text: '是否提供API文件與整合支援？', checked: false, suggestion: '擴展性：開放API、Webhook' },
            { id: 'saas_c3', text: '客服回應速度是否快速？', checked: false, suggestion: '保證：SLA承諾、多管道支援' },
            { id: 'saas_c4', text: '是否有完整的說明文件與影片教學？', checked: false, suggestion: '自助：知識庫、影片庫' },
            { id: 'saas_c5', text: '資料安全與隱私保護是否清楚說明？', checked: false, suggestion: '信任：認證標章、隱私政策' }
          ]
        }
      },
      {
        id: 'general',
        name: '通用模板',
        icon: '📋',
        desc: '基礎痛點檢查',
        template: {
          process: [
            { id: 'p1', text: '註冊/登入流程是否過於複雜或步驟過多？', checked: false, suggestion: '建議：社群登入、減少必填欄位' },
            { id: 'p2', text: '使用者能否清楚理解下一步該做什麼？', checked: false, suggestion: '優化：清晰CTA、引導提示' },
            { id: 'p3', text: '完成核心任務需要經過幾個步驟？是否可以簡化？', checked: false, suggestion: '精簡：3步驟內完成主要任務' },
            { id: 'p4', text: '錯誤處理機制是否明確？使用者知道如何修正錯誤嗎？', checked: false, suggestion: '友善：具體錯誤訊息、修正建議' },
            { id: 'p5', text: '是否有不必要的確認步驟或重複操作？', checked: false, suggestion: '流暢：減少摩擦點' }
          ],
          interface: [
            { id: 'i1', text: 'CTA 按鈕是否足夠明顯？位置是否符合使用者預期？', checked: false, suggestion: '設計：對比色、F型閱讀路徑' },
            { id: 'i2', text: '導覽列是否清晰？使用者能否快速找到目標功能？', checked: false, suggestion: '結構：扁平化、搜尋功能' },
            { id: 'i3', text: '表單設計是否友善？欄位標籤是否清楚？', checked: false, suggestion: '易用：內嵌標籤、即時驗證' },
            { id: 'i4', text: '視覺層級是否合理？重要資訊是否突出？', checked: false, suggestion: '視覺：大小、顏色、位置' },
            { id: 'i5', text: '行動裝置上的可點擊區域是否夠大（至少 44×44px）？', checked: false, suggestion: '觸控：足夠點擊區域' }
          ],
          context: [
            { id: 'c1', text: '使用情境是否符合目標使用者的真實需求？', checked: false, suggestion: '用戶研究：訪談、觀察' },
            { id: 'c2', text: '是否考慮到不同裝置（手機/平板/桌機）的使用情境？', checked: false, suggestion: '響應式：各尺寸測試' },
            { id: 'c3', text: '首次使用者是否能理解產品價值與使用方法？', checked: false, suggestion: '清晰：價值主張、引導流程' },
            { id: 'c4', text: '是否有考慮到網路不穩定或載入緩慢的情況？', checked: false, suggestion: '體驗：離線模式、骨架屏' },
            { id: 'c5', text: '多語系使用者是否能順暢使用？（中英文切換、文字長度）', checked: false, suggestion: '國際化：i18n、彈性布局' }
          ]
        }
      }
    ];

    let userEmail = '';
    let userChecklists = [];
    let isPaid = false;
    let selectedProjectType = null;
    let selectedIndex = -1;
    let searchQuery = '';
    const FREE_LIMIT = 3;

    // Undo State
    let undoTimer = null;
    let lastDeleted = null; // { data, index }

    // UI Elements
    const elements = {
      // Sidebar
      sidebarFavorites: document.getElementById('favorites-list'),
      sidebarAll: document.getElementById('all-list'),
      sidebarSearch: document.getElementById('sidebar-search'),
      emptyState: document.getElementById('empty-state'),
      createBtn: document.getElementById('create-checklist-btn'),
      limitNotice: document.getElementById('limit-notice'),
      // Header counters
      userStatus: document.getElementById('user-status'),
      userStatusBadge: document.getElementById('user-status-badge'),
      checklistCount: document.getElementById('checklist-count'),
      checklistLimit: document.getElementById('checklist-limit'),
      // Detail
      detailTitle: document.getElementById('detail-title'),
      detailProgressBar: document.getElementById('detail-progress-bar'),
      detailUpdated: document.getElementById('detail-updated'),
      detailSections: document.getElementById('detail-sections'),
      detailEmpty: document.getElementById('detail-empty'),
      btnDuplicate: document.getElementById('btn-duplicate'),
      btnPrint: document.getElementById('btn-print'),
      btnDelete: document.getElementById('btn-delete'),
      perkPdf: document.getElementById('perk-pdf'),
      perkAi: document.getElementById('perk-ai'),
      perkTeam: document.getElementById('perk-team')
    };

    // First paint: ensure UI becomes interactive even before data
    try { updateUI(); } catch (_) {}

    let dataReady = false;
    // Watchdog: ensure UI becomes interactive quickly even before data
    function scheduleInitialUIFlush() {
      setTimeout(() => {
        if (!dataReady) {
          try { updateUI(); } catch(_) {}
        }
      }, 800);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scheduleInitialUIFlush);
    } else {
      scheduleInitialUIFlush();
    }

    // Load User Data
    async function loadUserData(email) {
      const uid = (auth.currentUser && auth.currentUser.uid) || '';
      const refEmail = doc(db, 'users_by_email', encEmail(email));
      const refUid = uid ? doc(db, 'users', uid) : null;

      let emailData = null;
      let uidData = null;

      // Read both paths (sequential to keep it simple and robust to auth state)
      try {
        const snapEmail = await getDoc(refEmail);
        if (snapEmail.exists()) emailData = snapEmail.data();
      } catch (err) {
        console.warn('讀取 users_by_email 失敗：', err?.message || err);
      }
      try {
        if (refUid) {
          const snapUid = await getDoc(refUid);
          if (snapUid.exists()) uidData = snapUid.data();
        }
      } catch (err2) {
        console.warn('讀取 users/{uid} 失敗：', err2?.message || err2);
      }

      const emailLists = (emailData && Array.isArray(emailData.uxChecklists)) ? emailData.uxChecklists : [];
      const uidLists = (uidData && Array.isArray(uidData.uxChecklists)) ? uidData.uxChecklists : [];

      // Prefer non-empty source; otherwise prefer users_by_email if present; else users/{uid}; else init
      let source = 'none';
      if (emailLists.length > 0) {
        userChecklists = emailLists;
        source = 'users_by_email';
      } else if (uidLists.length > 0) {
        userChecklists = uidLists;
        source = 'users_uid';
      } else if (emailData) {
        userChecklists = emailLists;
        source = 'users_by_email';
      } else if (uidData) {
        userChecklists = uidLists;
        source = 'users_uid';
      } else {
        userChecklists = [];
        source = 'none';
      }

      // Merge membership flags (prefer true if any source has it)
      isPaid = Boolean((emailData && emailData.isPaid) || (uidData && uidData.isPaid));
      elements.userStatus.textContent = isPaid ? 'VIP會員' : '普通會員';
      try {
        if (elements.userStatusBadge) {
          elements.userStatusBadge.className = isPaid ? 'badge-vip' : 'badge-normal';
        }
      } catch(_) {}
      elements.checklistLimit.textContent = isPaid ? '∞' : FREE_LIMIT;

      // If we used users/{uid} as source and have lists, try to sync into users_by_email for future reads
      if (source === 'users_uid' && userChecklists.length > 0) {
        try {
          await setDoc(refEmail, { email, uxChecklists: JSON.parse(JSON.stringify(userChecklists)) }, { merge: true });
          console.log('↪ 已同步清單到 users_by_email');
        } catch (syncErr) {
          console.warn('同步到 users_by_email 失敗（可忽略）：', syncErr?.message || syncErr);
        }
      }

      // If neither path existed, initialize primary doc (email-keyed)
      if (source === 'none') {
        try {
          await setDoc(refEmail, { email, uxChecklists: [] }, { merge: true });
          console.log('已初始化使用者文件 users_by_email');
        } catch (initErr) {
          console.error('初始化使用者文件失敗：', initErr);
        }
      }

      updateUI();
    }

    // Update UI
    function updateUI() {
      // header counters
      if (elements.checklistCount) {
        elements.checklistCount.textContent = String(userChecklists.length);
        elements.checklistCount.classList.remove('placeholder-glow');
      }
      if (elements.userStatus) elements.userStatus.classList.remove('placeholder-glow');
      if (elements.checklistLimit) elements.checklistLimit.classList.remove('placeholder-glow');
      // create button state
      if (elements.createBtn) {
        elements.createBtn.disabled = false;
        try { elements.createBtn.removeAttribute('disabled'); } catch(_){}
        elements.createBtn.classList.remove('placeholder-glow');
        elements.createBtn.innerHTML = '<i class="fas fa-plus"></i> 新增';
      }
      const reachedLimit = !isPaid && userChecklists.length >= FREE_LIMIT;
      if (elements.createBtn) elements.createBtn.disabled = reachedLimit;
      if (elements.limitNotice) elements.limitNotice.classList.toggle('d-none', !reachedLimit);

      // Sidebar render
      renderSidebar();
      // Detail render
      renderDetail();
      // VIP perks enable/disable
      const perkButtons = [elements.perkPdf, elements.perkAi, elements.perkTeam];
      perkButtons.forEach(btn => {
        if (!btn) return;
        if (isPaid) {
          btn.disabled = false;
          btn.title = '';
        } else {
          btn.disabled = true;
          btn.title = 'VIP 會員限定功能';
        }
      });
    }

    // Render Single Checklist
    function computeProgress(checklist){
      const totalItems = checklist.items.process.length + checklist.items.interface.length + checklist.items.context.length;
      const checkedItems = [
        ...checklist.items.process,
        ...checklist.items.interface,
        ...checklist.items.context
      ].filter(item => item.checked).length;
      const progress = totalItems ? Math.round((checkedItems / totalItems) * 100) : 0;
      return { totalItems, checkedItems, progress };
    }

    function renderSidebar(){
      const q = (searchQuery || '').trim().toLowerCase();
      const filterFn = (cl) => {
        if (!q) return true;
        if ((cl.name || '').toLowerCase().includes(q)) return true;
        // shallow search within item texts
        const texts = [
          ...cl.items.process,
          ...cl.items.interface,
          ...cl.items.context
        ].map(i => (i.text||'').toLowerCase());
        return texts.some(t => t.includes(q));
      };
      const favWrap = elements.sidebarFavorites;
      const allWrap = elements.sidebarAll;
      if (!favWrap || !allWrap) return;
      const listToLi = (cl, idx) => {
        const {progress} = computeProgress(cl);
        const active = idx === selectedIndex ? 'active' : '';
        const pinClass = cl.pinned ? 'pin-btn' : 'pin-btn inactive';
        return `
          <li class="list-group-item ${active}" data-index="${idx}" draggable="true">
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm ${pinClass}" data-pin type="button" title="收藏/取消收藏"><i class="fas fa-thumbtack"></i></button>
              <div class="flex-grow-1" data-select>
                <div class="list-item-title fw-semibold">${cl.name || '未命名清單'}</div>
                <div class="d-flex align-items-center gap-2 small text-muted">
                  <div class="progress flex-grow-1">
                    <div class="progress-bar ${progress===100?'complete':''}" style="width:${progress}%"></div>
                  </div>
                  <span>${progress}%</span>
                </div>
              </div>
              <span class="text-muted small" title="拖曳排序"><i class="fas fa-grip-vertical"></i></span>
            </div>
          </li>`;
      };
      const filtered = userChecklists.map((cl,i)=>({cl,i})).filter(({cl})=>filterFn(cl));
      const favs = filtered.filter(({cl})=>!!cl.pinned);
      const others = filtered.filter(({cl})=>!cl.pinned);
      favWrap.innerHTML = favs.map(({cl,i})=>listToLi(cl,i)).join('') || '<li class="list-group-item text-muted">無收藏清單</li>';
      allWrap.innerHTML = others.map(({cl,i})=>listToLi(cl,i)).join('');
      elements.emptyState.classList.toggle('d-none', userChecklists.length !== 0);

      attachSidebarEvents();
    }

    function renderDetail(){
      const idx = selectedIndex;
      if (idx < 0 || idx >= userChecklists.length){
        if (elements.detailSections) elements.detailSections.innerHTML = '<div class="text-muted text-center py-5">請從左側選擇或建立清單</div>';
        return;
      }
      const checklist = userChecklists[idx];
      const { totalItems, checkedItems, progress } = computeProgress(checklist);
      if (elements.detailTitle) elements.detailTitle.value = checklist.name || '';
      if (elements.detailProgressBar) elements.detailProgressBar.style.width = progress + '%';
      if (elements.detailUpdated) elements.detailUpdated.textContent = new Date(checklist.updatedAt).toLocaleDateString('zh-TW');

      const renderItem = (cat, item) => {
        return `<div class="checklist-item ${item.checked?'checked':''}">
          <input type="checkbox" id="d-${idx}-${item.id}" ${item.checked?'checked':''} data-cat="${cat}" data-id="${item.id}">
          <div class="checklist-item-text">${item.text}
            ${item.suggestion?`<div class="suggestion-pill" data-suggestion="${encodeURIComponent(item.suggestion)}"><i class="fas fa-lightbulb"></i> 建議</div>`:''}
          </div>
        </div>`;
      };
      const pt = projectTypes.find(p=>p.id===checklist.projectType) || projectTypes.find(p=>p.id==='general');
      const section = (title, iconClass, catArrName) => `
        <div class="checklist-section">
          <div class="section-title">
            <div class="section-icon"><i class="${iconClass}"></i></div>
            <span>${title}</span>
          </div>
          ${checklist.items[catArrName].map(item=>renderItem(catArrName,item)).join('')}
        </div>`;
      const html = [
        section('流程痛點','fas fa-route','process'),
        section('介面痛點','fas fa-window-maximize','interface'),
        section('情境痛點','fas fa-users','context')
      ].join('');
      elements.detailSections.innerHTML = html;

      // checkbox changes
      elements.detailSections.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
        cb.addEventListener('change', async (e)=>{
          const cat = e.target.getAttribute('data-cat');
          const itemId = e.target.getAttribute('data-id');
          const item = userChecklists[idx].items[cat].find(i=>i.id===itemId);
          if (item){
            item.checked = !!e.target.checked;
            userChecklists[idx].updatedAt = new Date().toISOString();
            await saveToFirestore();
            showSaveIndicator();
            updateUI();
          }
        });
      });

      // title changes (debounced)
      if (elements.detailTitle){
        let t; elements.detailTitle.oninput = (e)=>{
          clearTimeout(t);
          t = setTimeout(async ()=>{
            userChecklists[idx].name = (e.target.value||'').trim() || `專案清單 ${idx+1}`;
            userChecklists[idx].updatedAt = new Date().toISOString();
            await saveToFirestore();
            showSaveIndicator();
            renderSidebar();
          }, 400);
        };
      }

      // actions
      if (elements.btnDuplicate) elements.btnDuplicate.onclick = ()=>window.duplicateChecklistWithUI?window.duplicateChecklistWithUI(idx, elements.btnDuplicate):window.duplicateChecklist(idx);
      if (elements.btnDelete) elements.btnDelete.onclick = ()=>window.deleteChecklistWithUI?window.deleteChecklistWithUI(idx, elements.btnDelete):window.deleteChecklist(idx);
      if (elements.btnPrint) elements.btnPrint.onclick = ()=>window.print && window.print();
    }
      const totalItems = checklist.items.process.length + checklist.items.interface.length + checklist.items.context.length;
      const checkedItems = [
        ...checklist.items.process,
        ...checklist.items.interface,
        ...checklist.items.context
      ].filter(item => item.checked).length;
      const progress = Math.round((checkedItems / totalItems) * 100);
      const isCompleted = progress >= 80;
      
      const projectType = projectTypes.find(pt => pt.id === checklist.projectType) || projectTypes.find(pt => pt.id === 'general');

      // helper to safely embed suggestion text for data-attributes
      const encAttr = (s) => encodeURIComponent(s || '');

      // Build section items without nested template literals (robust parsing)
      const renderItem = (cat, item) => {
        return '<div class="checklist-item ' + (item.checked ? 'checked' : '') + '">' +
               '<input type="checkbox" ' +
               'id="check-' + index + '-' + item.id + '" ' +
               (item.checked ? 'checked' : '') + ' ' +
               'onchange="window.toggleCheckbox(' + index + ', &quot;' + cat + '&quot;, &quot;' + item.id + '&quot;)">' +
               '<div class="checklist-item-text">' +
               item.text +
               (item.suggestion ? ('<div class="suggestion-pill" data-suggestion="' + encAttr(item.suggestion) + '"><i class="fas fa-lightbulb"></i> 建議</div>') : '') +
               '</div>' +
               '</div>';
      };

      const processHtml = checklist.items.process.map(item => renderItem('process', item)).join('');
      const interfaceHtml = checklist.items.interface.map(item => renderItem('interface', item)).join('');
      const contextHtml = checklist.items.context.map(item => renderItem('context', item)).join('');

      return `
        <div class="checklist-card ${isCompleted ? 'completed' : ''}" data-index="${index}">
          <div class="checklist-header">
            <input type="text" value="${checklist.name}" 
                   class="checklist-name-input" 
                   data-index="${index}"
                   placeholder="清單名稱">
            <div class="checklist-actions no-print">
              <button class="action-btn duplicate" data-action="duplicate" title="複製清單">
                <i class="fas fa-copy"></i> 複製
              </button>
              <button class="action-btn print" data-action="print" title="列印清單">
                <i class="fas fa-print"></i> 列印
              </button>
              <button class="action-btn delete" data-action="delete" title="刪除清單">
                <i class="fas fa-trash"></i> 刪除
              </button>
            </div>
          </div>

          <div class="checklist-meta">
            <span class="checklist-badge project-type">
              <span>${projectType.icon}</span>
              <span>${projectType.name}</span>
            </span>
            <span class="checklist-badge">
              <i class="fas fa-clock"></i>
              更新：${new Date(checklist.updatedAt).toLocaleDateString('zh-TW')}
            </span>
          </div>

          <div class="progress-wrapper">
            <div class="progress">
              <div class="progress-bar ${progress === 100 ? 'complete' : ''}" style="width: ${progress}%"></div>
            </div>
            <div class="progress-label">
              <span>${checkedItems} / ${totalItems} 項完成</span>
              <span class="fw-bold">${progress}%</span>
            </div>
          </div>

          <!-- Process Category -->
          <div class="checklist-section">
            <div class="section-title">
              <div class="section-icon process">
                <i class="fas fa-route"></i>
              </div>
              <span>流程痛點</span>
            </div>
            ${processHtml}
          </div>

          <!-- Interface Category -->
          <div class="checklist-section">
            <div class="section-title">
              <div class="section-icon interface">
                <i class="fas fa-window-maximize"></i>
              </div>
              <span>介面痛點</span>
            </div>
            ${interfaceHtml}
          </div>

          <!-- Context Category -->
          <div class="checklist-section">
            <div class="section-title">
              <div class="section-icon context">
                <i class="fas fa-users"></i>
              </div>
              <span>情境痛點</span>
            </div>
            ${contextHtml}
          </div>
        </div>

          `;
            }

            // Show Achievement Toast
    function showAchievement(text) {
      const toast = document.getElementById('achievement-toast');
      const textEl = document.getElementById('achievement-text');
      textEl.textContent = text;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 5000);
    }

    // Show Save Indicator
    function showSaveIndicator() {
      const indicator = document.getElementById('save-indicator');
      indicator.classList.add('show');
      setTimeout(() => indicator.classList.remove('show'), 2000);
    }

    // Undo Toast helpers
    function showUndoToast(message, onUndo) {
      clearTimeout(undoTimer);
      const toast = document.getElementById('undo-toast');
      const textEl = document.getElementById('undo-text');
      const btn = document.getElementById('undo-btn');
      textEl.textContent = message;
      toast.classList.add('show');
      btn.onclick = () => {
        clearTimeout(undoTimer);
        toast.classList.remove('show');
        if (typeof onUndo === 'function') onUndo();
      };
      undoTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 5000);
    }

    // Suggestion click in detail
    elements.detailSections.addEventListener('click', (e) => {
      // suggestion pill
      const pill = e.target.closest('.suggestion-pill');
      if (pill) {
        try {
          const text = decodeURIComponent(pill.dataset.suggestion || '');
          alert(text || '（無建議內容）');
        } catch (err) {
          alert('無法讀取建議內容');
        }
        return;
      }
    });

    function attachSidebarEvents(){
      const sidebar = document.getElementById('checklistSidebar');
      const wireList = (ulEl)=>{
        if (!ulEl) return;
        ulEl.querySelectorAll('li.list-group-item').forEach(li=>{
          // select
          const sel = li.querySelector('[data-select]');
          if (sel) sel.onclick = ()=>{ selectedIndex = parseInt(li.dataset.index); renderSidebar(); renderDetail(); };
          // pin
          const pinBtn = li.querySelector('[data-pin]');
          if (pinBtn) pinBtn.onclick = async (e)=>{
            e.stopPropagation();
            const idx = parseInt(li.dataset.index);
            userChecklists[idx].pinned = !userChecklists[idx].pinned;
            userChecklists[idx].updatedAt = new Date().toISOString();
            await saveToFirestore();
            renderSidebar();
          };
          // dnd
          li.addEventListener('dragstart', ()=>{ li.classList.add('dragging'); });
          li.addEventListener('dragend', async ()=>{
            li.classList.remove('dragging');
            // after drop, recompute order by current DOM
            const order = [];
            const collect = (root)=>{
              root.querySelectorAll('li.list-group-item').forEach(n=>{ order.push(parseInt(n.dataset.index)); });
            };
            collect(elements.sidebarFavorites);
            collect(elements.sidebarAll);
            const newArr = order.map(i=>userChecklists[i]);
            userChecklists = newArr;
            selectedIndex = Math.max(0, Math.min(selectedIndex, userChecklists.length-1));
            await saveToFirestore();
            renderSidebar();
          });
        });
        ulEl.addEventListener('dragover', (e)=>{
          e.preventDefault();
          const dragging = ulEl.querySelector('.dragging');
          const afterElement = getDragAfterElement(ulEl, e.clientY);
          if (!dragging) return;
          if (afterElement == null) {
            ulEl.appendChild(dragging);
          } else {
            ulEl.insertBefore(dragging, afterElement);
          }
        });
      };
      wireList(elements.sidebarFavorites);
      wireList(elements.sidebarAll);
      function getDragAfterElement(container, y){
        const els = [...container.querySelectorAll('li.list-group-item:not(.dragging)')];
        return els.reduce((closest, child)=>{
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height/2;
          if (offset < 0 && offset > closest.offset) return { offset, element: child };
          else return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
      }
      if (elements.sidebarSearch){
        elements.sidebarSearch.oninput = (e)=>{ searchQuery = e.target.value || ''; renderSidebar(); };
      }
    }

    // Initialize Project Type Modal
    function initProjectTypeModal() {
      const grid = document.getElementById('project-type-grid');
      grid.innerHTML = projectTypes.map(pt => `
        <div class="project-type-card" data-type="${pt.id}" onclick="selectProjectType('${pt.id}')">
          <div class="project-type-icon">${pt.icon}</div>
          <div class="project-type-name">${pt.name}</div>
          <div class="project-type-desc">${pt.desc}</div>
        </div>
      `).join('');
    }

    // Select Project Type
    window.selectProjectType = function(typeId) {
      selectedProjectType = typeId;
      document.querySelectorAll('.project-type-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.type === typeId);
      });
    };

    // Create New Checklist with Project Type
    if (elements.createBtn) elements.createBtn.addEventListener('click', () => {
      if (!isPaid && userChecklists.length >= FREE_LIMIT) {
        alert('已達普通會員上限（3 張清單）\n\n升級到 VIP 會員以建立無限數量清單！');
        return;
      }
      
      selectedProjectType = null;
      const modal = new bootstrap.Modal(document.getElementById('projectTypeModal'));
      modal.show();
    });

    // Confirm Project Type and Create Checklist
    document.getElementById('confirm-project-type').addEventListener('click', async () => {
      if (!selectedProjectType) {
        alert('請選擇專案類型');
        return;
      }

      const confirmBtn = document.getElementById('confirm-project-type');
      const cancelBtn = document.querySelector('#projectTypeModal .btn.btn-secondary');
      const setBtnBusy = (btn, label) => {
        if (!btn) return;
        btn.disabled = true;
        btn.dataset.original = btn.innerHTML;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${label}`;
      };
      const restoreBtn = (btn) => {
        if (!btn || !btn.dataset.original) return;
        btn.innerHTML = btn.dataset.original;
        btn.disabled = false;
        delete btn.dataset.original;
      };
      setBtnBusy(confirmBtn, '建立中…');
      if (cancelBtn) cancelBtn.disabled = true;
      const projectType = projectTypes.find(pt => pt.id === selectedProjectType);
      const newChecklist = {
        id: Date.now().toString(),
        name: `${projectType.name} - ${new Date().toLocaleDateString('zh-TW')}`,
        projectType: selectedProjectType,
        items: JSON.parse(JSON.stringify(projectType.template)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false
      };

      userChecklists.push(newChecklist);

      // Save immediately (avoid duplicate listeners/race conditions)
      await saveToFirestore();
      showSaveIndicator();

      // Then close modal safely
      confirmBtn.blur();
      const modalInstance = bootstrap.Modal.getInstance(document.getElementById('projectTypeModal'));
      if (modalInstance) modalInstance.hide();

      // Refresh UI after a short delay for smoother close animation
      setTimeout(() => { selectedIndex = userChecklists.length - 1; updateUI(); }, 120);
      setTimeout(() => {
        restoreBtn(confirmBtn);
        if (cancelBtn) cancelBtn.disabled = false;
      }, 150);
    });

    // Toggle Checkbox (legacy hook kept for safety)
    window.toggleCheckbox = async (checklistIndex, category, itemId) => {
      const item = userChecklists[checklistIndex]?.items?.[category]?.find(i => i.id === itemId);
      if (!item) return;
      const wasChecked = item.checked;
      item.checked = !item.checked;
      userChecklists[checklistIndex].updatedAt = new Date().toISOString();
      const { progress } = computeProgress(userChecklists[checklistIndex]);
      if (!wasChecked && progress >= 80 && progress < 100) {
        showAchievement('🎉 太棒了！你已經完成 80% 的痛點檢查');
      } else if (progress === 100 && !wasChecked) {
        showAchievement('🏆 完美！所有痛點檢查完成，你已經是 UX 觀察高手');
      }
      await saveToFirestore();
      showSaveIndicator();
      updateUI();
    };

    // Delete Checklist (basic)
    window.deleteChecklist = async (index) => {
      if (!confirm('確定要刪除此清單嗎？此操作無法復原。')) return;
      const removed = userChecklists[index];
      const restoreAt = index;
      userChecklists.splice(index, 1);
      // Optimistic UI: render immediately
      selectedIndex = Math.max(0, Math.min(selectedIndex, userChecklists.length - 1));
      updateUI();
      lastDeleted = { data: removed, index: restoreAt };
      showUndoToast(`已刪除「${removed?.name || '清單'}」`, async () => {
        const insertAt = Math.min(lastDeleted.index, userChecklists.length);
        userChecklists.splice(insertAt, 0, lastDeleted.data);
        lastDeleted = null;
        updateUI();
        try { await saveToFirestore(); showSaveIndicator(); } catch(e) {}
      });
      // Save in background
      saveToFirestore().then(() => {
        showSaveIndicator();
      }).catch(err => {
        console.warn('刪除同步失敗：', err?.message || err);
      });
    };

    // Delete Checklist with UI feedback
    window.deleteChecklistWithUI = async (index, btnEl) => {
      if (!confirm('確定要刪除此清單嗎？此操作無法復原。')) return;
      // Optimistic remove: update UI immediately, save in background, provide undo
      const removed = userChecklists[index];
      const restoreAt = index;
      userChecklists.splice(index, 1);
      updateUI();
      lastDeleted = { data: removed, index: restoreAt };
      showUndoToast(`已刪除「${removed?.name || '清單'}」`, async () => {
        const insertAt = Math.min(lastDeleted.index, userChecklists.length);
        userChecklists.splice(insertAt, 0, lastDeleted.data);
        lastDeleted = null;
        updateUI();
        try { await saveToFirestore(); showSaveIndicator(); } catch(e) {}
      });
      // Save in background
      saveToFirestore().then(() => {
        showSaveIndicator();
      }).catch(err => {
        console.warn('刪除同步失敗：', err?.message || err);
      });
    };

    // Duplicate Checklist (basic)
    window.duplicateChecklist = async (index) => {
      if (!isPaid && userChecklists.length >= FREE_LIMIT) {
        alert('已達普通會員上限（3 張清單）\n\n升級到 VIP 會員以建立無限數量清單！');
        return;
      }

      const original = userChecklists[index];
      const duplicate = JSON.parse(JSON.stringify(original));
      duplicate.id = Date.now().toString();
      duplicate.name = `${original.name} (副本)`;
      duplicate.createdAt = new Date().toISOString();
      duplicate.updatedAt = new Date().toISOString();
      duplicate.pinned = false;

      userChecklists.push(duplicate);
      await saveToFirestore();
      showSaveIndicator();
      selectedIndex = userChecklists.length - 1;
      updateUI();
    };

    // Duplicate Checklist with UI feedback
    window.duplicateChecklistWithUI = async (index, btnEl) => {
      if (!isPaid && userChecklists.length >= FREE_LIMIT) {
        alert('已達普通會員上限（3 張清單）\n\n升級到 VIP 會員以建立無限數量清單！');
        return;
      }
      const setBtnBusy = (btn, label) => {
        if (!btn) return;
        btn.disabled = true;
        btn.dataset.original = btn.innerHTML;
        btn.innerHTML = `<span class=\"spinner-border spinner-border-sm me-2\" role=\"status\" aria-hidden=\"true\"></span>${label}`;
      };
      const restoreBtn = (btn) => {
        if (!btn || !btn.dataset.original) return;
        btn.innerHTML = btn.dataset.original;
        btn.disabled = false;
        delete btn.dataset.original;
      };
      setBtnBusy(btnEl, '複製中…');
      try {
        const original = userChecklists[index];
        const duplicate = JSON.parse(JSON.stringify(original));
        duplicate.id = Date.now().toString();
        duplicate.name = `${original.name} (副本)`;
        duplicate.createdAt = new Date().toISOString();
        duplicate.updatedAt = new Date().toISOString();
        duplicate.pinned = false;
        userChecklists.push(duplicate);
        await saveToFirestore();
        showSaveIndicator();
        selectedIndex = userChecklists.length - 1;
        updateUI();
      } catch (e) {
        alert('複製失敗，請重試');
        restoreBtn(btnEl);
      }
    };

    // Attach Event Listeners
    function attachEventListeners() { /* replaced by renderDetail + attachSidebarEvents */ }

    // Save to Firestore
    async function saveToFirestore() {
      if (!userEmail) {
        console.warn('⚠️ 尚未登入，無法儲存');
        return;
      }
      
      try {
        const cleanChecklists = JSON.parse(JSON.stringify(userChecklists));
        const primaryRef = doc(db, 'users_by_email', encEmail(userEmail));
        
        // Check if document exists to determine operation type
        const snapshot = await getDoc(primaryRef);
        
        if (snapshot.exists()) {
          // Document exists, use update
          await updateDoc(primaryRef, { uxChecklists: cleanChecklists });
        } else {
          // Document doesn't exist, use create
          await setDoc(primaryRef, { email: userEmail, uxChecklists: cleanChecklists });
        }
        console.log('✅ 清單已儲存 (users_by_email)');
      } catch (error) {
        console.warn('users_by_email 儲存失敗，嘗試 users/{uid}：', error?.message || error);
        try {
          const uid = (auth.currentUser && auth.currentUser.uid) || '';
          if (!uid) throw new Error('No UID for fallback write');
          const cleanChecklists = JSON.parse(JSON.stringify(userChecklists));
          const uidRef = doc(db, 'users', uid);
          await setDoc(uidRef, { email: userEmail, uxChecklists: cleanChecklists }, { merge: true });
          console.log('✅ 清單已儲存 (users/{uid})');
        } catch (err2) {
          console.error('❌ 儲存錯誤 (兩路徑皆失敗):', err2);
          console.error('清單資料:', userChecklists);
          alert('儲存失敗，請重試\n\n錯誤訊息：' + (err2?.message || err2));
        }
      }
    }

    // Auth State
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = '/index.html';
        return;
      }

      userEmail = user.email;
      await loadUserData(user.email);
      initProjectTypeModal();
      dataReady = true;
      // Default select first checklist if available
      if (userChecklists.length > 0 && selectedIndex === -1) {
        selectedIndex = 0;
        updateUI();
      }
      // Wire create button if not already
      if (elements.createBtn && !elements.createBtn._wired){ elements.createBtn._wired = true; /* already set earlier */ }
      // Sidebar search initial render
      renderSidebar();
    });
