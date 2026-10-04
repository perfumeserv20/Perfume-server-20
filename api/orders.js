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
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `);

    return res.status(200).json({
      ok: true,
      colunas: result.rows
    });

  } catch (error) {

    console.error("ERRO:", error);

    return res.status(500).json({
      ok: false,
      erro: error.message
    });

  }

};
