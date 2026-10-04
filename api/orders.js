const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT NOW() AS agora"
    );

    return res.status(200).json({
      ok: true,
      banco: "conectado",
      horario: result.rows[0].agora
    });

  } catch (error) {

    console.error("ERRO NEON:", error);

    return res.status(500).json({
      ok: false,
      erro: error.message
    });

  }

};
