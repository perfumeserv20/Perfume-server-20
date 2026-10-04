const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {

  try {

    const result = await pool.query(`
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
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
      RETURNING *
    `, [
      Date.now(),
      "TESTE",
      JSON.stringify([
        {
          id: 1,
          name: "50K",
          price: 15,
          qty: 1
        }
      ]),
      15,
      "aguardando_pagamento",
      "teste@teste.com"
    ]);

    return res.status(200).json({
      ok: true,
      pedido: result.rows[0]
    });

  } catch (error) {

    console.error("ERRO INSERT:", error);

    return res.status(500).json({
      ok: false,
      erro: error.message,
      codigo: error.code,
      detalhe: error.detail,
      tabela: error.table,
      coluna: error.column
    });

  }

};
