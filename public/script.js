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
  const search = document
    .getElementById("search")
    .value
    .toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search)
  );

  document.getElementById("products").innerHTML =
    filtered.map(product => `
      <article class="card">

        <div class="product-image">
          <img
            src="${product.image}"
            alt="${product.name}"
          >
        </div>

        <h3>${product.name}</h3>

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
  const product = products.find(
    product => product.id === id
  );

  cart.push(product);

  updateCart();
  openCart();
}

function updateCart() {
  document.getElementById("cartCount").textContent =
    cart.length;

  const container =
    document.getElementById("cartItems");

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

    container.innerHTML = cart.map(
      (product, index) => `

        <div class="cart-item">

          <div class="mini-image">
            <img
              src="${product.image}"
              alt="${product.name}"
            >
          </div>

          <div>
            <b>${product.name}</b>
            <p>${money(product.price)}</p>
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

  const total = cart.reduce(
    (sum, product) =>
      sum + product.price,
    0
  );

  document.getElementById("total").textContent =
    money(total);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function openCart() {
  document
    .getElementById("cart")
    .classList
    .add("active");

  document
    .getElementById("overlay")
    .classList
    .add("active");
}

function closeCart() {
  document
    .getElementById("cart")
    .classList
    .remove("active");

  document
    .getElementById("overlay")
    .classList
    .remove("active");
}

function checkout() {

  if (cart.length === 0) {

    alert(
      "Adicione algum produto ao carrinho primeiro."
    );

    return;
  }

  alert(
    "Checkout preparado!"
  );
}

renderProducts();
updateCart();
