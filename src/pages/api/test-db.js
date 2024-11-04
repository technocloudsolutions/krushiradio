import pool from '../../lib/db';

export default async function handler(req, res) {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    
    const [result] = await connection.query('SELECT 1 as test');
    connection.release();
    
    res.status(200).json({ 
      message: 'Database connection successful',
      result: result[0]
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message
    });
  }
}
