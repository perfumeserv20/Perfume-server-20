const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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

async function createTable() {

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGINT PRIMARY KEY,
      user_name TEXT NOT NULL,
      email TEXT,
      items JSONB NOT NULL,
      total NUMERIC(10,2) NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS email TEXT
  `);
}

module.exports = async (req, res) => {

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Método não permitido"
    });

  }

  try {

    await createTable();

    const {
      name,
      email,
      items
    } = req.body || {};

    if (!name) {

      return res.status(400).json({
        error: "Digite seu nome."
      });

    }

    if (!email) {

      return res.status(400).json({
        error: "Digite seu e-mail."
      });

    }

    if (!email.includes("@")) {

      return res.status(400).json({
        error: "Digite um e-mail válido."
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

      const product =
        products.find(
          product =>
            product.id === Number(item.id)
        );

      const quantity =
        Math.max(
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

      userName:
        String(name).trim(),

      email:
        String(email).trim(),

      items:
        cleanItems,

      total,

      status:
        "aguardando_pagamento",

      createdAt:
        new Date().toISOString()

    };

    await pool.query(
      `
        INSERT INTO orders
        (
          id,
          user_name,
          email,
          items,
          total,
          status,
          created_at
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        order.id,
        order.userName,
        order.email,
        JSON.stringify(order.items),
        order.total,
        order.status,
        order.createdAt
      ]
    );

    return res.status(200).json(order);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        "Erro ao salvar o pedido."
    });

  }

};
