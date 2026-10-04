const { Pool } = require("pg");
const crypto = require("crypto");

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
}

async function createPix(order) {

  const idempotencyKey =
    crypto.randomUUID();

  const response = await fetch(
    "https://api.mercadopago.com/v1/orders",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        "Authorization":
          `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,

        "X-Idempotency-Key":
          idempotencyKey
      },

      body: JSON.stringify({

        type: "online",

        total_amount:
          Number(order.total).toFixed(2),

        external_reference:
          String(order.id),

        processing_mode:
          "automatic",

        transactions: {

          payments: [

            {

              amount:
                Number(order.total).toFixed(2),

              payment_method: {

                id: "pix",

                type: "bank_transfer"

              }

            }

          ]

        },

        payer: {

          email:
            order.email

        }

      })
    }
  );

  const data =
    await response.json();

  if (!response.ok) {

    console.error(
      "Erro Mercado Pago:",
      data
    );

    throw new Error(
      "Não foi possível criar o Pix."
    );
  }

  const payment =
    data?.transactions?.payments?.[0];

  const paymentMethod =
    payment?.payment_method;

  return {

    mercadoPagoOrderId:
      data.id || null,

    paymentId:
      payment?.id || null,

    qrCode:
      paymentMethod?.qr_code || null,

    qrCodeBase64:
      paymentMethod?.qr_code_base64 || null,

    ticketUrl:
      paymentMethod?.ticket_url || null

  };
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

      id:
        Date.now(),

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

    const pix =
      await createPix(order);

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
        pix.mercadoPagoOrderId,
        pix.paymentId,
        pix.qrCode,
        pix.qrCodeBase64,
        pix.ticketUrl,
        order.id
      ]
    );

    return res.status(200).json({

      id:
        order.id,

      userName:
        order.userName,

      email:
        order.email,

      items:
        order.items,

      total:
        order.total,

      status:
        order.status,

      pix: {

        orderId:
          pix.mercadoPagoOrderId,

        paymentId:
          pix.paymentId,

        qrCode:
          pix.qrCode,

        qrCodeBase64:
          pix.qrCodeBase64,

        ticketUrl:
          pix.ticketUrl

      }

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        error.message ||
        "Erro ao criar o pedido e o Pix."
    });

  }

};
