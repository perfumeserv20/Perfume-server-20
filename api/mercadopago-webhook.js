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

    console.log(
      "WEBHOOK MERCADO PAGO:",
      JSON.stringify(req.body)
    );

    const data = req.body || {};

    const mercadoPagoOrderId =
      data?.data?.id;

    if (!mercadoPagoOrderId) {

      return res.status(200).json({
        received: true
      });

    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/orders/${mercadoPagoOrderId}`,
      {
        method: "GET",

        headers: {
          "Authorization":
            `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
        }
      }
    );

    const order =
      await response.json();

    if (!response.ok) {

      console.error(
        "ERRO AO CONSULTAR ORDER:",
        order
      );

      return res.status(200).json({
        received: true
      });
    }

    console.log(
      "ORDER MERCADO PAGO:",
      JSON.stringify(order)
    );

    const externalReference =
      order.external_reference;

    if (!externalReference) {

      return res.status(200).json({
        received: true
      });

    }

    let status =
      null;

    if (
      order.status === "processed" &&
      order.status_detail === "accredited"
    ) {

      status = "pago";

    }

    if (!status) {

      return res.status(200).json({
        received: true
      });

    }

    await pool.query(
      `
        UPDATE orders
        SET
          status = $1,
          mercado_pago_order_id = $2
        WHERE id = $3
      `,
      [
        status,
        mercadoPagoOrderId,
        externalReference
      ]
    );

    console.log(
      "PEDIDO ATUALIZADO PARA PAGO:",
      externalReference
    );

    return res.status(200).json({
      received: true,
      status: status
    });

  } catch (error) {

    console.error(
      "ERRO WEBHOOK:",
      error
    );

    return res.status(200).json({
      received: true
    });

  }

};
