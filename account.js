function showMessage(form, message, isError = false) {
    const element = form.querySelector("[data-form-message]");
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("error", isError);
}

async function sendJson(url, method, body) {
    const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = response.status === 204 ? {} : await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível concluir.");
    return data;
}

document.querySelector("[data-login-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
        const { user } = await sendJson("/api/auth/login", "POST", values);
        window.location.href = user.role === "admin" ? "admin.html" : "perfil.html";
    } catch (error) {
        showMessage(form, error.message, true);
    }
});

document.querySelector("[data-register-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
        await sendJson("/api/auth/register", "POST", Object.fromEntries(new FormData(form)));
        window.location.href = "perfil.html";
    } catch (error) {
        showMessage(form, error.message, true);
    }
});

async function loadProfile() {
    const form = document.querySelector("[data-profile-form]");
    if (!form) return;
    try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return window.location.href = "login.html";
        const { user } = await response.json();
        form.elements.name.value = user.name;
        form.elements.email.value = user.email;
        form.elements.phone.value = user.phone || "";
        if (user.role === "admin") document.querySelector("[data-admin-link]")?.classList.remove("is-hidden");
    } catch {
        window.location.href = "login.html";
    }
}

document.querySelector("[data-profile-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
        await sendJson("/api/profile", "PUT", Object.fromEntries(new FormData(form)));
        showMessage(form, "Perfil atualizado.");
    } catch (error) {
        showMessage(form, error.message, true);
    }
});

document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "index.html";
    });
});

loadProfile();
