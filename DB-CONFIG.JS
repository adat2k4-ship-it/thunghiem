// api/db-config.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình kết nối MySQL cho InfinityFree
const pool = mysql.createPool({
  host: process.env.DB_HOST,              // Bỏ giá trị mặc định, lấy từ .env
  user: process.env.DB_USER,              // Bỏ giá trị mặc định
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '+07:00'
});

// Thêm hàm kiểm tra kết nối chi tiết
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Kết nối MySQL thành công!');
    console.log('📊 Database:', process.env.DB_NAME);
    console.log('🌐 Host:', process.env.DB_HOST);
    
    // Kiểm tra các bảng đã tồn tại chưa
    const [tables] = await connection.query('SHOW TABLES');
    console.log('📋 Tables:', tables.map(t => Object.values(t)[0]));
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL:', error.message);
    console.error('🔍 Chi tiết:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    return false;
  }
}

// Khởi tạo database và bảng
export async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Tạo bảng categories trước
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50),
        color VARCHAR(20),
        description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table categories created');

    // Sau đó tạo bảng expenses (có foreign key)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        vendor VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        amount DECIMAL(15,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        receipt_url TEXT,
        raw_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        payment_method VARCHAR(50) DEFAULT 'cash',
        status VARCHAR(20) DEFAULT 'completed',
        notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table expenses created');

    // Thêm dữ liệu mẫu nếu bảng categories trống
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (categories[0].count === 0) {
      await connection.query(`
        INSERT INTO categories (code, name, icon, color, description, sort_order) VALUES
        ('food', 'Nguyên liệu - Thực phẩm', 'fa-utensils', '#4361ee', 'Chi phí mua nguyên liệu, thực phẩm', 1),
        ('utilities', 'Điện - Nước - Internet', 'fa-bolt', '#06d6a0', 'Hóa đơn điện, nước, internet', 2),
        ('salary', 'Lương - Thưởng', 'fa-money-bill-wave', '#ffb703', 'Chi trả lương cho nhân viên', 3),
        ('transport', 'Vận chuyển - Xăng xe', 'fa-truck', '#ef476f', 'Chi phí vận chuyển, xăng xe', 4),
        ('rent', 'Thuê mặt bằng', 'fa-building', '#8338ec', 'Tiền thuê nhà, văn phòng', 5),
        ('office', 'Văn phòng phẩm', 'fa-pen', '#fb8500', 'Đồ dùng văn phòng', 6),
        ('equipment', 'Mua sắm thiết bị', 'fa-laptop', '#e3646b', 'Mua sắm máy móc, thiết bị', 7),
        ('marketing', 'Quảng cáo', 'fa-bullhorn', '#43aa8b', 'Chi phí quảng cáo', 8),
        ('other', 'Chi phí khác', 'fa-ellipsis-h', '#6c757d', 'Các chi phí khác', 99)
      `);
      console.log('✅ Sample categories inserted');
    }

    console.log('✅ Database initialized successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Init database error:', error);
    return false;
  }
}

export default pool;