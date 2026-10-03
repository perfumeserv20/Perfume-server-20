const products = [

  {
    id: 1,
    name: "Blue Night",
    price: 89.90
  },

  {
    id: 2,
    name: "Ocean Fresh",
    price: 99.90
  },

  {
    id: 3,
    name: "Royal Blue",
    price: 119.90
  },

  {
    id: 4,
    name: "Blue Intense",
    price: 129.90
  },

  {
    id: 5,
    name: "Night Premium",
    price: 149.90
  },

  {
    id: 6,
    name: "Azure",
    price: 109.90
  },

  {
    id: 7,
    name: "Silver Wave",
    price: 94.90
  },

  {
    id: 8,
    name: "Imperial",
    price: 159.90
  }

];


let cart = [];


function money(value) {

  return value.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


/* MOSTRAR PRODUTOS */

function renderProducts() {

  const search =
    document
      .getElementById("search")
      .value
      .toLowerCase();


  const filtered =
    products.filter(product =>
      product.name
        .toLowerCase()
        .includes(search)
    );


  document
    .getElementById("products")
    .innerHTML = filtered.map(product => `

      <article class="card">

        <div class="product-image">
          ✦
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


/* ADICIONAR */

function addToCart(id) {

  const product =
    products.find(
      product => product.id === id
    );

  cart.push(product);

  updateCart();

  openCart();

}


/* ATUALIZAR CARRINHO */

function updateCart() {

  document
    .getElementById("cartCount")
    .textContent = cart.length;


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

    container.innerHTML =
      cart.map((product,index) => `

        <div class="cart-item">

          <div class="mini-image">
            ✦
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

      `).join("");

  }


  const total =
    cart.reduce(
      (sum, product) =>
        sum + product.price,
      0
    );


  document
    .getElementById("total")
    .textContent = money(total);

}


/* REMOVER */

function removeFromCart(index) {

  cart.splice(index,1);

  updateCart();

}


/* ABRIR */

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


/* FECHAR */

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


/* FINALIZAR */

function checkout() {

  if (cart.length === 0) {

    alert(
      "Adicione algum produto ao carrinho primeiro."
    );

    return;

  }


  alert(
    "Checkout preparado! Na próxima etapa vamos conectar o pagamento."
  );

}


/* INICIAR */

renderProducts();

updateCart();
