window.initPasswordReset = function () {
  document.getElementById("close-reset-modal").addEventListener("click", closeModal);
  document.getElementById("submit-reset").addEventListener("click", async () => {
    const email = document.getElementById("reset-email").value;
    await firebase.auth().sendPasswordResetEmail(email);
  });
};
