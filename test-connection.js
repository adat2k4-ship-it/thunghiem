// test-connection.js
import mysql from 'mysql2/promise';

async function testConnection() {
    console.log('🔍 Đang kiểm tra kết nối database...');
    console.log('-----------------------------------');
    
    const config = {
        host: 'sql111.infinityfree.com',
        user: 'if0_35853070',
        password: '', // Bạn cần điền password đã đặt khi tạo database
        database: 'if0_35853070_expense_manager',
        port: 3306,
        connectTimeout: 10000
    };

    console.log('📊 Thông tin kết nối:');
    console.log(`   Host: ${config.host}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Port: ${config.port}`);
    console.log('-----------------------------------');

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ BƯỚC 1: Kết nối thành công!');
        
        // Kiểm tra database
        const [dbResult] = await connection.query('SELECT DATABASE() as db');
        console.log(`📁 Đang kết nối tới database: ${dbResult[0].db}`);
        
        // Liệt kê các bảng
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📋 Số bảng hiện có: ${tables.length}`);
        
        if (tables.length > 0) {
            console.log('   Danh sách bảng:');
            tables.forEach(table => {
                console.log(`   - ${Object.values(table)[0]}`);
            });
        } else {
            console.log('⚠️  Chưa có bảng nào trong database!');
            console.log('   Bạn cần import file SQL để tạo bảng.');
        }
        
        // Kiểm tra charset
        const [charset] = await connection.query('SHOW VARIABLES LIKE "character_set_database"');
        console.log(`🔤 Charset: ${charset[0].Value}`);
        
        await connection.end();
        console.log('-----------------------------------');
        console.log('🎉 KẾT LUẬN: Kết nối database THÀNH CÔNG!');
        
        return true;
    } catch (error) {
        console.error('❌ LỖI KẾT NỐI:');
        console.error(`   Mã lỗi: ${error.code}`);
        console.error(`   Nội dung: ${error.message}`);
        console.log('-----------------------------------');
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('🔑 Nguyên nhân: Sai username hoặc password');
            console.log('   Cách khắc phục: Kiểm tra lại password trong Control Panel');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('📁 Nguyên nhân: Database không tồn tại');
            console.log('   Cách khắc phục: Tạo database mới với tên chính xác');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('🌐 Nguyên nhân: Không thể kết nối tới host');
            console.log('   Cách khắc phục: Kiểm tra host name (sql111.infinityfree.com)');
        }
        
        return false;
    }
}

// Chạy kiểm tra
testConnection().then(success => {
    if (!success) {
        console.log('\n💡 GỢI Ý:');
        console.log('1. Vào InfinityFree Control Panel → MySQL Databases');
        console.log('2. Kiểm tra lại thông tin database');
        console.log('3. Đảm bảo bạn đã nhập đúng password');
        console.log('4. Nếu cần, tạo database mới và import file SQL');
    }
});