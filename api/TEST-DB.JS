// api/test-db.js
import pool, { testConnection, initDatabase } from './DB-CONFIG.JS';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Test kết nối
    const connected = await testConnection();
    
    if (!connected) {
      throw new Error('Không thể kết nối database');
    }

    // Khởi tạo database
    await initDatabase();

    // Kiểm tra charset
    const [charset] = await pool.query('SHOW VARIABLES LIKE "character_set_%"');
    
    // Kiểm tra bảng
    const [tables] = await pool.query('SHOW TABLES');
    
    // Đếm số records
    const [count] = await pool.query('SELECT COUNT(*) as total FROM expenses');
    
    // Test insert và select tiếng Việt
    const testVendor = 'Cửa hàng Điện máy Xanh - Chi nhánh Quận 1';
    const testDesc = 'Mua tủ lạnh Samsung và máy giặt LG - ưu đãi tháng 12';
    
    // Thử insert test
    const [insertResult] = await pool.query(`
      INSERT INTO expenses (date, vendor, amount, category, description) 
      VALUES (CURDATE(), ?, 15000000, 'utilities', ?)
    `, [testVendor, testDesc]);

    // Lấy lại để kiểm tra
    const [testRow] = await pool.query(
      'SELECT * FROM expenses WHERE id = ?',
      [insertResult.insertId]
    );

    // Xóa test data
    await pool.query('DELETE FROM expenses WHERE id = ?', [insertResult.insertId]);

    res.json({
      success: true,
      message: '✅ Kết nối database thành công!',
      data: {
        database: process.env.DB_NAME,
        connected: true,
        charset: charset,
        tables: tables.map(t => Object.values(t)[0]),
        totalRecords: count[0].total,
        vietnameseTest: {
          vendor: testRow[0]?.vendor === testVendor ? '✅ OK' : '❌ Failed',
          description: testRow[0]?.description === testDesc ? '✅ OK' : '❌ Failed',
          data: testRow[0]
        }
      }
    });

  } catch (error) {
    console.error('❌ Test DB Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Kiểm tra lại thông tin kết nối trong file .env'
    });
  }
}