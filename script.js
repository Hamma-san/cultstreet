const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const freight = 24.90;
const products = window.CULT_PRODUCTS || [];

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem("cult-cart") || "[]");
        return Array.isArray(cart) ? cart : [];
    } catch {
        return [];
    }
}

function setCart(cart) {
    localStorage.setItem("cult-cart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((element) => {
        element.textContent = String(count);
    });
}

function findProduct(id) {
    return products.find((product) => product.id === id);
}

function renderCatalog() {
    document.querySelectorAll("[data-catalog]").forEach((grid) => {
        const line = grid.dataset.catalog;
        grid.innerHTML = products
            .filter((product) => product.line === line)
            .map((product) => `
                <article class="product-card ${product.line === "Black Label" ? "luxury" : ""}">
                    <a href="produto.html?id=${product.id}">
                        <img src="${product.image}" alt="${product.name}">
                    </a>
                    <div class="info">
                        <span>${product.line.toUpperCase()}</span>
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <strong>${money.format(product.price)}</strong>
                        <em>RESTAM ${product.remaining} PEÇAS</em>
                        <a href="produto.html?id=${product.id}">VER PEÇA</a>
                    </div>
                </article>
            `)
            .join("");
    });
}

function renderProductPage() {
    const container = document.querySelector("[data-product-detail]");
    if (!container) return;

    const id = new URLSearchParams(window.location.search).get("id") || "black-001";
    const product = findProduct(id) || products[0];

    document.title = `CULT | ${product.name}`;
    container.innerHTML = `
        <div class="product-photo">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-copy">
            <span>${product.line}</span>
            <h1>${product.name}</h1>
            <p>${product.details}</p>
            <strong>${money.format(product.price)}</strong>

            <label>Tamanho</label>
            <div class="size-options" data-size-options>
                <button type="button" data-size="P">P</button>
                <button type="button" data-size="M" class="selected">M</button>
                <button type="button" data-size="G">G</button>
                <button type="button" data-size="GG">GG</button>
            </div>

            <label>Quantidade</label>
            <input class="qty-input" type="number" min="1" value="1" data-quantity>

            <button class="btn btn-light" type="button" data-add-cart="${product.id}">ADICIONAR AO CARRINHO</button>
            <a class="btn btn-dark" href="checkout.html">IR PARA CHECKOUT</a>

            <div class="detail-list">
                <p><b>Linha:</b> ${product.line}</p>
                <p><b>Quantidade restante:</b> ${product.remaining} peças</p>
                <p><b>Detalhes:</b> ${product.line === "Black Label" ? "Heavyweight 280g, edição numerada e acabamento premium." : "Algodão 24.1, modelagem oversized e conforto diário."}</p>
            </div>
        </div>
    `;
}

function addToCart(productId) {
    const product = findProduct(productId);
    const selectedSize = document.querySelector("[data-size-options] .selected")?.dataset.size || "M";
    const quantity = Math.max(1, Math.floor(Number(document.querySelector("[data-quantity]")?.value || 1)));
    const cart = getCart();
    const existing = cart.find((item) => item.id === productId && item.size === selectedSize);

    if (!product) return;

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id: productId, size: selectedSize, quantity });
    }

    setCart(cart);
    alert("Peça CultStreet adicionada ao carrinho.");
}

function renderCheckout() {
    const list = document.querySelector("[data-cart-list]");
    const totals = document.querySelector("[data-cart-totals]");
    if (!list || !totals) return;

    const cart = getCart();

    if (!cart.length) {
        list.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`;
        totals.innerHTML = totalMarkup(0);
        return;
    }

    const validCart = cart.filter((item) => findProduct(item.id));
    if (validCart.length !== cart.length) {
        setCart(validCart);
    }

    list.innerHTML = validCart.map((item, index) => {
        const product = findProduct(item.id);
        return `
            <article class="cart-row">
                <img src="${product.image}" alt="${product.name}">
                <div>
                    <span>${product.line}</span>
                    <h2>${product.name}</h2>
                    <p>Tamanho: ${item.size} | Quantidade: ${item.quantity}</p>
                    <strong>${money.format(product.price * item.quantity)}</strong>
                </div>
                <button type="button" data-remove="${index}">Remover</button>
            </article>
        `;
    }).join("");

    const subtotal = validCart.reduce((sum, item) => {
        const product = findProduct(item.id);
        return sum + product.price * item.quantity;
    }, 0);

    totals.innerHTML = totalMarkup(subtotal);
}

function totalMarkup(subtotal) {
    const shipping = subtotal > 0 ? freight : 0;
    return `
        <div><span>Subtotal</span><strong>${money.format(subtotal)}</strong></div>
        <div><span>Frete</span><strong>${money.format(shipping)}</strong></div>
        <div class="grand-total"><span>Total</span><strong>${money.format(subtotal + shipping)}</strong></div>
    `;
}

document.addEventListener("click", (event) => {
    const sizeButton = event.target.closest("[data-size]");
    if (sizeButton) {
        document.querySelectorAll("[data-size]").forEach((button) => button.classList.remove("selected"));
        sizeButton.classList.add("selected");
    }

    const addButton = event.target.closest("[data-add-cart]");
    if (addButton) {
        addToCart(addButton.dataset.addCart);
    }

    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) {
        const cart = getCart();
        cart.splice(Number(removeButton.dataset.remove), 1);
        setCart(cart);
        renderCheckout();
    }
});

document.querySelector("[data-checkout-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const cart = getCart();
    if (!cart.length) {
        alert("Seu carrinho está vazio.");
        return;
    }

    const button = event.currentTarget.querySelector('button[type="submit"]');
    const formData = new FormData(event.currentTarget);
    button.disabled = true;
    button.textContent = "ABRINDO MERCADO PAGO...";

    try {
        const response = await fetch("/create-preference", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: cart.map(({ id, size, quantity }) => ({ id, size, quantity })),
                payer: { email: formData.get("email") }
            })
        });
        const data = await response.json();

        if (!response.ok || !data.init_point) {
            throw new Error(data.error || "Não foi possível iniciar o pagamento.");
        }

        window.location.href = data.init_point;
    } catch (error) {
        alert(error.message);
        button.disabled = false;
        button.textContent = "FINALIZAR COMPRA";
    }
});

document.querySelector("[data-contact-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    alert("Mensagem recebida. A equipe CultStreet entrará em contato.");
    event.currentTarget.reset();
});

updateCartCount();
renderCatalog();
renderProductPage();
renderCheckout();
