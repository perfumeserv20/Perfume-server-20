const products = [
  {
    id: 1,
    name: "50K",
    price: 15,
    image: "50k.png"
  },
  {
    id: 2,
    name: "100K",
    price: 30,
    image: "100k.png"
  },
  {
    id: 3,
    name: "200K",
    price: 60,
    image: "200k.png"
  }
];

let cart = [];

function money(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function renderProducts() {
  const searchInput = document.getElementById("search");
  const productsContainer = document.getElementById("products");

  if (!searchInput || !productsContainer) {
    return;
  }

  const search =
    searchInput.value.toLowerCase();

  const filtered = products.filter(product =>
    product.name
      .toLowerCase()
      .includes(search)
  );

  productsContainer.innerHTML =
    filtered.map(product => `
      <article class="card">

        <div class="product-image">
          <img
            src="${product.image}"
            alt="${product.name}"
          >
        </div>

        <h3>
          ${product.name}
        </h3>

        <p class="price">
          ${money(product.price)}
        </p>

        <button
          class="add-button"
          onclick="addToCart(${product.id})">

          Adicionar ao carrinho

        </button>

      </article>
    `).join("");
}

function addToCart(id) {

  const product =
    products.find(
      product =>
        product.id === id
    );

  if (!product) {
    return;
  }

  cart.push(product);

  updateCart();

  openCart();
}

function updateCart() {

  const cartCount =
    document.getElementById("cartCount");

  const container =
    document.getElementById("cartItems");

  if (cartCount) {
    cartCount.textContent =
      cart.length;
  }

  if (!container) {
    return;
  }

  if (cart.length === 0) {

    container.innerHTML = `
      <p style="
        text-align:center;
        color:#789;
        margin-top:50px;
      ">
        Seu carrinho está vazio.
      </p>
    `;

  } else {

    container.innerHTML =
      cart.map(
        (product, index) => `
          <div class="cart-item">

            <div class="mini-image">

              <img
                src="${product.image}"
                alt="${product.name}"
              >

            </div>

            <div>

              <b>
                ${product.name}
              </b>

              <p>
                ${money(product.price)}
              </p>

            </div>

            <button
              class="remove"
              onclick="removeFromCart(${index})">

              ✕

            </button>

          </div>
        `
      ).join("");
  }

  const total =
    cart.reduce(
      (sum, product) =>
        sum + product.price,
      0
    );

  const totalElement =
    document.getElementById("total");

  if (totalElement) {
    totalElement.textContent =
      money(total);
  }
}

function removeFromCart(index) {

  cart.splice(index, 1);

  updateCart();
}

function openCart() {

  const cartElement =
    document.getElementById("cart");

  const overlay =
    document.getElementById("overlay");

  if (cartElement) {
    cartElement.classList.add("active");
  }

  if (overlay) {
    overlay.classList.add("active");
  }
}

function closeCart() {

  const cartElement =
    document.getElementById("cart");

  const overlay =
    document.getElementById("overlay");

  if (cartElement) {
    cartElement.classList.remove("active");
  }

  if (overlay) {
    overlay.classList.remove("active");
  }
}

function checkout() {

  if (cart.length === 0) {

    alert(
      "Adicione algum produto ao carrinho primeiro."
    );

    return;
  }

  renderCheckout();

  const modal =
    document.getElementById(
      "checkoutModal"
    );

  if (modal) {
    modal.classList.add("active");
  }

  closeCart();
}

function renderCheckout() {

  const container =
    document.getElementById(
      "checkoutItems"
    );

  if (!container) {
    return;
  }

  container.innerHTML =
    cart.map(product => `
      <div style="
        display:flex;
        justify-content:space-between;
        padding:8px 0;
        border-bottom:1px solid #eee;
      ">

        <span>
          ${product.name}
        </span>

        <strong>
          ${money(product.price)}
        </strong>

      </div>
    `).join("");

  const total =
    cart.reduce(
      (sum, product) =>
        sum + product.price,
      0
    );

  const checkoutTotal =
    document.getElementById(
      "checkoutTotal"
    );

  if (checkoutTotal) {
    checkoutTotal.textContent =
      money(total);
  }
}

function closeCheckout() {

  const modal =
    document.getElementById(
      "checkoutModal"
    );

  if (modal) {
    modal.classList.remove("active");
  }
}

async function confirmOrder() {

  const nameElement =
    document.getElementById(
      "customerName"
    );

  const emailElement =
    document.getElementById(
      "customerEmail"
    );

  const name =
    nameElement
      ? nameElement.value.trim()
      : "";

  const email =
    emailElement
      ? emailElement.value.trim()
      : "";

  if (!name) {

    alert("Digite seu nome.");

    return;
  }

  if (!email) {

    alert("Digite seu e-mail.");

    return;
  }

  if (!email.includes("@")) {

    alert("Digite um e-mail válido.");

    return;
  }

  if (cart.length === 0) {

    alert("Seu carrinho está vazio.");

    return;
  }

  const items = [];

  cart.forEach(product => {

    const existing =
      items.find(
        item =>
          item.id === product.id
      );

    if (existing) {

      existing.qty++;

    } else {

      items.push({
        id: product.id,
        qty: 1
      });

    }
  });

  try {

    const response =
      await fetch(
        "/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            name: name,
            email: email,
            items: items
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        data.error ||
        "Não foi possível salvar o pedido."
      );

      return;
    }

    alert(
      "Pedido realizado com sucesso!\n\n" +
      "Número do pedido: " +
      data.id
    );

    cart = [];

    updateCart();

    closeCheckout();

    if (nameElement) {
      nameElement.value = "";
    }

    if (emailElement) {
      emailElement.value = "";
    }

  } catch (error) {

    console.error(error);

    alert(
      "Não foi possível conectar ao servidor."
    );
  }
}

renderProducts();

updateCart();
