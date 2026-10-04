const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


module.exports = async (req, res) => {

  if (req.method !== "PUT") {

    return res.status(405).json({
      error: "Método não permitido"
    });

  }


  try {

    const {
      id,
      status
    } = req.body || {};


    if (!id || !status) {

      return res.status(400).json({
        error: "ID e status são obrigatórios."
      });

    }


    const allowedStatuses = [
      "aguardando_pagamento",
      "pago",
      "enviado",
      "concluido"
    ];


    if (!allowedStatuses.includes(status)) {

      return res.status(400).json({
        error: "Status inválido."
      });

    }


    const result = await pool.query(
      `
        UPDATE orders

        SET status = $1

        WHERE id = $2

        RETURNING
          id,
          user_name,
          items,
          total,
          status,
          created_at
      `,
      [
        status,
        id
      ]
    );


    if (result.rows.length === 0) {

      return res.status(404).json({
        error: "Pedido não encontrado."
      });

    }


    return res.status(200).json(
      result.rows[0]
    );


  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Erro ao atualizar pedido."
    });

  }

};
