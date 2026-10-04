const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {

  try {

    await pool.query(`
      ALTER TABLE orders
      ALTER COLUMN created_at
      SET DEFAULT NOW()
    `);

    return res.status(200).json({
      ok: true,
      message: "created_at corrigido"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      ok: false,
      erro: error.message
    });

  }

};
