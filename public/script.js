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

  const searchInput =
    document.getElementById("search");

  const productsContainer =
    document.getElementById("products");

  if (!searchInput || !productsContainer) {
    return;
  }

  const search =
    searchInput.value.toLowerCase();

  const filtered =
    products.filter(product =>
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

function showPix(paymentData, total) {

  const qrCode =
    paymentData.qrCode;

  const qrCodeBase64 =
    paymentData.qrCodeBase64;

  const existing =
    document.getElementById("pixModal");

  if (existing) {
    existing.remove();
  }

  const modal =
    document.createElement("div");

  modal.id = "pixModal";

  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,.65)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "100";
  modal.style.padding = "20px";
  modal.style.boxSizing = "border-box";

    modal.innerHTML = `
    <div style="
      background:white;
      width:100%;
      max-width:420px;
      max-height:90vh;
      overflow:auto;
      border-radius:20px;
      padding:24px;
      box-sizing:border-box;
      text-align:center;
    ">

      <h2 style="
        margin-top:0;
        margin-bottom:8px;
      ">
        Pagamento via Pix
      </h2>

      <p style="
        color:#666;
        margin-top:0;
      ">
        Escaneie o QR Code para pagar.
      </p>

      <div style="
        font-size:24px;
        font-weight:bold;
        margin:15px 0 20px;
      ">
        ${money(Number(total))}
      </div>

      ${
        qrCodeBase64
          ? `
            <img
              src="data:image/png;base64,${qrCodeBase64}"
              alt="QR Code Pix"
              style="
                width:260px;
                height:260px;
                object-fit:contain;
                display:block;
                margin:20px auto;
              "
            >
          `
          : `
            <p style="
              color:#c00;
              margin:20px 0;
            ">
              QR Code não disponível.
            </p>
          `
      }

      <p style="
        font-weight:bold;
        margin-bottom:8px;
      ">
        Pix Copia e Cola
      </p>

      <textarea
        id="pixCopyCode"
        readonly
        style="
          width:100%;
          min-height:100px;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ddd;
          border-radius:10px;
          resize:none;
          font-size:12px;
        "
      >${qrCode || ""}</textarea>

      <button
        id="copyPixButton"
        style="
          width:100%;
          margin-top:12px;
          padding:14px;
          border:0;
          border-radius:10px;
          background:#111;
          color:white;
          font-size:16px;
          font-weight:bold;
          cursor:pointer;
        "
      >
        Copiar Pix
      </button>

      <button
        id="closePixButton"
        style="
          width:100%;
          margin-top:10px;
          padding:12px;
          border:0;
          background:transparent;
          color:#666;
          cursor:pointer;
        "
      >
        Fechar
      </button>

    </div>
  `;

  document.body.appendChild(modal);

  const copyButton =
    document.getElementById(
      "copyPixButton"
    );

  if (copyButton) {

    copyButton.onclick =
      async function () {

        try {

          await navigator.clipboard.writeText(
            qrCode || ""
          );

          copyButton.textContent =
            "Pix copiado!";

          setTimeout(() => {

            copyButton.textContent =
              "Copiar Pix";

          }, 2000);

        } catch (error) {

          const textarea =
            document.getElementById(
              "pixCopyCode"
            );

          if (textarea) {

            textarea.select();

            document.execCommand(
              "copy"
            );

            copyButton.textContent =
              "Pix copiado!";

          }

        }
      };
  }

  const closeButton =
    document.getElementById(
      "closePixButton"
    );

  if (closeButton) {

    closeButton.onclick =
      function () {

        modal.remove();

      };
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

    const paymentResponse =
      await fetch(
        "/api/payment",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            orderId: data.id,
            email: email
          })
        }
      );

    const paymentData =
      await paymentResponse.json();

    if (!paymentResponse.ok) {

      console.error(
        "Erro Pix:",
        paymentData
      );

      alert(
        paymentData.error ||
        "Pedido criado, mas não foi possível gerar o Pix."
      );

      return;
    }

    closeCheckout();

    showPix(
      paymentData,
      data.total
    );

    cart = [];

    updateCart();

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
