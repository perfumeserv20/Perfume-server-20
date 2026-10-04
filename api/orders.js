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

    const result = await pool.query(
      `
        INSERT INTO orders
        (
          id,
          user_name,
          items,
          total,
          status,
          email
        )
        VALUES
        ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          user_name,
          items,
          total,
          status,
          email,
          created_at
      `,
      [
        orderId,
        name,
        JSON.stringify(orderItems),
        total.toFixed(2),
        "aguardando_pagamento",
        email
      ]
    );

    return res.status(200).json({
      id: result.rows[0].id,
      userName: result.rows[0].user_name,
      email: result.rows[0].email,
      items: result.rows[0].items,
      total: Number(result.rows[0].total),
      status: result.rows[0].status,
      createdAt: result.rows[0].created_at
    });

  } catch (error) {

    console.error(
      "ERRO AO SALVAR PEDIDO:",
      error
    );

    return res.status(500).json({
      error: "Erro ao salvar pedido.",
      details: error.message
    });

  }

};
