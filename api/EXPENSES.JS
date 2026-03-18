// api/expenses.js
import pool, { initDatabase, testConnection } from './DB-CONFIG.JS';

// Khởi tạo database khi start
initDatabase().catch(console.error);

export default async function handler(req, res) {
  // Set charset cho response
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Kiểm tra kết nối database
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Không thể kết nối đến database');
    }

    switch (req.method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'POST':
        await handlePost(req, res);
        break;
      case 'DELETE':
        await handleDelete(req, res);
        break;
      default:
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Lỗi server' 
    });
  }
}

// GET: Lấy danh sách chi phí
async function handleGet(req, res) {
  const { month, year, category, limit = 100, page = 1 } = req.query;
  const offset = (page - 1) * limit;

 let query = `
  SELECT 
    e.*, 
    COALESCE(c.name, 'Khác') as category_name, 
    COALESCE(c.icon, 'fa-tag') as category_icon, 
    COALESCE(c.color, '#6c757d') as category_color
  FROM expenses e
  LEFT JOIN categories c ON e.category = c.code
  WHERE 1=1
`;
  
  const params = [];

  // Lọc theo tháng/năm
  if (month && year) {
    query += ` AND MONTH(e.date) = ? AND YEAR(e.date) = ?`;
    params.push(month, year);
  }

  // Lọc theo danh mục
  if (category) {
    query += ` AND e.category = ?`;
    params.push(category);
  }

  query += ` ORDER BY e.date DESC, e.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const [rows] = await pool.query(query, params);

  // Tính tổng số bản ghi
  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total FROM expenses WHERE 1=1 ${category ? 'AND category = ?' : ''}`,
    category ? [category] : []
  );

  // Tính tổng chi phí theo danh mục
  const [categoryStats] = await pool.query(`
    SELECT 
      e.category,
      c.name as category_name,
      c.icon,
      c.color,
      COUNT(*) as count,
      SUM(e.amount) as total_amount
    FROM expenses e
    LEFT JOIN categories c ON e.category = c.code
    GROUP BY e.category, c.name, c.icon, c.color
    ORDER BY total_amount DESC
  `);

  res.json({
    success: true,
    data: {
      expenses: rows,
      stats: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit),
        categoryStats
      }
    }
  });
}

// POST: Thêm chi phí mới
async function handlePost(req, res) {
  const { date, vendor, total, category, description, raw_text } = req.body;

  // Validate dữ liệu
  if (!date || !total || !category) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng nhập đầy đủ thông tin: ngày, số tiền, danh mục'
    });
  }

  // Kiểm tra category có tồn tại không
  const [categoryCheck] = await pool.query(
    'SELECT code FROM categories WHERE code = ?',
    [category]
  );

  if (categoryCheck.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Danh mục không hợp lệ'
    });
  }

  const [result] = await pool.query(`
    INSERT INTO expenses (date, vendor, amount, category, description, raw_text)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    date,
    vendor || 'Không xác định',
    parseFloat(total),
    category,
    description || '',
    raw_text || ''
  ]);

  // Lấy dữ liệu vừa thêm
  const [newExpense] = await pool.query(
    `SELECT e.*, c.name as category_name, c.icon, c.color
     FROM expenses e
     LEFT JOIN categories c ON e.category = c.code
     WHERE e.id = ?`,
    [result.insertId]
  );

  res.json({
    success: true,
    message: 'Thêm chi phí thành công',
    data: newExpense[0]
  });
}

// DELETE: Xóa chi phí
async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Thiếu ID chi phí'
    });
  }

  const [result] = await pool.query('DELETE FROM expenses WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy chi phí'
    });
  }

  res.json({
    success: true,
    message: 'Xóa chi phí thành công'
  });
}