document.addEventListener("DOMContentLoaded", function () {
    // Firebase 配置
    const firebaseConfig = {
        apiKey: "AIzaSyCZs2a35ENke7G8K7pzAMKCY3HOoi-IUcU",
        authDomain: "uxshari-670fd.firebaseapp.com",
        projectId: "uxshari-670fd",
        appId: "1:907540538791:web:ed98ef4ba51c96de43c282",
    };
    // 初始化 Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // 監聽表單提交事件
    document.getElementById("auth-form")?.addEventListener("submit", handleLogin);
    // 監聽 Google 登入按鈕事件
    document.getElementById("google-auth")?.addEventListener("click", handleGoogleLogin);

    // 處理登入邏輯
    async function handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const errorEl = document.getElementById("error");
        errorEl.innerText = "";

        try {
            // 嘗試使用電子郵件和密碼登入
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = "/dashboard.html"; // 登入成功，導向儀表板
        } catch (err) {
            // 如果用戶不存在或憑證無效，則嘗試註冊
            if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
                try {
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    if (!userCredential.user) {
                        errorEl.innerText = "註冊失敗，請稍後再試。";
                        return;
                    }
                    // 註冊成功，將用戶資料存入 Firestore
                    await db.collection("users").doc(userCredential.user.uid).set({
                        email,
                        role: "free",
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    window.location.href = "/dashboard.html"; // 導向儀表板
                } catch (signupErr) {
                    handleSignupErrors(signupErr, errorEl); // 處理註冊錯誤
                }
            } else {
                handleSignupErrors(err, errorEl); // 處理登入錯誤
            }
        }
    }

    // 處理註冊和登入錯誤
    function handleSignupErrors(err, errorEl) {
        if (err.code === "auth/email-already-in-use" || err.code === "auth/account-exists-with-different-credential") {
            errorEl.innerText = "這個 Email 已經有其他登入方式，請用 Google 登入。";
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then(() => window.location.href = "/dashboard.html") // Google 登入成功
                .catch(err => errorEl.innerText = "Google 登入失敗：" + err.message);
        } else if (err.code === "auth/wrong-password") {
            errorEl.innerText = "密碼錯誤，請重新輸入。";
        } else if (err.code === "auth/invalid-email") {
            errorEl.innerText = "電子郵件格式錯誤。";
        } else {
            errorEl.innerText = err.message; // 顯示其他錯誤訊息
        }
    }

    // 處理 Google 登入邏輯
    function handleGoogleLogin() {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then(async (result) => {
                const user = result.user;
                const providers = user.providerData.map(p => p.providerId);

                // 如果用戶沒有使用密碼登入，則提示設定密碼
                if (!providers.includes('password')) {
                    const password = prompt("請設定一組密碼，之後可以用 Email/密碼登入：");
                    if (password && password.length >= 6) {
                        const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
                        try {
                            await user.linkWithCredential(credential); // 將密碼連結到用戶帳戶
                            alert("密碼設定成功，之後可以用 Email/密碼或 Google 登入！");
                        } catch (error) {
                            alert("密碼連結失敗：" + error.message);
                        }
                    }
                }
                window.location.href = "/dashboard.html"; // 導向儀表板
            })
            .catch(err => document.getElementById("error").innerText = err.message); // 顯示錯誤訊息
    }

    // 處理密碼重設邏輯
    document.getElementById("submit-reset")?.addEventListener("click", async () => {
        const email = document.getElementById("reset-email").value;
        const errorEl = document.getElementById("error");
        if (!email) return alert("請輸入電子郵件地址！");
        try {
            await firebase.auth().sendPasswordResetEmail(email); // 發送密碼重設郵件
            alert("密碼重設連結已發送到您的電子郵件！");
            closePasswordResetModal(); // 關閉重設密碼的模態框
        } catch (error) {
            alert("發送密碼重設連結失敗：" + error.message);
        }
    });

    // 開啟密碼重設模態框
    window.openPasswordResetModal = () => {
        const modal = document.getElementById("password-reset-modal");
        modal?.classList.add("active");
        modal.style.display = "block";
        modal.style.opacity = "1";
        modal.style.visibility = "visible";
        document.body.style.overflow = "hidden"; // 禁止滾動
    };

    // 關閉密碼重設模態框
    function closePasswordResetModal() {
        const modal = document.getElementById("password-reset-modal");
        if (modal) {
            modal.classList.remove("active");
            modal.style.opacity = "0";
            modal.style.visibility = "hidden";
            setTimeout(() => modal.style.display = "none", 300); // 延遲隱藏模態框
            document.body.style.overflow = ""; // 恢復滾動
        }
    }

    // 監聽關閉模態框的按鈕事件
    document.getElementById("close-reset-modal")?.addEventListener("click", closePasswordResetModal);
    document.getElementById("cancel-reset")?.addEventListener("click", closePasswordResetModal);
});

// 控制頁面訪問權限
firebase.auth().onAuthStateChanged((user) => {
    const publicPages = ["/index.html", "/login.html", "/members-only.html", "/payment.html", "/pricing.html"];
    const freePages = ["/dashboard.html", "/account.html", "/lesson.html"];
    const paidPages = ["/success.html"];
    const currentPage = window.location.pathname;

    if (publicPages.includes(currentPage)) return;

    if (freePages.includes(currentPage) && !user) {
        window.location.href = "/login.html";
        return;
    }

    if (paidPages.includes(currentPage) && (!user || user.role !== "paid")) {
        window.location.href = "/payment.html";
        return;
    }

    if (!user) {
        window.location.href = "/login.html";
    }
});


// 在 DOMContentLoaded 事件中檢查訪問權限
document.addEventListener("DOMContentLoaded", checkAccess);