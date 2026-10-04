const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {

    const result = await pool.query(`
      SELECT
        id,
        user_name,
        items,
        total,
        status,
        created_at
      FROM orders
      ORDER BY created_at DESC
    `);

    return res.status(200).json(result.rows);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Erro ao buscar pedidos."
    });

  }

};
