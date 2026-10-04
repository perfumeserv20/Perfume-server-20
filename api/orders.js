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
          error:
            `Produto ${item.id} não encontrado.`
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

    /*
      SALVA O PEDIDO
    */

    await pool.query(
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

    /*
      TOKEN DO MERCADO PAGO
    */

    const accessToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {

      return res.status(500).json({
        error:
          "MERCADOPAGO_ACCESS_TOKEN não está configurado na Vercel."
      });

    }

    /*
      CRIA O PIX
    */

    const idempotencyKey =
      crypto.randomUUID();

    const mpResponse = await fetch(
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

    /*
      MOSTRA O ERRO COMPLETO
    */

    if (!mpResponse.ok) {

      console.error(
        "ERRO MERCADO PAGO:",
        mpData
      );

      return res.status(400).json({

        error:
          "MERCADO PAGO RECUSOU O PIX:\n\n" +
          JSON.stringify(
            mpData,
            null,
            2
          )

      });

    }

    /*
      DADOS DO PAGAMENTO
    */

    const payment =
      mpData
        ?.transactions
        ?.payments
        ?.[0];

    const paymentMethod =
      payment?.payment_method;

    /*
      SALVA OS DADOS DO PIX
    */

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

    /*
      RETORNA O PIX
    */

    return res.status(200).json({

      id:
        orderId,

      userName:
        name,

      email:
        email,

      items:
        orderItems,

      total:
        total,

      status:
        "aguardando_pagamento",

      pix: {

        orderId:
          mpData.id || null,

        paymentId:
          payment?.id || null,

        status:
          payment?.status || null,

        statusDetail:
          payment?.status_detail || null,

        qrCode:
          paymentMethod?.qr_code || null,

        qrCodeBase64:
          paymentMethod?.qr_code_base64 || null,

        ticketUrl:
          paymentMethod?.ticket_url || null

      }

    });

  } catch (error) {

    console.error(
      "ERRO GERAL:",
      error
    );

    return res.status(500).json({

      error:
        "Erro ao criar pedido:\n\n" +
        error.message

    });

  }

};
