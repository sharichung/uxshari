    // ROI 篩選主邏輯：根據 selectedROIs 過濾 pain point，並觸發 renderDetail()
    let roiFilterActive = [];
    function filterChecklistByROI(selected) {
      roiFilterActive = Array.isArray(selected) ? selected.slice() : [];
      renderDetail();
    }
    // ROI Filter Panel Logic
    const ROI_OPTIONS = [
      { value: 'conversion', label: '轉換', icon: 'fa-cart-shopping' },
      { value: 'retention', label: '留存', icon: 'fa-user-check' },
      { value: 'proposal', label: '提案', icon: 'fa-file-signature' },
      { value: 'compliance', label: '合規', icon: 'fa-shield-halved' },
      { value: 'nps', label: 'NPS', icon: 'fa-face-smile' }
    ];
    let selectedROIs = [];
    function renderROIFilterOptions() {
      // Mobile
      const mobile = document.getElementById('roi-filter-options-mobile');
      if (mobile) mobile.innerHTML = ROI_OPTIONS.map(opt => `
        <div class="form-check mb-2">
          <input class="form-check-input" type="checkbox" id="roi-filter-mobile-${opt.value}" value="${opt.value}" ${selectedROIs.includes(opt.value) ? 'checked' : ''}>
          <label class="form-check-label" for="roi-filter-mobile-${opt.value}"><i class="fa-solid ${opt.icon} me-1"></i>${opt.label}</label>
        </div>
      `).join('');
      // Desktop
      const desktop = document.getElementById('roi-filter-options-desktop');
      if (desktop) desktop.innerHTML = ROI_OPTIONS.map(opt => `
        <div class="form-check form-check-inline mb-0">
          <input class="form-check-input" type="checkbox" id="roi-filter-desktop-${opt.value}" value="${opt.value}" ${selectedROIs.includes(opt.value) ? 'checked' : ''}>
          <label class="form-check-label" for="roi-filter-desktop-${opt.value}"><i class="fa-solid ${opt.icon} me-1"></i>${opt.label}</label>
        </div>
      `).join('');
    }
    function renderROIBadges() {
      const badges = selectedROIs.map(val => {
        const opt = ROI_OPTIONS.find(o => o.value === val);
        return `<span class="badge roi-badge-selected me-1"><i class="fa-solid ${opt.icon} me-1"></i>${opt.label}</span>`;
      }).join('');
      const mobile = document.getElementById('roi-filter-badges-mobile');
      if (mobile) mobile.innerHTML = badges;
      const desktop = document.getElementById('roi-filter-badges-desktop');
      if (desktop) desktop.innerHTML = badges;
    }
    function bindROIFilterEvents() {
      // Mobile
      const mobile = document.getElementById('roi-filter-options-mobile');
      if (mobile) mobile.addEventListener('change', e => {
        if (e.target.classList.contains('form-check-input')) {
          updateSelectedROIs(e.target.value, e.target.checked);
        }
      });
      const resetMobile = document.getElementById('roi-filter-reset-mobile');
      if (resetMobile) resetMobile.onclick = () => { selectedROIs = []; updateROIFilterUI(); };
      // Desktop
      const desktop = document.getElementById('roi-filter-options-desktop');
      if (desktop) desktop.addEventListener('change', e => {
        if (e.target.classList.contains('form-check-input')) {
          updateSelectedROIs(e.target.value, e.target.checked);
        }
      });
      const resetDesktop = document.getElementById('roi-filter-reset-desktop');
      if (resetDesktop) resetDesktop.onclick = () => { selectedROIs = []; updateROIFilterUI(); };
    }
    function updateSelectedROIs(value, checked) {
      if (checked) {
        if (!selectedROIs.includes(value)) selectedROIs.push(value);
      } else {
        selectedROIs = selectedROIs.filter(v => v !== value);
      }
      updateROIFilterUI();
      if (typeof filterChecklistByROI === 'function') filterChecklistByROI(selectedROIs);
    }
    function updateROIFilterUI() {
      renderROIFilterOptions();
      renderROIBadges();
    }
    function initROIFilterPanel() {
      renderROIFilterOptions();
      renderROIBadges();
      bindROIFilterEvents();
    }
    document.addEventListener('DOMContentLoaded', initROIFilterPanel);
    import {
      initializeApp,
      getApps
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import {
      getAuth,
      onAuthStateChanged
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
    import {
      getFirestore,
      doc,
      getDoc,
      setDoc,
      updateDoc,
      enableIndexedDbPersistence
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

    const encEmail = (e) => btoa(e).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    // 專案類型與模板定義
    const projectTypes = [
      {
  id: 'ecommerce',
  name: '電商平台',
  icon: '🛒',
  desc: '購物、結帳、物流',
  template: {
    process: [
      {
        id: 'e_p1',
        text: '商品搜尋功能是否直覺？能否快速找到目標商品？',
        checked: false,
        suggestion: '建議：加入智能推薦、篩選條件',
        roi: ['conversion','retention']
      },
      {
        id: 'e_p2',
        text: '加入購物車流程是否順暢？',
        checked: false,
        suggestion: '參考：一鍵加購、批量選購',
        roi: ['conversion']
      },
      {
        id: 'e_p3',
        text: '結帳步驟是否過於複雜？需要多少步驟完成？',
        checked: false,
        suggestion: '優化：減少表單欄位、支援快速結帳',
        roi: ['conversion']
      },
      {
        id: 'e_p4',
        text: '付款方式是否多元？（信用卡、轉帳、第三方支付）',
        checked: false,
        suggestion: '提供：多種支付選項提升轉換率',
        roi: ['conversion']
      },
      {
        id: 'e_p5',
        text: '訂單追蹤與退貨流程是否清晰？',
        checked: false,
        suggestion: '必備：即時物流追蹤、簡易退貨政策',
        roi: ['retention','nps']
      }
    ],
    interface: [
      {
        id: 'e_i1',
        text: '商品圖片是否清晰？支援多角度檢視？',
        checked: false,
        suggestion: '建議：360度檢視、放大功能',
        roi: ['conversion']
      },
      {
        id: 'e_i2',
        text: '商品描述是否完整？（規格、尺寸、材質）',
        checked: false,
        suggestion: '優化：結構化描述、對比表格',
        roi: ['conversion']
      },
      {
        id: 'e_i3',
        text: '價格、折扣顯示是否清楚？',
        checked: false,
        suggestion: '透明：原價、折扣、運費一目了然',
        roi: ['conversion']
      },
      {
        id: 'e_i4',
        text: '購物車圖示與商品數量提示是否明顯？',
        checked: false,
        suggestion: '設計：固定懸浮按鈕、數字徽章',
        roi: ['conversion']
      },
      {
        id: 'e_i5',
        text: '行動版商品卡片是否易於瀏覽與點擊？',
        checked: false,
        suggestion: '響應式：大縮圖、清晰CTA',
        roi: ['conversion']
      }
    ],
    context: [
      {
        id: 'e_c1',
        text: '首次訪客能否快速理解網站賣什麼？',
        checked: false,
        suggestion: '首頁：清晰價值主張、熱門商品',
        roi: ['conversion']
      },
      {
        id: 'e_c2',
        text: '是否提供客服管道？（線上客服、FAQ）',
        checked: false,
        suggestion: '即時：聊天機器人、常見問題',
        roi: ['nps','retention']
      },
      {
        id: 'e_c3',
        text: '網站載入速度是否夠快？（特別是商品圖片）',
        checked: false,
        suggestion: '優化：圖片壓縮、CDN加速',
        roi: ['conversion','retention']
      },
      {
        id: 'e_c4',
        text: '是否支援訪客結帳？（無需強制註冊）',
        checked: false,
        suggestion: '彈性：訪客結帳降低門檻',
        roi: ['conversion']
      },
      {
        id: 'e_c5',
        text: '是否有信任指標？（評論、認證、退款保證）',
        checked: false,
        suggestion: '建立信任：用戶評價、安全標章',
        roi: ['conversion','nps']
      }
    ],
    cognitive: [
      {
        id: 'e_cg1',
        text: '商品資訊是否過多，造成使用者無法聚焦？',
        checked: false,
        suggestion: '分段呈現、逐步顯示',
        roi: ['conversion']
      },
      {
        id: 'e_cg2',
        text: '商品分類與架構是否清晰？',
        checked: false,
        suggestion: '優化：多層分類、麵包屑導航',
        roi: ['conversion','retention']
      },
      {
        id: 'e_cg3',
        text: '用語是否一致？是否存在專業術語或翻譯問題？',
        checked: false,
        suggestion: '建立用語字典、統一翻譯',
        roi: ['conversion']
      },
      {
        id: 'e_cg4',
        text: '購物流程是否符合使用者的認知模型？',
        checked: false,
        suggestion: '參考常見模式、降低學習成本',
        roi: ['conversion']
      },
      {
        id: 'e_cg5',
        text: '是否提供足夠的引導與說明？',
        checked: false,
        suggestion: '工具提示、逐步教學',
        roi: ['conversion','retention']
      }
    ],
    emotional: [
      {
        id: 'e_em1',
        text: '使用者是否在結帳過程中感到焦慮或不確定？',
        checked: false,
        suggestion: '即時回饋、清楚錯誤訊息',
        roi: ['conversion','nps']
      },
      {
        id: 'e_em2',
        text: '是否有錯誤處理不清楚，造成挫折感？',
        checked: false,
        suggestion: '具體修正建議、重試選項',
        roi: ['conversion','nps']
      },
      {
        id: 'e_em3',
        text: '等待物流或付款確認是否導致失望？',
        checked: false,
        suggestion: '骨架屏、進度提示',
        roi: ['retention','nps']
      },
      {
        id: 'e_em4',
        text: '是否有互動設計讓使用者感到被忽略？',
        checked: false,
        suggestion: '確認操作成功、回饋動畫',
        roi: ['nps']
      },
      {
        id: 'e_em5',
        text: '是否有情境設計讓使用者感到不被尊重或理解？',
        checked: false,
        suggestion: '文化敏感設計、包容性文案',
        roi: ['nps']
      }
    ],
    support: [
      {
        id: 'e_s1',
        text: '使用者遇到問題時是否能快速找到幫助？（FAQ、客服入口）',
        checked: false,
        suggestion: '建議：首頁或結帳頁加入明顯的幫助入口',
        roi: ['nps','retention']
      },
      {
        id: 'e_s2',
        text: '客服回應是否即時且有用？（Live chat、回覆時間）',
        checked: false,
        suggestion: '參考：導入 chatbot 或標示預估回覆時間',
        roi: ['nps']
      },
      {
        id: 'e_s3',
        text: '退貨、退款、修改訂單等支援流程是否容易理解？',
        checked: false,
        suggestion: '優化：用圖示或步驟說明簡化流程',
        roi: ['retention','nps']
      },
      {
        id: 'e_s4',
        text: '是否提供訂單異常處理機制？（付款失敗、庫存不足）',
        checked: false,
        suggestion: '必備：明確錯誤訊息與替代方案',
        roi: ['conversion','nps']
      },
      {
        id: 'e_s5',
        text: '是否能追蹤客服處理進度？（Ticket 編號、回覆紀錄）',
        checked: false,
        suggestion: '透明化：提供查詢入口與進度更新',
        roi: ['nps','retention']
      }
    ],
        accessibility: [
      {
        id: 'e_a1',
        text: '頁面是否支援無障礙瀏覽？（螢幕閱讀器、鍵盤操作）',
        checked: false,
        suggestion: '建議：加入 aria 標籤、確保 tab 鍵可操作',
        roi: ['compliance','nps']
      },
      {
        id: 'e_a2',
        text: '文字大小、對比度是否足夠？是否能自訂顯示方式？',
        checked: false,
        suggestion: '參考：提供高對比模式與字體調整選項',
        roi: ['compliance','nps']
      },
      {
        id: 'e_a3',
        text: '是否支援多語系切換？（尤其是結帳與客服流程）',
        checked: false,
        suggestion: '必備：語言切換按鈕與本地化文案',
        roi: ['conversion','compliance','nps']
      },
      {
        id: 'e_a4',
        text: '互動元素是否有足夠的點擊區域與操作提示？',
        checked: false,
        suggestion: '優化：放大點擊區域、加入 hover/active 狀態',
        roi: ['conversion','nps']
      },
      {
        id: 'e_a5',
        text: '是否考慮色盲或視覺障礙者的使用情境？',
        checked: false,
        suggestion: '設計：避免單一色彩傳達資訊、加入圖示輔助',
        roi: ['compliance','nps']
      }
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
      {
        id: 'ed_p1',
        text: '課程搜尋與篩選是否直覺？',
        checked: false,
        suggestion: '建議：依類別、難度、評分篩選',
        roi: ['conversion','retention']
      },
      {
        id: 'ed_p2',
        text: '註冊/登入流程是否簡潔？',
        checked: false,
        suggestion: '優化：社群登入、單頁註冊',
        roi: ['conversion','retention']
      },
      {
        id: 'ed_p3',
        text: '購買課程流程是否順暢？',
        checked: false,
        suggestion: '簡化：快速結帳、試看功能',
        roi: ['conversion']
      },
      {
        id: 'ed_p4',
        text: '學習進度是否能自動儲存與同步？',
        checked: false,
        suggestion: '必備：跨裝置學習進度同步',
        roi: ['retention']
      },
      {
        id: 'ed_p5',
        text: '作業提交與批改流程是否清楚？',
        checked: false,
        suggestion: '明確：截止日期、提交狀態',
        roi: ['retention','nps']
      }
    ],
    interface: [
      {
        id: 'ed_i1',
        text: '課程導航是否清晰？（章節、單元）',
        checked: false,
        suggestion: '設計：側邊欄目錄、進度條',
        roi: ['retention']
      },
      {
        id: 'ed_i2',
        text: '影片播放器是否易用？（速度調整、字幕）',
        checked: false,
        suggestion: '功能：倍速播放、重點筆記',
        roi: ['retention','nps']
      },
      {
        id: 'ed_i3',
        text: '學習儀表板是否一目了然？',
        checked: false,
        suggestion: '視覺：學習時數、完成課程、成就',
        roi: ['retention']
      },
      {
        id: 'ed_i4',
        text: '課程資料下載是否方便？（講義、作業）',
        checked: false,
        suggestion: '便利：一鍵下載全部資料',
        roi: ['retention']
      },
      {
        id: 'ed_i5',
        text: '討論區與問答功能是否易於使用？',
        checked: false,
        suggestion: '互動：標籤分類、搜尋功能',
        roi: ['retention','nps']
      }
    ],
    context: [
      {
        id: 'ed_c1',
        text: '新學員能否快速找到適合的課程？',
        checked: false,
        suggestion: '引導：推薦系統、學習路徑',
        roi: ['conversion','retention']
      },
      {
        id: 'ed_c2',
        text: '是否提供試看或免費課程？',
        checked: false,
        suggestion: '降低門檻：試看 10分鐘',
        roi: ['conversion']
      },
      {
        id: 'ed_c3',
        text: '是否支援離線學習？',
        checked: false,
        suggestion: '彈性：下載課程離線觀看',
        roi: ['retention']
      },
      {
        id: 'ed_c4',
        text: '是否有學習提醒與激勵機制？',
        checked: false,
        suggestion: '持續學習：每日提醒、成就徽章',
        roi: ['retention','nps']
      },
      {
        id: 'ed_c5',
        text: '行動裝置學習體驗是否流暢？',
        checked: false,
        suggestion: '優化：響應式設計、觸控友善',
        roi: ['retention']
      }
    ],
    cognitive: [
      {
        id: 'ed_cg1',
        text: '課程資訊是否過多，造成學員無法聚焦？',
        checked: false,
        suggestion: '分段呈現、逐步顯示',
        roi: ['retention']
      },
      {
        id: 'ed_cg2',
        text: '課程架構是否清晰？章節與單元是否容易理解？',
        checked: false,
        suggestion: '優化：樹狀結構、進度導覽',
        roi: ['retention']
      },
      {
        id: 'ed_cg3',
        text: '用語是否一致？是否存在專業術語或翻譯問題？',
        checked: false,
        suggestion: '建立用語字典、統一翻譯',
        roi: ['retention']
      },
      {
        id: 'ed_cg4',
        text: '學習流程是否符合學員的認知模型？',
        checked: false,
        suggestion: '參考常見學習模式、降低學習成本',
        roi: ['retention']
      },
      {
        id: 'ed_cg5',
        text: '是否提供足夠的引導與說明？',
        checked: false,
        suggestion: '工具提示、逐步教學',
        roi: ['retention']
      }
    ],
    emotional: [
      {
        id: 'ed_em1',
        text: '學員是否在學習過程中感到焦慮或不確定？',
        checked: false,
        suggestion: '即時回饋、清楚錯誤訊息',
        roi: ['retention','nps']
      },
      {
        id: 'ed_em2',
        text: '是否有作業或考試壓力過大，造成挫折感？',
        checked: false,
        suggestion: '彈性：分段測驗、即時提示',
        roi: ['retention','nps']
      },
      {
        id: 'ed_em3',
        text: '等待批改或回覆是否導致失望？',
        checked: false,
        suggestion: '改善：自動批改、快速回覆',
        roi: ['retention','nps']
      },
      {
        id: 'ed_em4',
        text: '是否有互動設計讓學員感到被忽略？',
        checked: false,
        suggestion: '設計：即時互動、導師回饋',
        roi: ['nps']
      },
      {
        id: 'ed_em5',
        text: '是否有情境設計讓學員感到不被尊重或理解？',
        checked: false,
        suggestion: '文化敏感設計、包容性文案',
        roi: ['nps']
      }
    ],
    support: [
      {
        id: 'ed_s1',
        text: '學員遇到問題時是否能快速找到幫助？（FAQ、客服入口）',
        checked: false,
        suggestion: '建議：課程頁或學習儀表板加入明顯的幫助入口',
        roi: ['nps','retention']
      },
      {
        id: 'ed_s2',
        text: '客服回應是否即時且有用？（Live chat、回覆時間）',
        checked: false,
        suggestion: '參考：導入 chatbot 或標示預估回覆時間',
        roi: ['nps']
      },
      {
        id: 'ed_s3',
        text: '是否提供技術支援？（影片無法播放、作業無法提交）',
        checked: false,
        suggestion: '必備：技術問題回報機制與即時處理流程',
        roi: ['nps','retention']
      },
      {
        id: 'ed_s4',
        text: '是否能追蹤問題處理進度？（Ticket 編號、回覆紀錄）',
        checked: false,
        suggestion: '透明化：提供查詢入口與進度更新',
        roi: ['nps','retention']
      },
      {
        id: 'ed_s5',
        text: '是否提供學習建議或課程選修諮詢？',
        checked: false,
        suggestion: '加值：學習顧問、推薦引擎',
        roi: ['retention','nps']
      }
    ],
        accessibility: [
      {
        id: 'ed_a1',
        text: '平台是否支援無障礙瀏覽？（螢幕閱讀器、鍵盤操作）',
        checked: false,
        suggestion: '建議：加入 aria 標籤、確保 tab 鍵可操作',
        roi: ['compliance','nps']
      },
      {
        id: 'ed_a2',
        text: '文字大小、對比度是否足夠？是否能自訂顯示方式？',
        checked: false,
        suggestion: '參考：提供高對比模式與字體調整選項',
        roi: ['compliance','nps']
      },
      {
        id: 'ed_a3',
        text: '是否支援多語系切換？（尤其是課程、測驗、客服流程）',
        checked: false,
        suggestion: '必備：語言切換按鈕與本地化文案',
        roi: ['conversion','compliance','nps']
      },
      {
        id: 'ed_a4',
        text: '影片與教材是否提供字幕、語音描述或文字稿？',
        checked: false,
        suggestion: '包容性：提供多種輔助學習方式',
        roi: ['compliance','nps','retention']
      },
      {
        id: 'ed_a5',
        text: '互動元素是否有足夠的點擊區域與操作提示？',
        checked: false,
        suggestion: '優化：放大點擊區域、加入 hover/active 狀態',
        roi: ['conversion','nps']
      },
      {
        id: 'ed_a6',
        text: '是否考慮色盲或視覺障礙者的使用情境？',
        checked: false,
        suggestion: '設計：避免單一色彩傳達資訊、加入圖示輔助',
        roi: ['compliance','nps']
      }
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
      {
        id: 'ob_p1',
        text: '首次啟動時，價值主張是否清晰？',
        checked: false,
        suggestion: '建議：3秒內說明核心價值',
        roi: ['conversion','retention']
      },
      {
        id: 'ob_p2',
        text: '註冊流程是否簡潔？（3步驟內完成）',
        checked: false,
        suggestion: '優化：延後非必要資訊收集',
        roi: ['conversion','retention']
      },
      {
        id: 'ob_p3',
        text: '引導流程是否可跳過？',
        checked: false,
        suggestion: '彈性：提供「跳過」選項',
        roi: ['retention']
      },
      {
        id: 'ob_p4',
        text: '權限請求是否在適當時機出現？',
        checked: false,
        suggestion: '時機：用到才請求，說明原因',
        roi: ['conversion','compliance']
      },
      {
        id: 'ob_p5',
        text: '完成引導後，使用者是否知道下一步？',
        checked: false,
        suggestion: '明確：CTA 引導第一個行動',
        roi: ['conversion','retention']
      }
    ],
    interface: [
      {
        id: 'ob_i1',
        text: '引導畫面是否視覺友善？（插圖、動畫）',
        checked: false,
        suggestion: '設計：簡潔插圖、流暢動畫',
        roi: ['retention','nps']
      },
      {
        id: 'ob_i2',
        text: '進度指示器是否清楚？（第幾步/共幾步）',
        checked: false,
        suggestion: '視覺：進度點、百分比',
        roi: ['retention']
      },
      {
        id: 'ob_i3',
        text: '文字說明是否簡潔易懂？（避免專業術語）',
        checked: false,
        suggestion: '文案：口語化、關注利益點',
        roi: ['conversion','retention']
      },
      {
        id: 'ob_i4',
        text: '按鈕設計是否明確？（繼續、跳過、完成）',
        checked: false,
        suggestion: '清晰：主要CTA突出',
        roi: ['conversion','retention']
      },
      {
        id: 'ob_i5',
        text: '是否支援手勢操作？（滑動切換）',
        checked: false,
        suggestion: '互動：滑動換頁、點擊跳轉',
        roi: ['retention','nps']
      }
    ],
    context: [
      {
        id: 'ob_c1',
        text: '引導內容是否能個人化？（依用戶類型）',
        checked: false,
        suggestion: '智能：依使用情境調整',
        roi: ['retention','nps']
      },
      {
        id: 'ob_c2',
        text: '是否提供互動式教學？（而非純文字）',
        checked: false,
        suggestion: '體驗：讓用戶實際操作',
        roi: ['retention','nps']
      },
      {
        id: 'ob_c3',
        text: '引導結束後，是否可重新查看？',
        checked: false,
        suggestion: '幫助：設定中提供教學重播',
        roi: ['retention']
      },
      {
        id: 'ob_c4',
        text: '首次使用是否有範例資料？',
        checked: false,
        suggestion: '降低門檻：預載範例內容',
        roi: ['conversion','retention']
      },
      {
        id: 'ob_c5',
        text: '是否追蹤引導完成率？（優化弱點）',
        checked: false,
        suggestion: '數據：分析流失步驟',
        roi: ['retention']
      }
    ],
    cognitive: [
      {
        id: 'ob_cg1',
        text: '引導資訊是否過多，造成使用者無法聚焦？',
        checked: false,
        suggestion: '分段呈現、逐步顯示',
        roi: ['retention']
      },
      {
        id: 'ob_cg2',
        text: '引導架構是否清晰？使用者能否理解流程層級？',
        checked: false,
        suggestion: '優化：步驟分組、進度導覽',
        roi: ['retention']
      },
      {
        id: 'ob_cg3',
        text: '用語是否一致？是否存在專業術語或翻譯問題？',
        checked: false,
        suggestion: '建立用語字典、統一翻譯',
        roi: ['conversion','retention']
      },
      {
        id: 'ob_cg4',
        text: '引導流程是否符合使用者的認知模型？',
        checked: false,
        suggestion: '參考常見模式、降低學習成本',
        roi: ['retention']
      },
      {
        id: 'ob_cg5',
        text: '是否提供足夠的引導與說明？',
        checked: false,
        suggestion: '工具提示、逐步教學',
        roi: ['retention']
      }
    ],
    emotional: [
      {
        id: 'ob_em1',
        text: '使用者是否在引導過程中感到焦慮或不確定？',
        checked: false,
        suggestion: '即時回饋、清楚錯誤訊息',
        roi: ['retention','nps']
      },
      {
        id: 'ob_em2',
        text: '是否有過多步驟造成挫折感？',
        checked: false,
        suggestion: '簡化：減少步驟、提供跳過選項',
        roi: ['retention','nps']
      },
      {
        id: 'ob_em3',
        text: '等待或重複操作是否導致失望？',
        checked: false,
        suggestion: '改善：進度提示、避免重複輸入',
        roi: ['retention','nps']
      },
      {
        id: 'ob_em4',
        text: '是否有互動設計讓使用者感到被忽略？',
        checked: false,
        suggestion: '設計：確認操作成功、回饋動畫',
        roi: ['nps']
      },
      {
        id: 'ob_em5',
        text: '引導內容是否讓使用者感到不被尊重或理解？',
        checked: false,
        suggestion: '文化敏感設計、包容性文案',
        roi: ['nps']
      }
    ],
    support: [
      {
        id: 'ob_s1',
        text: '首次使用時是否提供幫助入口？（FAQ、客服、教學重播）',
        checked: false,
        suggestion: '建議：在設定或首頁提供明顯的幫助入口',
        roi: ['retention','nps']
      },
      {
        id: 'ob_s2',
        text: '使用者遇到問題時是否能即時獲得支援？',
        checked: false,
        suggestion: '參考：導入 chatbot 或顯示預估回覆時間',
        roi: ['nps']
      },
      {
        id: 'ob_s3',
        text: '引導過程中是否有技術問題回報機制？（按鈕失效、頁面卡住）',
        checked: false,
        suggestion: '必備：提供「回報問題」按鈕或錯誤提示',
        roi: ['nps','retention']
      },
      {
        id: 'ob_s4',
        text: '是否能追蹤支援請求進度？（Ticket 編號、回覆紀錄）',
        checked: false,
        suggestion: '透明化：提供查詢入口與進度更新',
        roi: ['nps','retention']
      },
      {
        id: 'ob_s5',
        text: '是否提供新手引導諮詢或建議？',
        checked: false,
        suggestion: '加值：新手顧問、推薦操作路徑',
        roi: ['retention','nps']
      }
    ],
        accessibility: [
      {
        id: 'ob_a1',
        text: '引導畫面是否支援無障礙瀏覽？（螢幕閱讀器、鍵盤操作）',
        checked: false,
        suggestion: '建議：加入 aria 標籤、確保 tab 鍵可操作',
        roi: ['compliance','nps']
      },
      {
        id: 'ob_a2',
        text: '文字大小、對比度是否足夠？是否能自訂顯示方式？',
        checked: false,
        suggestion: '參考：提供高對比模式與字體調整選項',
        roi: ['compliance','nps']
      },
      {
        id: 'ob_a3',
        text: '引導影片或動畫是否提供字幕、語音描述或文字稿？',
        checked: false,
        suggestion: '包容性：提供多種輔助學習方式',
        roi: ['compliance','nps','retention']
      },
      {
        id: 'ob_a4',
        text: '互動元素是否有足夠的點擊區域與操作提示？',
        checked: false,
        suggestion: '優化：放大點擊區域、加入 hover/active 狀態',
        roi: ['conversion','nps']
      },
      {
        id: 'ob_a5',
        text: '是否考慮色盲或視覺障礙者的使用情境？',
        checked: false,
        suggestion: '設計：避免單一色彩傳達資訊、加入圖示輔助',
        roi: ['compliance','nps']
      }
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
      {
        id: 'saas_p1',
        text: '免費試用流程是否簡單？（無需信用卡）',
        checked: false,
        suggestion: '降低門檻：免卡試用',
        roi: ['conversion']
      },
      {
        id: 'saas_p2',
        text: '資料匯入/匯出是否方便？',
        checked: false,
        suggestion: '必備：支援多種格式',
        roi: ['retention']
      },
      {
        id: 'saas_p3',
        text: '團隊協作邀請流程是否順暢？',
        checked: false,
        suggestion: '便利：Email 邀請、角色管理',
        roi: ['conversion','retention']
      },
      {
        id: 'saas_p4',
        text: '訂閱升級/降級流程是否清楚？',
        checked: false,
        suggestion: '透明：方案比較、無痛切換',
        roi: ['conversion','nps']
      },
      {
        id: 'saas_p5',
        text: '取消訂閱是否容易？（不刻意刁難）',
        checked: false,
        suggestion: '誠信：簡單取消建立信任',
        roi: ['nps','retention']
      }
    ],
    interface: [
      {
        id: 'saas_i1',
        text: '儀表板是否清晰展示關鍵數據？',
        checked: false,
        suggestion: '設計：卡片式布局、圖表視覺化',
        roi: ['retention','nps']
      },
      {
        id: 'saas_i2',
        text: '設定選項是否易於找到與調整？',
        checked: false,
        suggestion: '組織：分類清楚、搜尋功能',
        roi: ['retention']
      },
      {
        id: 'saas_i3',
        text: '通知系統是否不過度打擾？',
        checked: false,
        suggestion: '平衡：重要通知、可自訂',
        roi: ['retention','nps']
      },
      {
        id: 'saas_i4',
        text: '搜尋功能是否強大且快速？',
        checked: false,
        suggestion: '必備：全局搜尋、快捷鍵',
        roi: ['conversion','retention']
      },
      {
        id: 'saas_i5',
        text: '深色模式支援是否完整？',
        checked: false,
        suggestion: '體驗：保護視力、節省電力',
        roi: ['nps']
      }
    ],
    context: [
      {
        id: 'saas_c1',
        text: '產品導覽是否針對不同角色？',
        checked: false,
        suggestion: '個人化：管理員vs使用者',
        roi: ['retention','nps']
      },
      {
        id: 'saas_c2',
        text: '是否提供API文件與整合支援？',
        checked: false,
        suggestion: '擴展性：開放API、Webhook',
        roi: ['conversion','retention']
      },
      {
        id: 'saas_c3',
        text: '客服回應速度是否快速？',
        checked: false,
        suggestion: '保證：SLA承諾、多管道支援',
        roi: ['nps','retention']
      },
      {
        id: 'saas_c4',
        text: '是否有完整的說明文件與影片教學？',
        checked: false,
        suggestion: '自助：知識庫、影片庫',
        roi: ['retention']
      },
      {
        id: 'saas_c5',
        text: '資料安全與隱私保護是否清楚說明？',
        checked: false,
        suggestion: '信任：認證標章、隱私政策',
        roi: ['compliance','nps']
      }
    ],
    cognitive: [
      {
        id: 'saas_cg1',
        text: '功能與設定是否過於複雜，造成使用者理解困難？',
        checked: false,
        suggestion: '簡化：分步設定、預設模板',
        roi: ['retention']
      },
      {
        id: 'saas_cg2',
        text: '儀表板資訊是否過載，使用者能否聚焦關鍵數據？',
        checked: false,
        suggestion: '優化：資訊分層、可自訂視圖',
        roi: ['retention']
      },
      {
        id: 'saas_cg3',
        text: '用語是否一致？是否存在專業術語或翻譯問題？',
        checked: false,
        suggestion: '建立用語字典、統一翻譯',
        roi: ['conversion','retention']
      },
      {
        id: 'saas_cg4',
        text: '操作流程是否符合使用者的認知模型？',
        checked: false,
        suggestion: '參考常見模式、降低學習成本',
        roi: ['retention']
      },
      {
        id: 'saas_cg5',
        text: '是否提供足夠的引導與說明？',
        checked: false,
        suggestion: '工具提示、逐步教學',
        roi: ['retention']
      }
    ],
    emotional: [
      {
        id: 'saas_em1',
        text: '使用者是否在設定或操作過程中感到焦慮或不確定？',
        checked: false,
        suggestion: '即時回饋、清楚錯誤訊息',
        roi: ['retention','nps']
      },
      {
        id: 'saas_em2',
        text: '是否有訂閱或付款流程造成挫折感？',
        checked: false,
        suggestion: '透明：清楚方案比較、簡單付款',
        roi: ['conversion','nps']
      },
      {
        id: 'saas_em3',
        text: '等待客服或技術支援是否導致失望？',
        checked: false,
        suggestion: '改善：即時客服、快速回覆',
        roi: ['nps','retention']
      },
      {
        id: 'saas_em4',
        text: '是否有互動設計讓使用者感到被忽略？',
        checked: false,
        suggestion: '設計：確認操作成功、回饋動畫',
        roi: ['nps']
      },
      {
        id: 'saas_em5',
        text: '是否有情境設計讓使用者感到不被尊重或理解？',
        checked: false,
        suggestion: '文化敏感設計、包容性文案',
        roi: ['nps']
      }
    ],
    support: [
      {
        id: 'saas_s1',
        text: '使用者遇到問題時是否能快速找到幫助？（FAQ、客服入口）',
        checked: false,
        suggestion: '建議：在儀表板或設定頁提供明顯的幫助入口',
        roi: ['nps','retention']
      },
      {
        id: 'saas_s2',
        text: '客服回應是否即時且有用？（Live chat、回覆時間）',
        checked: false,
        suggestion: '參考：導入 chatbot 或標示預估回覆時間',
        roi: ['nps']
      },
      {
        id: 'saas_s3',
        text: '技術支援是否涵蓋常見問題？（API錯誤、整合失敗）',
        checked: false,
        suggestion: '必備：提供錯誤代碼說明與解決方案',
        roi: ['nps','retention']
      },
      {
        id: 'saas_s4',
        text: '是否能追蹤支援請求進度？（Ticket 編號、回覆紀錄）',
        checked: false,
        suggestion: '透明化：提供查詢入口與進度更新',
        roi: ['nps','retention']
      },
      {
        id: 'saas_s5',
        text: '是否提供專業顧問或成功案例支援？',
        checked: false,
        suggestion: '加值：專屬顧問、最佳實踐分享',
        roi: ['proposal','nps']
      }
    ],
        accessibility: [
      {
        id: 'saas_a1',
        text: '平台是否支援無障礙瀏覽？（螢幕閱讀器、鍵盤操作）',
        checked: false,
        suggestion: '建議：加入 aria 標籤、確保 tab 鍵可操作',
        roi: ['compliance','nps']
      },
      {
        id: 'saas_a2',
        text: '文字大小、對比度是否足夠？是否能自訂顯示方式？',
        checked: false,
        suggestion: '參考：提供高對比模式與字體調整選項',
        roi: ['compliance','nps']
      },
      {
        id: 'saas_a3',
        text: '圖表與數據是否提供替代文字或語音描述？',
        checked: false,
        suggestion: '包容性：提供文字摘要或語音輔助',
        roi: ['compliance','nps','retention']
      },
      {
        id: 'saas_a4',
        text: '互動元素是否有足夠的點擊區域與操作提示？',
        checked: false,
        suggestion: '優化：放大點擊區域、加入 hover/active 狀態',
        roi: ['conversion','nps']
      },
      {
        id: 'saas_a5',
        text: '是否考慮色盲或視覺障礙者的使用情境？',
        checked: false,
        suggestion: '設計：避免單一色彩傳達資訊、加入圖示輔助',
        roi: ['compliance','nps']
      }
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
      {
        id: 'p1',
        text: '註冊/登入流程是否過於複雜或步驟過多？',
        checked: false,
        suggestion: '建議：社群登入、減少必填欄位',
        roi: ['conversion','retention']
      },
      {
        id: 'p2',
        text: '使用者能否清楚理解下一步該做什麼？',
        checked: false,
        suggestion: '優化：清晰CTA、引導提示',
        roi: ['conversion','retention']
      },
      {
        id: 'p3',
        text: '完成核心任務需要經過幾個步驟？是否可以簡化？',
        checked: false,
        suggestion: '精簡：3步驟內完成主要任務',
        roi: ['conversion']
      },
      {
        id: 'p4',
        text: '錯誤處理機制是否明確？使用者知道如何修正錯誤嗎？',
        checked: false,
        suggestion: '友善：具體錯誤訊息、修正建議',
        roi: ['conversion','nps']
      },
      {
        id: 'p5',
        text: '是否有不必要的確認步驟或重複操作？',
        checked: false,
        suggestion: '流暢：減少摩擦點',
        roi: ['conversion','retention']
      }
    ],
    interface: [
      {
        id: 'i1',
        text: 'CTA 按鈕是否足夠明顯？位置是否符合使用者預期？',
        checked: false,
        suggestion: '設計：對比色、F型閱讀路徑',
        roi: ['conversion']
      },
      {
        id: 'i2',
        text: '導覽列是否清晰？使用者能否快速找到目標功能？',
        checked: false,
        suggestion: '結構：扁平化、搜尋功能',
        roi: ['conversion','retention']
      },
      {
        id: 'i3',
        text: '表單設計是否友善？欄位標籤是否清楚？',
        checked: false,
        suggestion: '易用：內嵌標籤、即時驗證',
        roi: ['conversion']
      },
      {
        id: 'i4',
        text: '視覺層級是否合理？重要資訊是否突出？',
        checked: false,
        suggestion: '視覺：大小、顏色、位置',
        roi: ['conversion','nps']
      },
      {
        id: 'i5',
        text: '行動裝置上的可點擊區域是否夠大（至少 44×44px）？',
        checked: false,
        suggestion: '觸控：足夠點擊區域',
        roi: ['conversion','nps']
      }
    ],
    context: [
      {
        id: 'c1',
        text: '使用情境是否符合目標使用者的真實需求？',
        checked: false,
        suggestion: '用戶研究：訪談、觀察',
        roi: ['conversion','retention']
      },
      {
        id: 'c2',
        text: '是否考慮到不同裝置（手機/平板/桌機）的使用情境？',
        checked: false,
        suggestion: '響應式：各尺寸測試',
        roi: ['retention']
      },
      {
        id: 'c3',
        text: '首次使用者是否能理解產品價值與使用方法？',
        checked: false,
        suggestion: '清晰：價值主張、引導流程',
        roi: ['conversion','retention']
      },
      {
        id: 'c4',
        text: '是否有考慮到網路不穩定或載入緩慢的情況？',
        checked: false,
        suggestion: '體驗：離線模式、骨架屏',
        roi: ['retention','nps']
      },
      {
        id: 'c5',
        text: '多語系使用者是否能順暢使用？（中英文切換、文字長度）',
        checked: false,
        suggestion: '國際化：i18n、彈性布局',
        roi: ['conversion','compliance','nps']
      }
    ],
    cognitive: [
      {
        id: 'cg1',
        text: '資訊是否過多，造成使用者無法聚焦？',
        checked: false,
        suggestion: '分段呈現、逐步顯示',
        roi: ['conversion','retention']
      },
      {
        id: 'cg2',
        text: '資訊架構是否清晰？使用者能否快速理解層級？',
        checked: false,
        suggestion: '優化：卡片分類、樹狀結構',
        roi: ['retention']
      },
      {
        id: 'cg3',
        text: '用語是否一致？是否存在專業術語或翻譯問題？',
        checked: false,
        suggestion: '建立用語字典、統一翻譯',
        roi: ['conversion','retention']
      },
      {
        id: 'cg4',
        text: '操作流程是否符合使用者的認知模型？',
        checked: false,
        suggestion: '參考常見模式、降低學習成本',
        roi: ['retention']
      },
      {
        id: 'cg5',
        text: '是否提供足夠的引導與說明？',
        checked: false,
        suggestion: '工具提示、逐步教學',
        roi: ['retention']
      }
    ],
    emotional: [
      {
        id: 'em1',
        text: '使用者是否在操作過程中感到焦慮或不確定？',
        checked: false,
        suggestion: '即時回饋、清楚錯誤訊息',
        roi: ['retention','nps']
      },
      {
        id: 'em2',
        text: '是否有過多步驟造成挫折感？',
        checked: false,
        suggestion: '簡化：減少步驟、提供跳過選項',
        roi: ['retention','nps']
      },
      {
        id: 'em3',
        text: '等待或重複操作是否導致失望？',
        checked: false,
        suggestion: '改善：進度提示、避免重複輸入',
        roi: ['retention','nps']
      },
      {
        id: 'em4',
        text: '是否有互動設計讓使用者感到被忽略？',
        checked: false,
        suggestion: '設計：確認操作成功、回饋動畫',
        roi: ['nps']
      },
      {
        id: 'em5',
        text: '產品內容或文案是否讓使用者感到不被尊重或理解？',
        checked: false,
        suggestion: '文化敏感設計、包容性文案',
        roi: ['nps']
      }
    ],
    support: [
      {
        id: 's1',
        text: '使用者遇到問題時是否能快速找到幫助？（FAQ、客服入口）',
        checked: false,
        suggestion: '建議：在主要頁面提供明顯的幫助入口',
        roi: ['retention','nps']
      },
      {
        id: 's2',
        text: '客服回應是否即時且有用？（Live chat、回覆時間）',
        checked: false,
        suggestion: '參考：導入 chatbot 或標示預估回覆時間',
        roi: ['nps']
      },
      {
        id: 's3',
        text: '是否提供技術支援？（登入失敗、功能異常）',
        checked: false,
        suggestion: '必備：錯誤回報機制與即時處理流程',
        roi: ['retention','nps']
      },
      {
        id: 's4',
        text: '是否能追蹤支援請求進度？（Ticket 編號、回覆紀錄）',
        checked: false,
        suggestion: '透明化：提供查詢入口與進度更新',
        roi: ['retention','nps']
      },
      {
        id: 's5',
        text: '是否提供使用建議或最佳實踐？',
        checked: false,
        suggestion: '加值：知識庫、案例分享',
        roi: ['proposal','nps']
      }
    ],
        accessibility: [
      {
        id: 'a1',
        text: '平台是否支援無障礙瀏覽？（螢幕閱讀器、鍵盤操作）',
        checked: false,
        suggestion: '建議：加入 aria 標籤、確保 tab 鍵可操作',
        roi: ['compliance','nps']
      },
      {
        id: 'a2',
        text: '文字大小、對比度是否足夠？是否能自訂顯示方式？',
        checked: false,
        suggestion: '參考：提供高對比模式與字體調整選項',
        roi: ['compliance','nps']
      },
      {
        id: 'a3',
        text: '是否支援多語系切換？（尤其是註冊、客服流程）',
        checked: false,
        suggestion: '必備：語言切換按鈕與本地化文案',
        roi: ['conversion','compliance','nps']
      },
      {
        id: 'a4',
        text: '互動元素是否有足夠的點擊區域與操作提示？',
        checked: false,
        suggestion: '優化：放大點擊區域、加入 hover/active 狀態',
        roi: ['conversion','nps']
      },
      {
        id: 'a5',
        text: '是否考慮色盲或視覺障礙者的使用情境？',
        checked: false,
        suggestion: '設計：避免單一色彩傳達資訊、加入圖示輔助',
        roi: ['compliance','nps']
      }
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
    let showPriorityOnly = false;

    // 折疊與篩選狀態
    let collapsedCategories = new Set(); // 儲存已折疊的類別
    let showOnlyIncomplete = false; // 只顯示未完成
    let showOnlyNeedsWork = false; // 只顯示需修正（severity > none）

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
      mobileCreateBtn: document.getElementById('mobile-create-btn'),
      limitNotice: document.getElementById('limit-notice'),
      // Header counters
      userStatus: document.getElementById('user-status'),
      userStatusBadge: document.getElementById('user-status-badge'),
      checklistCount: document.getElementById('checklist-count'),
      checklistLimit: document.getElementById('checklist-limit'),
      // Detail
      detailLoading: document.getElementById('detail-loading'),
      detailTitle: document.getElementById('detail-title'),
      detailProgressBar: document.getElementById('detail-progress-bar'),
      detailUpdated: document.getElementById('detail-updated'),
      detailSections: document.getElementById('detail-sections'),
      printTitle: document.getElementById('print-checklist-title'),
      detailEmpty: document.getElementById('detail-empty'),
      btnDuplicate: document.getElementById('btn-duplicate'),
      btnPrint: document.getElementById('btn-print'),
      btnDelete: document.getElementById('btn-delete'),
      perkPdf: document.getElementById('perk-pdf'),
      perkAi: document.getElementById('perk-ai'),
      perkTeam: document.getElementById('perk-team')
    };

    let dataReady = false;
    // Watchdog: ensure UI becomes interactive quickly even before data
    function scheduleInitialUIFlush() {
      setTimeout(() => {
        if (!dataReady) {
          try {
            updateUI();
          } catch (_) {}
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
      } catch (_) {}
      elements.checklistLimit.textContent = isPaid ? '∞' : FREE_LIMIT;

      // If we used users/{uid} as source and have lists, try to sync into users_by_email for future reads
      if (source === 'users_uid' && userChecklists.length > 0) {
        try {
          await setDoc(refEmail, {
            email,
            uxChecklists: JSON.parse(JSON.stringify(userChecklists))
          }, {
            merge: true
          });
          console.log('↪ 已同步清單到 users_by_email');
        } catch (syncErr) {
          console.warn('同步到 users_by_email 失敗（可忽略）：', syncErr?.message || syncErr);
        }
      }

      // If neither path existed, initialize primary doc (email-keyed)
      if (source === 'none') {
        try {
          await setDoc(refEmail, {
            email,
            uxChecklists: []
          }, {
            merge: true
          });
          console.log('已初始化使用者文件 users_by_email');
        } catch (initErr) {
          console.error('初始化使用者文件失敗：', initErr);
        }
      }

      updateUI();
    }

    // Update UI
    function updateUI() {
      // Hide loading placeholder
      if (elements.detailLoading) elements.detailLoading.classList.add('d-none');

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
        try {
          elements.createBtn.removeAttribute('disabled');
        } catch (_) {}
        elements.createBtn.classList.remove('placeholder-glow');
        elements.createBtn.innerHTML = '<i class="fas fa-plus"></i> 新增';
      }
      if (elements.mobileCreateBtn) {
        elements.mobileCreateBtn.disabled = false;
        try {
          elements.mobileCreateBtn.removeAttribute('disabled');
        } catch (_) {}
      }
      const reachedLimit = !isPaid && userChecklists.length >= FREE_LIMIT;
      if (elements.createBtn) elements.createBtn.disabled = reachedLimit;
      if (elements.mobileCreateBtn) elements.mobileCreateBtn.disabled = reachedLimit;
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
    function computeProgress(checklist) {
      const totalItems = checklist.items.process.length + checklist.items.interface.length + checklist.items.context.length;
      const checkedItems = [
        ...checklist.items.process,
        ...checklist.items.interface,
        ...checklist.items.context
      ].filter(item => item.checked).length;
      const progress = totalItems ? Math.round((checkedItems / totalItems) * 100) : 0;
      return {
        totalItems,
        checkedItems,
        progress
      };
    }

    function renderSidebar() {
      const q = (searchQuery || '').trim().toLowerCase();
      const filterFn = (cl) => {
        if (!q) return true;
        if ((cl.name || '').toLowerCase().includes(q)) return true;
        // shallow search within item texts
        const texts = [
          ...cl.items.process,
          ...cl.items.interface,
          ...cl.items.context
        ].map(i => (i.text || '').toLowerCase());
        return texts.some(t => t.includes(q));
      };
      const favWrap = elements.sidebarFavorites;
      const allWrap = elements.sidebarAll;
      if (!favWrap || !allWrap) return;

      // Hide loading skeletons
      const favLoading = document.getElementById('favorites-loading');
      const allLoading = document.getElementById('all-list-loading');
      if (favLoading) favLoading.style.display = 'none';
      if (allLoading) allLoading.style.display = 'none';
      // Show lists
      favWrap.style.display = 'block';
      allWrap.style.display = 'block';
      const listToLi = (cl, idx) => {
        const {
          progress
        } = computeProgress(cl);
        const active = idx === selectedIndex ? 'active' : '';
        const pinClass = cl.pinned ? 'pin-btn' : 'pin-btn inactive';
        const pt = projectTypes.find(p => p.id === cl.projectType) || projectTypes.find(p => p.id === 'general');
        return `
          <li class="list-group-item ${active}" data-index="${idx}" draggable="true">
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm ${pinClass}" data-pin type="button" title="收藏/取消收藏"><i class="fas fa-thumbtack"></i></button>
              <div class="flex-grow-1" data-select>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <span class="list-item-title fw-semibold">${cl.name || '未命名清單'}</span>
                  <span class="badge bg-light text-dark" style="font-size: 0.7rem;" title="${pt.name}">${pt.icon}</span>
                </div>
                <div class="d-flex align-items-center gap-2 small text-muted">
                  <div class="progress flex-grow-1">
                    <div class="progress-bar ${progress===100?'complete':''} bg-secondary" style="width:${progress}%"></div>
                  </div>
                  <span>${progress}%</span>
                </div>
              </div>
              <span class="text-muted small" title="拖曳排序"><i class="fas fa-grip-vertical"></i></span>
            </div>
          </li>`;
      };
      const filtered = userChecklists.map((cl, i) => ({
        cl,
        i
      })).filter(({
        cl
      }) => filterFn(cl));
      const favs = filtered.filter(({
        cl
      }) => !!cl.pinned);
      const others = filtered.filter(({
        cl
      }) => !cl.pinned);

      // Update favorites count badge
      const countBadge = document.getElementById('favorites-count');
      if (countBadge) countBadge.textContent = favs.length;

      // Update favorites list and empty hint
      const emptyHint = document.getElementById('favorites-empty');
      if (favs.length > 0) {
        favWrap.innerHTML = favs.map(({
          cl,
          i
        }) => listToLi(cl, i)).join('');
        if (emptyHint) emptyHint.classList.add('d-none');
      } else {
        favWrap.innerHTML = '';
        if (emptyHint) emptyHint.classList.remove('d-none');
      }

      allWrap.innerHTML = others.map(({
        cl,
        i
      }) => listToLi(cl, i)).join('');
      elements.emptyState.classList.toggle('d-none', userChecklists.length !== 0);

      // Populate mobile dropdown lists
      const mobileFavWrap = document.getElementById('mobile-favorites-list');
      const mobileAllWrap = document.getElementById('mobile-all-list');
      const mobileDropdownBtn = document.getElementById('mobile-current-checklist');

      if (mobileFavWrap && mobileAllWrap && mobileDropdownBtn) {
        const mobileListToLi = (cl, idx) => {
          const {
            progress
          } = computeProgress(cl);
          const active = idx === selectedIndex ? 'active' : '';
          const pt = projectTypes.find(p => p.id === cl.projectType) || projectTypes.find(p => p.id === 'general');
          return `
            <li class="dropdown-item ${active}" data-mobile-index="${idx}">
              <div class="d-flex align-items-center gap-2 w-100">
                <span class="badge bg-light text-dark" style="font-size: 0.7rem;" title="${pt.name}">${pt.icon}</span>
                <div class="flex-grow-1">
                  <div class="fw-semibold">${cl.name || '未命名清單'}</div>
                  <div class="d-flex align-items-center gap-2 small text-muted">
                    <div class="progress flex-grow-1" style="height: 4px;">
                      <div class="progress-bar ${progress===100?'complete':''} bg-secondary" style="width:${progress}%"></div>
                    </div>
                    <span>${progress}%</span>
                  </div>
                </div>
              </div>
            </li>`;
        };

        if (favs.length > 0) {
          mobileFavWrap.innerHTML = favs.map(({
            cl,
            i
          }) => mobileListToLi(cl, i)).join('');
        } else {
          mobileFavWrap.innerHTML = '<li class="dropdown-item disabled text-muted">尚無收藏清單</li>';
        }

        mobileAllWrap.innerHTML = others.map(({
          cl,
          i
        }) => mobileListToLi(cl, i)).join('');

        // Update dropdown button text
        if (selectedIndex >= 0 && selectedIndex < userChecklists.length) {
          const currentChecklist = userChecklists[selectedIndex];
          mobileDropdownBtn.textContent = currentChecklist.name || '未命名清單';
        }

        // Attach mobile dropdown click events
        document.querySelectorAll('[data-mobile-index]').forEach(li => {
          li.addEventListener('click', (e) => {
            e.preventDefault();
            const idx = parseInt(li.dataset.mobileIndex, 10);
            if (idx >= 0 && idx < userChecklists.length) {
              selectedIndex = idx;
              renderDetail();
              renderSidebar();
            }
          });
        });
      }

      attachSidebarEvents();
    }

    function renderDetail() {
          // ROI 篩選：包裝原 pain point 過濾邏輯
          function filterByROI(item) {
            // roiFilterActive: ROI 篩選條件（array），item.roi: pain point 的 ROI 標籤（array）
            if (!Array.isArray(roiFilterActive) || roiFilterActive.length === 0) return true;
            if (!Array.isArray(item.roi)) return false;
            // 只要有一個 ROI tag match 就顯示
            return item.roi.some(tag => roiFilterActive.includes(tag));
          }
      const idx = selectedIndex;
      const toolbar = document.getElementById('detail-toolbar');
      const meta = document.getElementById('detail-meta');
      if (idx < 0 || idx >= userChecklists.length) {
        // Hide toolbar and meta blocks
        if (toolbar) toolbar.classList.add('d-none');
        if (meta) meta.classList.add('d-none');
        if (elements.printTitle) elements.printTitle.textContent = '';
        // Show CTA empty state with brand styling
        if (elements.detailSections) {
          elements.detailSections.innerHTML = `
            <div class="text-center py-5" id="detail-empty">
              <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
              <h5 class="text-muted">開始您的第一個 UX 專案</h5>
              <p class="text-muted mb-4">選擇專案類型，系統將自動載入專業的痛點檢查模板</p>
              <button class="btn btn-primary-shari btn-lg" onclick="document.getElementById('create-checklist-btn').click() || document.getElementById('mobile-create-btn').click()">
                <i class="fas fa-plus me-2"></i>建立第一張清單
              </button>
            </div>`;
        }
        const ptBadge = document.getElementById('detail-project-type');
        if (ptBadge) ptBadge.textContent = '';
        return;
      }
      const checklist = userChecklists[idx];
      // --- Auto-migrate: 補齊缺少的分類（如 cognitive/emotional/support/accessibility）---
      const pt = projectTypes.find(p => p.id === checklist.projectType) || projectTypes.find(p => p.id === 'general');
      if (checklist && checklist.items && pt && pt.template) {
        ["cognitive", "emotional", "support", "accessibility"].forEach(cat => {
          if (!Array.isArray(checklist.items[cat]) && Array.isArray(pt.template[cat])) {
            checklist.items[cat] = pt.template[cat].map(item => ({
              ...item
            }));
          }
        });
      }
      const {
        totalItems,
        checkedItems,
        progress
      } = computeProgress(checklist);

      // Update project type badge
      const ptBadge = document.getElementById('detail-project-type');
      if (ptBadge) ptBadge.textContent = `${pt.icon} ${pt.name}`;

      // Ensure toolbar and meta visible when a checklist is selected
      if (toolbar) toolbar.classList.remove('d-none');
      if (meta) meta.classList.remove('d-none');

      if (elements.detailTitle) elements.detailTitle.value = checklist.name || '';
      if (elements.printTitle) elements.printTitle.textContent = checklist.name || '';
      if (elements.detailProgressBar) elements.detailProgressBar.style.width = progress + '%';
      if (elements.detailUpdated) elements.detailUpdated.textContent = new Date(checklist.updatedAt).toLocaleDateString('zh-TW');

      const renderItem = (cat, item, itemIndex) => {
        const severity = item.severity || 'none';
        const severityColors = {
          none: 'secondary',
          low: 'success',
          medium: 'warning',
          high: 'danger'
        };
        const severityBtnColors = {
          none: 'secondary',
          low: 'success',
          medium: 'warning',
          high: 'danger'
        };
        const severityLabels = {
          none: '未設定',
          low: '低',
          medium: '中',
          high: '高'
        };
        const hasPriority = item.priority || false;
        const hasNote = item.note && item.note.trim();
        const isCustom = item.custom === true;

        return `<div class="checklist-item touch-feedback ${item.checked?'checked':''}" data-cat="${cat}" data-item-id="${item.id}">
          <label class="checkbox-touch-area" for="d-${idx}-${item.id}">
            <input type="checkbox" id="d-${idx}-${item.id}" ${item.checked?'checked':''} data-cat="${cat}" data-id="${item.id}">
          </label>
          <div class="checklist-item-text">
            <div class="d-flex flex-column flex-md-row align-items-start gap-2 w-100">
              <span class="flex-grow-1 mb-2 mb-md-0">${item.text}
                <span class="print-only ms-2">
                  ${hasPriority?'<i class="fas fa-star print-star"></i>':''}
                  ${severity!== 'none' ? `<span class="print-badge sev-${severity}">${severityLabels[severity]}</span>` : ''}
                </span>
              </span>
              <div class="d-flex align-items-center gap-2 flex-shrink-0 no-print item-actions" role="toolbar" aria-label="項目操作">
                <!-- Priority star -->
                <button class="btn btn-icon-shari priority-btn ${hasPriority?'active':''}" 
                        data-cat="${cat}" data-id="${item.id}" title="標記為重點" aria-label="標記為重點">
                  <i class="fas fa-star ${hasPriority?'text-warning':'text-muted'}"></i>
                </button>
                <!-- Severity dropdown -->
                <div class="dropdown d-inline-block">
                  <button class="btn btn-sm severity-btn ${severity === 'none' ? 'btn-outline-secondary' : 'btn-' + severityBtnColors[severity]} dropdown-toggle py-0 px-2 btn-chip" 
                          type="button" data-bs-toggle="dropdown" data-severity="${severity}" style="font-size: 0.8rem; line-height: 1.4; min-height: 32px; min-width: 52px;">
                    ${severityLabels[severity]}
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item severity-option" href="#" data-cat="${cat}" data-id="${item.id}" data-severity="none">未設定</a></li>
                    <li><a class="dropdown-item severity-option text-success" href="#" data-cat="${cat}" data-id="${item.id}" data-severity="low">低</a></li>
                    <li><a class="dropdown-item severity-option text-warning" href="#" data-cat="${cat}" data-id="${item.id}" data-severity="medium">中</a></li>
                    <li><a class="dropdown-item severity-option text-danger" href="#" data-cat="${cat}" data-id="${item.id}" data-severity="high">高</a></li>
                  </ul>
                </div>
                <!-- Note button -->
                <button class="btn btn-icon-shari note-btn ${hasNote?'text-primary':'text-muted'}" 
                        data-cat="${cat}" data-id="${item.id}" title="添加筆記" aria-label="添加筆記">
                  <i class="fas fa-sticky-note"></i>
                </button>
                <!-- Explanation icon -->
                ${item.suggestion?`<button class="btn btn-icon-shari text-info suggestion-btn" 
                                           data-suggestion="${encodeURIComponent(item.suggestion)}" title="查看建議" aria-label="查看建議">
                  <i class="fas fa-info-circle"></i>
                </button>`:''}
                <!-- Delete button (custom items only) -->
                ${isCustom?`<button class="btn btn-icon-shari text-danger delete-item-btn" 
                                    data-cat="${cat}" data-id="${item.id}" title="刪除自定義項目" aria-label="刪除自定義項目">
                  <i class="fas fa-trash-alt"></i>
                </button>`:''}
              </div>
            </div>
            ${hasNote?`<div class="item-note mt-1 small text-muted"><i class="fas fa-comment-dots me-1"></i>${item.note}</div>`:''}
          </div>
        </div>`;
      };
      const section = (title, iconClass, catArrName) => {
        const items = checklist.items[catArrName];
        // Debug: 輸出目前分類、原始 pain point、ROI 篩選狀態
        console.log('[ROI DEBUG]', {
          category: catArrName,
          items,
          roiFilterActive,
          filtered: Array.isArray(items) ? items.filter(filterByROI) : []
        });
        let filteredItems = Array.isArray(items) ? items.filter(filterByROI) : [];
        // 應用多重篩選
        if (showPriorityOnly) {
          filteredItems = filteredItems.filter(i => i.priority);
        }
        if (showOnlyIncomplete) {
          filteredItems = filteredItems.filter(i => !i.checked);
        }
        if (showOnlyNeedsWork) {
          filteredItems = filteredItems.filter(i => i.severity && i.severity !== 'none');
        }

        const catTotal = items.length;
        const catChecked = items.filter(i => i.checked).length;
        const catProgress = catTotal ? Math.round((catChecked / catTotal) * 100) : 0;
        const customCount = items.filter(i => i.custom).length;
        const isCollapsed = collapsedCategories.has(catArrName);

        return `
        <div class="checklist-section" data-category="${catArrName}">
          <div class="section-title d-flex align-items-center justify-content-between" style="cursor: pointer;" data-toggle-category="${catArrName}">
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-link p-0 text-decoration-none collapse-btn" data-toggle-category="${catArrName}">
                <i class="fas fa-chevron-${isCollapsed ? 'right' : 'down'} text-muted"></i>
              </button>
              <div class="section-icon"><i class="${iconClass}"></i></div>
              <span>${title}</span>
              <span class="badge bg-light text-muted">${catChecked}/${catTotal}</span>
            </div>
            <div class="progress no-print" style="width: 80px; height: 6px;">
              <div class="progress-bar bg-secondary-shari" role="progressbar" style="width: ${catProgress}%" 
                   aria-valuenow="${catProgress}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
          <div class="category-items ${isCollapsed ? 'd-none' : ''}">
            ${filteredItems.map((item, itemIndex)=>renderItem(catArrName,item,itemIndex)).join('')}
            ${showPriorityOnly ? '' : `
            <button class="btn btn-sm btn-outline-secondary-shari mt-2 w-100 add-custom-item-btn no-print" 
                    data-category="${catArrName}">
              <i class="fas fa-plus me-1"></i>新增自定義痛點
            </button>
            <div class="text-muted small text-center mt-1 no-print">(最多 5 個，已使用 ${customCount})</div>
            `}
          </div>
        </div>`;
      };
      // 自動根據 checklist.items 的 key 產生 section，確保所有分類都能折疊
      const categoryMeta = {
        process: {
          title: '流程痛點',
          icon: 'fas fa-route'
        },
        interface: {
          title: '介面痛點', icon: 'fas fa-window-maximize'
        },
        context: {
          title: '情境痛點',
          icon: 'fas fa-users'
        },
        cognitive: {
          title: '認知痛點',
          icon: 'fas fa-brain'
        },
        emotional: {
          title: '情緒痛點',
          icon: 'fas fa-heartbeat'
        },
        support: {
          title: '支援性痛點',
          icon: 'fas fa-hands-helping'
        },
        accessibility: {
          title: '可及性痛點',
          icon: 'fas fa-universal-access'
        }
        // 若有新分類，預設 icon
      };
      const CATEGORY_ORDER = [
        'process',    // 流程痛點
        'interface',  // 介面痛點
        'context',    // 情境痛點
        'cognitive',  // 認知痛點
        'emotional',  // 情緒痛點
        'support',    // 支援性痛點
        'accessibility' // 可及性痛點
      ];
      const html = CATEGORY_ORDER
        .filter(cat => checklist.items[cat])
        .map(cat => {
          const meta = categoryMeta[cat] || {
            title: cat,
            icon: 'fas fa-folder'
          };
          return section(meta.title, meta.icon, cat);
        }).join('');
      elements.detailSections.innerHTML = html;

      // 修正：折疊按鈕支援所有類別
      document.querySelectorAll('.collapse-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
          const cat = btn.getAttribute('data-toggle-category');
          if (!cat) return;
          if (collapsedCategories.has(cat)) {
            collapsedCategories.delete(cat);
          } else {
            collapsedCategories.add(cat);
          }
          renderDetail();
        });
      });

      // Wire dropdown menu actions
      document.querySelectorAll('.dropdown-item[data-action]').forEach(item => {
        item.addEventListener('click', async (e) => {
          e.preventDefault();
          const action = e.currentTarget.getAttribute('data-action');
          if (action === 'duplicate') {
            await duplicateChecklistWithUI(idx);
          } else if (action === 'print') {
            window.print();
          } else if (action === 'delete') {
            await deleteChecklistWithUI(idx);
          }
        });
      });

      // checkbox changes
      elements.detailSections.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', async (e) => {
          const cat = e.target.getAttribute('data-cat');
          const itemId = e.target.getAttribute('data-id');
          const item = userChecklists[idx].items[cat].find(i => i.id === itemId);
          if (item) {
            item.checked = !!e.target.checked;
            userChecklists[idx].updatedAt = new Date().toISOString();
            await saveToFirestore();
            showSaveIndicator();
            updateUI();

            // 檢查成就（只在勾選時觸發）
            if (e.target.checked) {
              checkAchievements(userChecklists[idx]);
            }
          }
        });
      });

      // Priority toggle
      elements.detailSections.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const cat = e.currentTarget.getAttribute('data-cat');
          const itemId = e.currentTarget.getAttribute('data-id');
          const item = userChecklists[idx].items[cat].find(i => i.id === itemId);
          if (item) {
            item.priority = !item.priority;
            userChecklists[idx].updatedAt = new Date().toISOString();
            await saveToFirestore();
            showSaveIndicator();
            renderDetail();
          }
        });
      });

      // Severity dropdown
      elements.detailSections.querySelectorAll('.severity-option').forEach(opt => {
        opt.addEventListener('click', async (e) => {
          e.preventDefault();
          const cat = e.currentTarget.getAttribute('data-cat');
          const itemId = e.currentTarget.getAttribute('data-id');
          const severity = e.currentTarget.getAttribute('data-severity');
          const item = userChecklists[idx].items[cat].find(i => i.id === itemId);
          if (item) {
            item.severity = severity;
            userChecklists[idx].updatedAt = new Date().toISOString();
            await saveToFirestore();
            showSaveIndicator();
            renderDetail();
          }
        });
      });

      // Note button
      elements.detailSections.querySelectorAll('.note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const cat = e.currentTarget.getAttribute('data-cat');
          const itemId = e.currentTarget.getAttribute('data-id');
          const item = userChecklists[idx].items[cat].find(i => i.id === itemId);
          if (item) {
            openNoteModal(idx, cat, itemId, item.note || '');
          }
        });
      });

      // Suggestion button
      elements.detailSections.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const suggestion = decodeURIComponent(e.currentTarget.getAttribute('data-suggestion') || '');
          if (suggestion) {
            alert('💡 建議：\n\n' + suggestion);
          }
        });
      });

      // Delete custom item button
      elements.detailSections.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          if (!confirm('確定要刪除此自定義項目嗎？')) return;
          const cat = e.currentTarget.getAttribute('data-cat');
          const itemId = e.currentTarget.getAttribute('data-id');
          const itemIndex = userChecklists[idx].items[cat].findIndex(i => i.id === itemId);
          if (itemIndex !== -1) {
            userChecklists[idx].items[cat].splice(itemIndex, 1);
            userChecklists[idx].updatedAt = new Date().toISOString();
            await saveToFirestore();
            showSaveIndicator();
            renderDetail();
          }
        });
      });

      // Add custom item buttons
      elements.detailSections.querySelectorAll('.add-custom-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const category = e.currentTarget.getAttribute('data-category');
          addCustomItem(idx, category);
        });
      });

      // title changes (debounced)
      if (elements.detailTitle) {
        let t;
        elements.detailTitle.oninput = (e) => {
          clearTimeout(t);
          t = setTimeout(async () => {
            userChecklists[idx].name = (e.target.value || '').trim() || `專案清單 ${idx+1}`;
            userChecklists[idx].updatedAt = new Date().toISOString();
            await saveToFirestore();
            showSaveIndicator();
            renderSidebar();
          }, 400);
        };
      }

      // Priority filter button
      const priorityFilterBtn = document.getElementById('priority-filter-btn');
      if (priorityFilterBtn) {
        priorityFilterBtn.onclick = () => {
          showPriorityOnly = !showPriorityOnly;
          priorityFilterBtn.classList.toggle('active', showPriorityOnly);
          renderDetail();
        };
      }

      // 只顯示未完成篩選
      const filterIncompleteBtn = document.getElementById('filter-incomplete-btn');
      if (filterIncompleteBtn) {
        filterIncompleteBtn.onclick = () => {
          showOnlyIncomplete = !showOnlyIncomplete;
          filterIncompleteBtn.classList.toggle('active', showOnlyIncomplete);
          if (showOnlyIncomplete) {
            showOnlyNeedsWork = false; // 互斥
            const needsWorkBtn = document.getElementById('filter-needs-work-btn');
            if (needsWorkBtn) {
              needsWorkBtn.classList.remove('active');
            }
          }
          renderDetail();
        };
      }

      // 只顯示需修正篩選
      const filterNeedsWorkBtn = document.getElementById('filter-needs-work-btn');
      if (filterNeedsWorkBtn) {
        filterNeedsWorkBtn.onclick = () => {
          showOnlyNeedsWork = !showOnlyNeedsWork;
          filterNeedsWorkBtn.classList.toggle('active', showOnlyNeedsWork);
          if (showOnlyNeedsWork) {
            showOnlyIncomplete = false; // 互斥
            const incompleteBtn = document.getElementById('filter-incomplete-btn');
            if (incompleteBtn) {
              incompleteBtn.classList.remove('active');
            }
          }
          renderDetail();
        };
      }

      // 折疊所有類別
      const collapseAllBtn = document.getElementById('collapse-all-btn');
      if (collapseAllBtn) {
        collapseAllBtn.onclick = () => {
          // 支援所有類別（含 cognitive/emotional）
          const allCategories = ['process', 'interface', 'context', 'cognitive', 'emotional', 'support', 'accessibility'];
          const allCollapsed = allCategories.every(cat => collapsedCategories.has(cat));
          if (allCollapsed) {
            // 全部展開
            collapsedCategories.clear();
            collapseAllBtn.innerHTML = '<i class="fas fa-compress-alt d-md-none"></i><span class="d-none d-md-inline"><i class="fas fa-compress-alt me-1"></i>折疊</span><span class="d-md-none">折疊</span>';
          } else {
            // 全部折疊
            allCategories.forEach(cat => collapsedCategories.add(cat));
            collapseAllBtn.innerHTML = '<i class="fas fa-expand-alt d-md-none"></i><span class="d-none d-md-inline"><i class="fas fa-expand-alt me-1"></i>展開</span><span class="d-md-none">展開</span>';
          }
          renderDetail();
        };
      }

      // 類別折疊切換
      document.querySelectorAll('[data-toggle-category]').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const category = btn.getAttribute('data-toggle-category');
          if (collapsedCategories.has(category)) {
            collapsedCategories.delete(category);
          } else {
            collapsedCategories.add(category);
          }
          renderDetail();
        };
      });

      // actions
      if (elements.btnDuplicate) {
        elements.btnDuplicate.onclick = async () => {
          const dropdownEl = elements.btnDuplicate.closest('.dropdown');
          const dropdownToggle = dropdownEl ? dropdownEl.querySelector('.dropdown-toggle') : document.querySelector('.dropdown-toggle');
          if (dropdownToggle) {
            const icon = dropdownToggle.querySelector('i');
            const originalIcon = icon.className;
            icon.className = 'fas fa-spinner fa-spin';
            dropdownToggle.disabled = true;

            try {
              await (window.duplicateChecklistWithUI ? window.duplicateChecklistWithUI(idx, elements.btnDuplicate) : window.duplicateChecklist(idx));
            } finally {
              if (icon) icon.className = originalIcon;
              if (dropdownToggle) dropdownToggle.disabled = false;
            }
          } else {
            await (window.duplicateChecklistWithUI ? window.duplicateChecklistWithUI(idx, elements.btnDuplicate) : window.duplicateChecklist(idx));
          }
        };
      }
      if (elements.btnDelete) elements.btnDelete.onclick = () => window.deleteChecklistWithUI ? window.deleteChecklistWithUI(idx, elements.btnDelete) : window.deleteChecklist(idx);
      if (elements.btnPrint) elements.btnPrint.onclick = () => window.print && window.print();
    }

    // Show Achievement Toast with progress
    function showAchievement(text, progress, detail) {
      const toast = document.getElementById('achievement-toast');
      const titleEl = document.getElementById('achievement-title');
      const textEl = document.getElementById('achievement-text');
      const detailEl = document.getElementById('achievement-detail');
      const progressBar = document.getElementById('achievement-progress-bar');

      // 根據進度設定標題和圖示
      if (progress >= 100) {
        titleEl.innerHTML = '<i class="fas fa-trophy me-2"></i>🎉 完美達成！';
      } else if (progress >= 80) {
        titleEl.innerHTML = '<i class="fas fa-star me-2"></i>✨ 太棒了！';
      } else if (progress >= 50) {
        titleEl.innerHTML = '<i class="fas fa-check-circle me-2"></i>👍 做得好！';
      } else {
        titleEl.innerHTML = '<i class="fas fa-thumbs-up me-2"></i>💪 繼續加油！';
      }

      textEl.textContent = text;
      detailEl.textContent = detail || '';

      // 動畫更新進度條
      progressBar.style.width = '0%';
      setTimeout(() => {
        progressBar.style.width = progress + '%';
        progressBar.style.transition = 'width 0.8s ease';
      }, 100);

      toast.classList.add('show');

      // 根據進度調整顯示時間
      const displayTime = progress >= 100 ? 6000 : progress >= 80 ? 5000 : 4000;
      setTimeout(() => toast.classList.remove('show'), displayTime);
    }

    // 檢查並觸發成就提示
    function checkAchievements(checklist) {
      const {
        totalItems,
        checkedItems,
        progress
      } = computeProgress(checklist);

      // 類別完成度檢查
      ['process', 'interface', 'context', 'cognitive', 'emotional', 'support', 'accessibility'].forEach(cat => {
        const items = checklist.items[cat];
        const catTotal = items.length;
        const catChecked = items.filter(i => i.checked).length;
        const catProgress = catTotal ? Math.round((catChecked / catTotal) * 100) : 0;

        if (catProgress === 100 && catChecked > 0) {
          const categoryNames = {
            process: '流程痛點',
            interface: '介面痛點',
            context: '情境痛點',
            cognitive: '認知痛點',
            emotional: '情緒痛點',
            support: '支援性痛點',
            accessibility: '可及性痛點'
          };
          showAchievement(
            `${categoryNames[cat]}類別全部完成！`,
            100,
            `已完成 ${catChecked} 個項目`
          );
        } else if (catProgress >= 80 && catProgress < 100) {
          // 80% 里程碑（只在第一次達到時顯示）
          const key = `achievement_${cat}_80`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, 'shown');
            const categoryNames = {
              process: '流程痛點',
              interface: '介面痛點',
              context: '情境痛點',
              cognitive: '認知痛點',
              emotional: '情緒痛點',
              support: '支援性痛點',
              accessibility: '可及性痛點'
            };
            showAchievement(
              `${categoryNames[cat]}快完成了！`,
              catProgress,
              `還剩 ${catTotal - catChecked} 個項目`
            );
          }
        }
      });

      // 整體完成度里程碑
      if (progress === 100 && totalItems > 0) {
        showAchievement(
          '恭喜！所有痛點都已檢查完成',
          100,
          `共完成 ${totalItems} 個項目`
        );
      } else if (progress >= 75 && progress < 100) {
        const key = `achievement_overall_75`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, 'shown');
          showAchievement(
            '超過四分之三了！',
            progress,
            `已完成 ${checkedItems}/${totalItems} 個項目`
          );
        }
      } else if (progress >= 50 && progress < 75) {
        const key = `achievement_overall_50`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, 'shown');
          showAchievement(
            '已完成一半！繼續加油',
            progress,
            `已完成 ${checkedItems}/${totalItems} 個項目`
          );
        }
      }
    }

    // Show Save Indicator
    function showSaveIndicator() {
      // Show save icon next to title
      const saveIcon = document.getElementById('save-icon');
      if (saveIcon) {
        saveIcon.classList.remove('d-none');
        setTimeout(() => {
          saveIcon.classList.add('d-none');
        }, 2000);
      }

      // Legacy save indicator (if still present)
      const indicator = document.getElementById('save-indicator');
      if (indicator) {
        indicator.classList.remove('show');
        void indicator.offsetWidth; // force reflow
        indicator.classList.add('show');
        setTimeout(() => {
          indicator.classList.remove('show');
        }, 2000);
      }
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

    function attachSidebarEvents() {
      const sidebar = document.getElementById('checklistSidebar');
      const wireList = (ulEl) => {
        if (!ulEl) return;
        ulEl.querySelectorAll('li.list-group-item').forEach(li => {
          // select
          const sel = li.querySelector('[data-select]');
          if (sel) sel.onclick = () => {
            selectedIndex = parseInt(li.dataset.index);
            renderSidebar();
            renderDetail();
          };
          // pin
          const pinBtn = li.querySelector('[data-pin]');
          if (pinBtn) pinBtn.onclick = async (e) => {
            e.stopPropagation();
            const idx = parseInt(li.dataset.index);

            // Show loading spinner immediately and keep until save completes
            const icon = pinBtn.querySelector('i');
            const originalIcon = icon.className;
            icon.className = 'fas fa-spinner fa-spin';
            pinBtn.disabled = true;

            const previousState = userChecklists[idx].pinned;
            userChecklists[idx].pinned = !userChecklists[idx].pinned;
            userChecklists[idx].updatedAt = new Date().toISOString();

            try {
              await saveToFirestore();
              showSaveIndicator();
              renderSidebar();
            } catch (err) {
              // Rollback on error
              console.error('Pin toggle failed:', err);
              userChecklists[idx].pinned = previousState;
              alert('收藏狀態更新失敗，請重試');
              renderSidebar();
            } finally {
              // In case renderSidebar didn't rerender this element yet
              if (icon) icon.className = originalIcon;
              pinBtn.disabled = false;
            }
          };
          // dnd
          li.addEventListener('dragstart', () => {
            li.classList.add('dragging');
          });
          li.addEventListener('dragend', async () => {
            li.classList.remove('dragging');
            // after drop, recompute order by current DOM
            const order = [];
            const collect = (root) => {
              root.querySelectorAll('li.list-group-item').forEach(n => {
                order.push(parseInt(n.dataset.index));
              });
            };
            collect(elements.sidebarFavorites);
            collect(elements.sidebarAll);
            const newArr = order.map(i => userChecklists[i]);
            userChecklists = newArr;
            selectedIndex = Math.max(0, Math.min(selectedIndex, userChecklists.length - 1));
            await saveToFirestore();
            renderSidebar();
          });
        });
        ulEl.addEventListener('dragover', (e) => {
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

      function getDragAfterElement(container, y) {
        const els = [...container.querySelectorAll('li.list-group-item:not(.dragging)')];
        return els.reduce((closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          if (offset < 0 && offset > closest.offset) return {
            offset,
            element: child
          };
          else return closest;
        }, {
          offset: Number.NEGATIVE_INFINITY
        }).element;
      }
      if (elements.sidebarSearch) {
        elements.sidebarSearch.oninput = (e) => {
          searchQuery = e.target.value || '';
          renderSidebar();
        };
      }
      // Bind mobile search input
      const mobileSearch = document.getElementById('mobile-sidebar-search');
      if (mobileSearch) {
        mobileSearch.oninput = (e) => {
          searchQuery = e.target.value || '';
          renderSidebar();
        };
      }
    }

    // Initialize Project Type Modal
    function initProjectTypeModal() {
      const grid = document.getElementById('project-type-grid');
      const loading = document.getElementById('project-type-loading');
      grid.innerHTML = projectTypes.map(pt => `
        <div class="project-type-card" data-type="${pt.id}" onclick="selectProjectType('${pt.id}')">
          <div class="project-type-icon">${pt.icon}</div>
          <div class="project-type-name">${pt.name}</div>
          <div class="project-type-desc">${pt.desc}</div>
        </div>
      `).join('');
      // Hide loading, show grid
      if (loading) loading.style.display = 'none';
      grid.style.display = 'grid';
    }

    // Select Project Type
    window.selectProjectType = function (typeId) {
      selectedProjectType = typeId;
      document.querySelectorAll('.project-type-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.type === typeId);
      });
    };

    // Create New Checklist with Project Type
    const openCreateModal = () => {
      if (!isPaid && userChecklists.length >= FREE_LIMIT) {
        alert('已達普通會員上限（3 張清單）\n\n升級到 VIP 會員以建立無限數量清單！');
        return;
      }

      selectedProjectType = null;
      const modal = new bootstrap.Modal(document.getElementById('projectTypeModal'));
      modal.show();
    };

    if (elements.createBtn) elements.createBtn.addEventListener('click', openCreateModal);
    if (elements.mobileCreateBtn) elements.mobileCreateBtn.addEventListener('click', openCreateModal);

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
      setTimeout(() => {
        selectedIndex = userChecklists.length - 1;
        updateUI();
      }, 120);
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
      const {
        progress
      } = computeProgress(userChecklists[checklistIndex]);
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
      lastDeleted = {
        data: removed,
        index: restoreAt
      };
      showUndoToast(`已刪除「${removed?.name || '清單'}」`, async () => {
        const insertAt = Math.min(lastDeleted.index, userChecklists.length);
        userChecklists.splice(insertAt, 0, lastDeleted.data);
        lastDeleted = null;
        updateUI();
        try {
          await saveToFirestore();
          showSaveIndicator();
        } catch (e) {}
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
      lastDeleted = {
        data: removed,
        index: restoreAt
      };
      showUndoToast(`已刪除「${removed?.name || '清單'}」`, async () => {
        const insertAt = Math.min(lastDeleted.index, userChecklists.length);
        userChecklists.splice(insertAt, 0, lastDeleted.data);
        lastDeleted = null;
        updateUI();
        try {
          await saveToFirestore();
          showSaveIndicator();
        } catch (e) {}
      });
      // Save in background
      saveToFirestore().then(() => {
        showSaveIndicator();
      }).catch(err => {
        console.warn('刪除同步失敗：', err?.message || err);
      });
    };

    // VIP perk click handlers
    const setupVIPPerkHandlers = () => {
      const perkPdf = document.getElementById('perk-pdf');
      const perkAi = document.getElementById('perk-ai');
      const perkTeam = document.getElementById('perk-team');

      if (perkPdf) {
        perkPdf.addEventListener('click', () => {
          if (!isPaid) {
            alert('升級到 VIP 會員以使用 PDF 匯出功能！\n\n立即升級：前往「定價方案」頁面');
          } else {
            // TODO: Implement PDF export
            alert('PDF 匯出功能開發中…');
          }
        });
      }

      if (perkAi) {
        perkAi.addEventListener('click', () => {
          if (!isPaid) {
            alert('升級到 VIP 會員以使用 AI 優化建議功能！\n\n立即升級：前往「定價方案」頁面');
          } else {
            // TODO: Implement AI suggestions
            alert('AI 優化建議功能開發中…');
          }
        });
      }

      if (perkTeam) {
        perkTeam.addEventListener('click', () => {
          if (!isPaid) {
            alert('升級到 VIP 會員以使用團隊協作功能！\n\n立即升級：前往「定價方案」頁面');
          } else {
            // TODO: Implement team collaboration
            alert('團隊協作功能開發中…');
          }
        });
      }
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
        restoreBtn(btnEl);
      } catch (e) {
        alert('複製失敗，請重試');
        restoreBtn(btnEl);
      }
    };

    // Attach Event Listeners
    function attachEventListeners() {
      /* replaced by renderDetail + attachSidebarEvents */ }

    // Open Note Modal
    function openNoteModal(checklistIdx, category, itemId, currentNote) {
      const modal = new bootstrap.Modal(document.getElementById('noteModal'));
      const textarea = document.getElementById('note-textarea');
      const saveBtn = document.getElementById('save-note-btn');

      textarea.value = currentNote || '';

      // Remove old listeners
      const newSaveBtn = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

      newSaveBtn.addEventListener('click', async () => {
        // Show spinner
        const btnText = newSaveBtn.querySelector('.btn-text');
        const btnSpinner = newSaveBtn.querySelector('.btn-spinner');
        btnText.classList.add('d-none');
        btnSpinner.classList.remove('d-none');
        newSaveBtn.disabled = true;

        try {
          const note = textarea.value.trim();
          const item = userChecklists[checklistIdx].items[category].find(i => i.id === itemId);
          if (item) {
            item.note = note;
            userChecklists[checklistIdx].updatedAt = new Date().toISOString();
            await saveToFirestore();
            showSaveIndicator();
            modal.hide();
            renderDetail();
          }
        } finally {
          // Hide spinner
          btnText.classList.remove('d-none');
          btnSpinner.classList.add('d-none');
          newSaveBtn.disabled = false;
        }
      });

      modal.show();
    }

    // Add Custom Item
    function addCustomItem(checklistIdx, category) {
      const itemText = prompt('請輸入自定義痛點項目：');
      if (!itemText || !itemText.trim()) return;

      const customItems = userChecklists[checklistIdx].items[category].filter(i => i.id.startsWith('custom_'));
      if (customItems.length >= 5) {
        alert('每個類別最多只能新增 5 個自定義項目');
        return;
      }

      const newItem = {
        id: `custom_${category}_${Date.now()}`,
        text: itemText.trim(),
        checked: false,
        suggestion: '',
        severity: 'none',
        priority: false,
        note: '',
        custom: true
      };

      userChecklists[checklistIdx].items[category].push(newItem);
      userChecklists[checklistIdx].updatedAt = new Date().toISOString();
      saveToFirestore().then(() => {
        showSaveIndicator();
        renderDetail();
      });
    }

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
          await updateDoc(primaryRef, {
            uxChecklists: cleanChecklists
          });
        } else {
          // Document doesn't exist, use create
          await setDoc(primaryRef, {
            email: userEmail,
            uxChecklists: cleanChecklists
          });
        }
        console.log('✅ 清單已儲存 (users_by_email)');
      } catch (error) {
        console.warn('users_by_email 儲存失敗，嘗試 users/{uid}：', error?.message || error);
        try {
          const uid = (auth.currentUser && auth.currentUser.uid) || '';
          if (!uid) throw new Error('No UID for fallback write');
          const cleanChecklists = JSON.parse(JSON.stringify(userChecklists));
          const uidRef = doc(db, 'users', uid);
          await setDoc(uidRef, {
            email: userEmail,
            uxChecklists: cleanChecklists
          }, {
            merge: true
          });
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
      setupVIPPerkHandlers();
      dataReady = true;
      // Default select first checklist if available
      if (userChecklists.length > 0 && selectedIndex === -1) {
        selectedIndex = 0;
      }
      // Always render UI after data loads
      updateUI();
    });