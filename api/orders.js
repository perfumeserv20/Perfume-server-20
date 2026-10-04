const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {

    const {
      name,
      email,
      items
    } = req.body || {};

    if (!name) {
      return res.status(400).json({
        error: "Nome é obrigatório."
      });
    }

    if (!email) {
      return res.status(400).json({
        error: "E-mail é obrigatório."
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Carrinho vazio."
      });
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT PRIMARY KEY,
        user_name TEXT NOT NULL,
        email TEXT,
        items JSONB NOT NULL,
        total NUMERIC(10,2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'aguardando_pagamento',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const products = {
      1: {
        name: "50K",
        price: 15
      },
      2: {
        name: "100K",
        price: 30
      },
      3: {
        name: "200K",
        price: 60
      }
    };

    let total = 0;
    const orderItems = [];

    for (const item of items) {

      const product = products[item.id];

      if (!product) {
        return res.status(400).json({
          error: `Produto ${item.id} não encontrado.`
        });
      }

      const qty = Number(item.qty);

      if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({
          error: "Quantidade inválida."
        });
      }

      total += product.price * qty;

      orderItems.push({
        id: item.id,
        name: product.name,
        price: product.price,
        qty: qty
      });
    }

    const orderId = Date.now();

    await pool.query(
      `
        INSERT INTO orders
        (
          id,
          user_name,
          email,
          items,
          total,
          status
        )
        VALUES
        ($1, $2, $3, $4, $5, $6)
      `,
      [
        orderId,
        name,
        email,
        JSON.stringify(orderItems),
        total.toFixed(2),
        "aguardando_pagamento"
      ]
    );

    return res.status(200).json({

      id: orderId,

      userName: name,

      email: email,

      items: orderItems,

      total: total,

      status: "aguardando_pagamento"

    });

  } catch (error) {

    console.error(
      "ERRO ORDERS:",
      error
    );

    return res.status(500).json({

      error: "Erro ao salvar pedido.",

      details: error.message

    });

  }

};
