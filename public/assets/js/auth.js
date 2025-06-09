// js/auth.js
document.addEventListener("DOMContentLoaded", function () {
    const firebaseConfig = {
        apiKey: "AIzaSyCZs2a35ENke7G8K7pzAMKCY3HOoi-IUcU",
        authDomain: "uxshari-670fd.firebaseapp.com",
        projectId: "uxshari-670fd",
        appId: "1:907540538791:web:ed98ef4ba51c96de43c282",
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    document.getElementById("auth-form")?.addEventListener("submit", handleLogin);
    document.getElementById("google-auth")?.addEventListener("click", handleGoogleLogin);

    async function handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const errorEl = document.getElementById("error");
        errorEl.innerText = "";

        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = "/dashboard.html";
        } catch (err) {
            if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
                try {
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    if (!userCredential.user) {
                        errorEl.innerText = "註冊失敗，請稍後再試。";
                        return;
                    }
                    await db.collection("users").doc(userCredential.user.uid).set({
                        email,
                        role: "free",
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    window.location.href = "/dashboard.html";
                } catch (signupErr) {
                    handleSignupErrors(signupErr, errorEl);
                }
            } else {
                handleSignupErrors(err, errorEl);
            }
        }
    }

    function handleSignupErrors(err, errorEl) {
        if (err.code === "auth/email-already-in-use" || err.code === "auth/account-exists-with-different-credential") {
            errorEl.innerText = "這個 Email 已經有其他登入方式，請用 Google 登入。";
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then(() => window.location.href = "/dashboard.html")
                .catch(err => errorEl.innerText = "Google 登入失敗：" + err.message);
        } else if (err.code === "auth/wrong-password") {
            errorEl.innerText = "密碼錯誤，請重新輸入。";
        } else if (err.code === "auth/invalid-email") {
            errorEl.innerText = "電子郵件格式錯誤。";
        } else {
            errorEl.innerText = err.message;
        }
    }

    function handleGoogleLogin() {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then(async (result) => {
                const user = result.user;
                const providers = user.providerData.map(p => p.providerId);

                if (!providers.includes('password')) {
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
                window.location.href = "/dashboard.html";
            })
            .catch(err => document.getElementById("error").innerText = err.message);
    }

    document.getElementById("submit-reset")?.addEventListener("click", async () => {
        const email = document.getElementById("reset-email").value;
        const errorEl = document.getElementById("error");
        if (!email) return alert("請輸入電子郵件地址！");
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            alert("密碼重設連結已發送到您的電子郵件！");
            closePasswordResetModal();
        } catch (error) {
            alert("發送密碼重設連結失敗：" + error.message);
        }
    });

    window.openPasswordResetModal = () => {
        const modal = document.getElementById("password-reset-modal");
        modal?.classList.add("active");
        modal.style.display = "block";
        modal.style.opacity = "1";
        modal.style.visibility = "visible";
        document.body.style.overflow = "hidden";
    };

    function closePasswordResetModal() {
        const modal = document.getElementById("password-reset-modal");
        if (modal) {
            modal.classList.remove("active");
            modal.style.opacity = "0";
            modal.style.visibility = "hidden";
            setTimeout(() => modal.style.display = "none", 300);
            document.body.style.overflow = "";
        }
    }

    document.getElementById("close-reset-modal")?.addEventListener("click", closePasswordResetModal);
    document.getElementById("cancel-reset")?.addEventListener("click", closePasswordResetModal);
});
