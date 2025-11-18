/**
 * Success Page Script
 * 付款成功頁：倒數計時跳轉、年份顯示
 */

// 倒數計時器 - 3秒後跳轉回 dashboard
let countdown = 3;
const countdownEl = document.getElementById('countdown');

const timer = setInterval(() => {
  countdown--;
  if (countdownEl) {
    countdownEl.textContent = countdown;
  }

  if (countdown <= 0) {
    clearInterval(timer);
    window.location.href = "/dashboard.html";
  }
}, 1000);

// 更新年份
const yearEl = document.getElementById('current-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// 頁面載入後，將焦點移到標題（無障礙）
window.addEventListener('load', function () {
  const heading = document.getElementById('payment-success-heading');
  if (heading) heading.focus();
});
