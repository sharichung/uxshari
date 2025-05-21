addEventListener("DOMContentLoaded", function () {

    // ==================== Firebase 驗證與登入 ====================
    // 初始化 Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyCZs2a35ENke7G8K7pzAMKCY3HOoi-IUcU",
        authDomain: "uxshari-670fd.firebaseapp.com",
        projectId: "uxshari-670fd",
        appId: "1:907540538791:web:ed98ef4ba51c96de43c282",
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // 綁定事件
    document.getElementById("auth-form").addEventListener("submit", handleLogin);
    document.getElementById("google-auth").addEventListener("click", handleGoogleLogin);

    // Email/Password 登入或註冊
    async function handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const errorEl = document.getElementById("error");
        errorEl.innerText = "";

        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = "/uxshari/dashboard.html";
        } catch (err) {
            if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
                try {
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    if (!userCredential.user) {
                        errorEl.innerText = "註冊失敗，請稍後再試。";
                        return;
                    }
                    await db.collection("users").doc(userCredential.user.uid).set({
                        email: email,
                        role: "free",
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    window.location.href = "/uxshari/dashboard.html";
                } catch (signupErr) {
                    if (signupErr.code === "auth/email-already-in-use") {
                        errorEl.innerText = "這個 Email 已經被註冊，請用 Google 登入或重設密碼。";
                        // 自動彈出 Google 登入視窗
                        const provider = new firebase.auth.GoogleAuthProvider();
                        auth.signInWithPopup(provider)
                            .then(() => {
                                window.location.href = "/uxshari/dashboard.html";
                            })
                            .catch(err => {
                                errorEl.innerText = "Google 登入失敗：" + err.message;
                            });
                    } else if (
                        signupErr.code === "auth/account-exists-with-different-credential"
                    ) {
                        // ...原本的 Google 帳號連結流程...
                    } else {
                        errorEl.innerText = signupErr.message;
                    }
                }
            } else if (err.code === "auth/wrong-password") {
                errorEl.innerText = "密碼錯誤，請重新輸入。";
            } else if (err.code === "auth/invalid-email") {
                errorEl.innerText = "電子郵件格式錯誤。";
            } else {
                errorEl.innerText = err.message;
            }
        }
    }

    // Google 登入
    function handleGoogleLogin() {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then(async (result) => {
                // Google 登入成功後，檢查是否已連結 password provider
                const user = result.user;
                const providers = user.providerData.map(p => p.providerId);

                if (!providers.includes('password')) {
                    // 這裡彈出一個表單讓用戶輸入新密碼
                    const password = prompt("請設定一組密碼，之後可以用 Email/密碼登入：");
                    if (password && password.length >= 6) {
                        const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
                        try {
                            await user.linkWithCredential(credential);
                            alert("密碼設定成功，之後可以用 Email/密碼或 Google 登入！");
                        } catch (error) {
                            alert("密碼連結失敗：" + error.message);
                        }
                    }
                }
                window.location.href = "/uxshari/dashboard.html";
            })
            .catch(err => {
                document.getElementById("error").innerText = err.message;
            });
    }


// ==================== 密碼重設 ====================
// 開啟密碼重設彈窗
function openPasswordResetModal() {
  var modal = document.getElementById("password-reset-modal");
  if (modal) {
    modal.classList.add("active");
    modal.style.display = "block";
  }
}
window.openPasswordResetModal = openPasswordResetModal; // 確保全域可用

// 關閉密碼重設彈窗
document.getElementById("close-reset-modal").addEventListener("click", () => {
    document.getElementById("password-reset-modal").classList.remove("active");
});
document.getElementById("cancel-reset").addEventListener("click", () => {
    document.getElementById("password-reset-modal").classList.remove("active");
});

// 密碼重設功能
document.getElementById("submit-reset").addEventListener("click", async () => {
    const email = document.getElementById("reset-email").value;
    const errorEl = document.getElementById("error");
    if (!email) {
        alert("請輸入電子郵件地址！");
        return;
    }
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        alert("密碼重設連結已發送到您的電子郵件！");
        document.getElementById("password-reset-modal").classList.remove("active");
    } catch (error) {
        console.error("密碼重設失敗：", error);
            alert("發送密碼重設連結時出現錯誤：" + error.message);
        }
    });


// ==================== FAQ 手風琴 ====================
const faqQuestions = document.querySelectorAll(".faq-question");
faqQuestions.forEach(question => {
    question.addEventListener("click", () => {
        const answer = question.nextElementSibling;
        const isActive = question.classList.contains("active");

        // Close all other answers
        document.querySelectorAll(".faq-answer").forEach(item => {
            item.classList.remove("show");
        });
        document.querySelectorAll(".faq-question").forEach(item => {
            item.classList.remove("active");
        });

        // Toggle current answer
        if (!isActive) {
            answer.classList.add("show");
            question.classList.add("active");
        }
    });
});
});

// Dynamically load navbar.html into the placeholder
  fetch('navbar.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('navbar-placeholder').innerHTML = data;
    });
    

// Dynamically load footer.html into the placeholder
  fetch('footer.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('footer-placeholder').innerHTML = data;
    });

    

// ==================== 浮動 CTA ====================
const floatingCta = document.getElementById('floating-cta');

floatingCta.addEventListener('click', () => {
    window.scrollTo({
        top: document.getElementById('auth-wrapper').offsetTop - 80,
        behavior: 'smooth'
    });
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        floatingCta.classList.add('expanded');
    } else {
        floatingCta.classList.remove('expanded');
    }
});

// ==================== 倒數計時器 ====================
function updateCountdown() {
    const deadline = new Date("May 27, 2025 23:59:59").getTime();
    const now = new Date().getTime();
    const timeLeft = deadline - now;

    if (timeLeft <= 0) {
        document.getElementById("countdown").innerHTML = "倒數已結束！";
        return;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    document.getElementById("countdown").innerHTML = `<div id="countdown" class="countdown">
                        <div class="countdown-item">
                                <span id="days" class="countdown-number">${days}</span>
                                <span class="countdown-label">天</span>
                        </div>
                        <div class="countdown-item">
                                <span id="hours" class="countdown-number">${hours}</span>
                                <span class="countdown-label">時</span>
                        </div>
                        <div class="countdown-item">
                                <span id="minutes" class="countdown-number">${minutes}</span>
                                <span class="countdown-label">分</span>
                        </div>
                        <div class="countdown-item">
                                <span id="seconds" class="countdown-number">${seconds}</span>
                                <span class="countdown-label">秒</span>
                        </div>
                </div>`;
}
setInterval(updateCountdown, 1000);
updateCountdown();



// ==================== 錨點平滑滾動 ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70,
                behavior: 'smooth'
            });
        }
    });
});

// ==================== 手機選單切換 ====================
document.querySelector('.mobile-menu-toggle').addEventListener('click', function () {
    document.querySelector('.nav-links').classList.toggle('show');
});




// ==================== 浮動粒子效果 ====================
function createParticles() {
    const heroSection = document.querySelector('.hero');
    const featuresSection = document.querySelector('.features');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.width = `${Math.random() * 3 + 2}px`;
        particle.style.height = particle.style.width;
        particle.style.opacity = Math.random() * 0.5 + 0.3;
        particle.style.animationDuration = `${Math.random() * 15 + 10}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        if (i < 10) {
            heroSection.appendChild(particle);
        } else {
            featuresSection.appendChild(particle);
        }
    }
}

// ==================== 頁尾年份 ====================
document.getElementById('current-year').textContent = new Date().getFullYear();

