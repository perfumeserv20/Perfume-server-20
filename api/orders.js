const { Pool } = require("pg");
const crypto = require("crypto");

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

    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS email TEXT
    `);

    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS mercado_pago_order_id TEXT
    `);

    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT
    `);

    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS pix_qr_code TEXT
    `);

    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS pix_qr_code_base64 TEXT
    `);

    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS pix_ticket_url TEXT
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
        qty
      });
    }

    const orderId =
      Date.now();

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

    const accessToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {

      return res.status(500).json({
        error:
          "MERCADOPAGO_ACCESS_TOKEN não está configurado na Vercel."
      });

    }

    const idempotencyKey =
      crypto.randomUUID();

    const mpResponse =
      await fetch(
        "https://api.mercadopago.com/v1/orders",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${accessToken}`,

            "X-Idempotency-Key":
              idempotencyKey
          },

          body: JSON.stringify({

            type: "online",

            total_amount:
              total.toFixed(2),

            external_reference:
              String(orderId),

            processing_mode:
              "automatic",

            transactions: {

              payments: [

                {

                  amount:
                    total.toFixed(2),

                  payment_method: {

                    id: "pix",

                    type: "bank_transfer"

                  }

                }

              ]

            },

            payer: {

              email:
                email.trim()

            }

          })
        }
      );

    const mpData =
      await mpResponse.json();

    if (!mpResponse.ok) {

      console.error(
        "ERRO MERCADO PAGO:",
        JSON.stringify(
          mpData,
          null,
          2
        )
      );

      return res.status(400).json({

        error:
          "Não foi possível criar o Pix.",

        mercadoPagoError:
          mpData

      });

    }

    const payment =
      mpData
        ?.transactions
        ?.payments
        ?.[0];

    const paymentMethod =
      payment?.payment_method;

    await pool.query(
      `
        UPDATE orders
        SET
          mercado_pago_order_id = $1,
          mercado_pago_payment_id = $2,
          pix_qr_code = $3,
          pix_qr_code_base64 = $4,
          pix_ticket_url = $5
        WHERE id = $6
      `,
      [
        mpData.id || null,
        payment?.id || null,
        paymentMethod?.qr_code || null,
        paymentMethod?.qr_code_base64 || null,
        paymentMethod?.ticket_url || null,
        orderId
      ]
    );

    return res.status(200).json({

      id:
