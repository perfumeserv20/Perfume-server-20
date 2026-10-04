const products = [
  {
    id: 1,
    name: "50K DINHEIRO SERV 20",
    price: 15,
    stock: 10
  },
  {
    id: 2,
    name: "100K DINHEIRO SERV 20",
    price: 30,
    stock: 10
  },
  {
    id: 3,
    name: "200K DINHEIRO SERV 20",
    price: 60,
    stock: 10
  }
];


module.exports = (req, res) => {

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Método não permitido"
    });

  }


  const {
    name,
    items
  } = req.body || {};


  if (!name) {

    return res.status(400).json({
      error: "Digite seu nome."
    });

  }


  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {

    return res.status(400).json({
      error: "Carrinho vazio."
    });

  }


  const cleanItems = [];

  let total = 0;


  for (const item of items) {

    const product = products.find(
      product =>
        product.id === Number(item.id)
    );


    const quantity = Math.max(
      0,
      Math.floor(
        Number(item.qty) || 0
      )
    );


    if (!product || quantity < 1) {

      return res.status(400).json({
        error: "Produto inválido."
      });

    }


    if (quantity > product.stock) {

      return res.status(400).json({
        error:
          `Estoque insuficiente: ${product.name}`
      });

    }


    cleanItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: quantity
    });


    total +=
      product.price * quantity;

  }


  const order = {

    id: Date.now(),

    userId: null,

    userName: String(name),

    items: cleanItems,

    total,

    status: "aguardando_pagamento",

    createdAt:
      new Date().toISOString()

  };


  return res.status(200).json(order);

};
