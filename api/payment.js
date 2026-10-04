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
      orderId
    } = req.body || {};

    if (!orderId) {
      return res.status(400).json({
        error: "ID do pedido é obrigatório."
      });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          user_name,
          total,
          status
        FROM orders
        WHERE id = $1
      `,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Pedido não encontrado."
      });
    }

    const order = result.rows[0];

    const response = await fetch(
      "https://api.mercadopago.com/v1/orders",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          "X-Idempotency-Key":
            String(order.id)
        },

        body: JSON.stringify({
          type: "online",
          total_amount: Number(order.total).toFixed(2),
          external_reference:
            String(order.id),

          transactions: {
            payments: [
              {
                amount:
                  Number(order.total).toFixed(2)
              }
            ]
          },

          processing_mode: "automatic",

          payer: {
            email:
              "cliente@exemplo.com"
          }
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      console.error(
        "Mercado Pago:",
        data
      );

      return res.status(response.status).json({
        error:
          "Não foi possível criar o pagamento.",
        details: data
      });
    }

    return res.status(200).json(data);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        "Erro ao criar pagamento Pix."
    });

  }

};
