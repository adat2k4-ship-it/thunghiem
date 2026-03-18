-- =====================================================
-- FILE: expense_manager_complete.sql
-- DATABASE: if0_41418425_expense_manager (đã tạo)
-- =====================================================

-- SỬ DỤNG DATABASE
USE if0_41418425_expense_manager;

-- =====================================================
-- TẠO BẢNG categories (Danh mục)
-- =====================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TẠO BẢNG expenses (Chi phí)
-- =====================================================
CREATE TABLE expenses (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TẠO BẢNG monthly_budgets (Ngân sách)
-- =====================================================
CREATE TABLE monthly_budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    budget_amount DECIMAL(15,2) NOT NULL,
    warning_threshold DECIMAL(5,2) DEFAULT 80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_budget (category, month, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TẠO BẢNG receipts (Hóa đơn)
-- =====================================================
CREATE TABLE receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT,
    image_url TEXT NOT NULL,
    ocr_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TẠO BẢNG settings (Cài đặt)
-- =====================================================
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    setting_type VARCHAR(50) DEFAULT 'text',
    description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TẠO BẢNG notifications (Thông báo)
-- =====================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NHẬP DỮ LIỆU DANH MỤC
-- =====================================================
INSERT INTO categories (code, name, icon, color, description, sort_order) VALUES
('food', 'Nguyên liệu - Thực phẩm', 'fa-utensils', '#4361ee', 'Chi phí mua nguyên liệu, thực phẩm, đồ uống', 1),
('utilities', 'Điện - Nước - Internet', 'fa-bolt', '#06d6a0', 'Hóa đơn điện, nước, internet, điện thoại', 2),
('salary', 'Lương - Thưởng', 'fa-money-bill-wave', '#ffb703', 'Chi trả lương, thưởng, phụ cấp cho nhân viên', 3),
('transport', 'Vận chuyển - Xăng xe', 'fa-truck', '#ef476f', 'Chi phí vận chuyển, giao hàng, xăng xe', 4),
('rent', 'Thuê mặt bằng', 'fa-building', '#8338ec', 'Tiền thuê nhà, văn phòng, kho bãi', 5),
('office', 'Văn phòng phẩm', 'fa-pen', '#fb8500', 'Đồ dùng văn phòng, giấy in, bút viết', 6),
('equipment', 'Mua sắm thiết bị', 'fa-laptop', '#e3646b', 'Mua sắm máy móc, thiết bị, công cụ', 7),
('marketing', 'Quảng cáo', 'fa-bullhorn', '#43aa8b', 'Chi phí quảng cáo, chạy ads, in ấn', 8),
('tax', 'Thuế - Phí', 'fa-file-invoice-dollar', '#f9c74f', 'Thuế, phí, bảo hiểm, các khoản nộp nhà nước', 9),
('maintenance', 'Sửa chữa', 'fa-tools', '#577590', 'Sửa chữa máy móc, bảo trì thiết bị', 10),
('training', 'Đào tạo', 'fa-graduation-cap', '#4d908e', 'Chi phí đào tạo nhân viên', 11),
('entertainment', 'Tiếp khách', 'fa-champagne-glasses', '#f9844a', 'Chi phí tiếp khách, ăn uống, giải trí', 12),
('other', 'Chi phí khác', 'fa-ellipsis-h', '#6c757d', 'Các chi phí phát sinh khác', 99);

-- =====================================================
-- NHẬP DỮ LIỆU CÀI ĐẶT
-- =====================================================
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'Công ty TNHH ABC', 'text', 'Tên công ty'),
('tax_code', '0123456789', 'text', 'Mã số thuế'),
('currency', 'VND', 'text', 'Đơn vị tiền tệ'),
('date_format', 'dd/mm/yyyy', 'text', 'Định dạng ngày tháng'),
('warning_threshold', '80', 'number', 'Ngưỡng cảnh báo (%)'),
('alert_enabled', 'true', 'boolean', 'Bật/tắt cảnh báo'),
('large_expense_threshold', '10000000', 'number', 'Ngưỡng chi tiêu lớn (VND)'),
('default_category', 'other', 'text', 'Danh mục mặc định'),
('ai_model', 'gemini-pro', 'text', 'Model AI sử dụng'),
('ocr_language', 'vie', 'text', 'Ngôn ngữ OCR');

-- =====================================================
-- NHẬP DỮ LIỆU CHI PHÍ MẪU
-- =====================================================
INSERT INTO expenses (date, vendor, amount, category, description, payment_method) VALUES
-- Tháng hiện tại
(CURDATE(), 'Siêu thị Co.opmart', 1250000, 'food', 'Mua nguyên liệu: thịt, cá, rau củ', 'cash'),
(CURDATE(), 'Điện lực TP.HCM', 2345000, 'utilities', 'Thanh toán tiền điện tháng này', 'banking'),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Nhân viên A', 8000000, 'salary', 'Lương tháng này cho nhân viên A', 'banking'),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Petrolimex', 850000, 'transport', 'Đổ xăng cho xe giao hàng', 'cash'),
(DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Chủ nhà', 15000000, 'rent', 'Tiền thuê mặt bằng tháng này', 'banking'),
(DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Thế giới Di động', 4500000, 'equipment', 'Mua máy in văn phòng', 'banking'),
(DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Facebook Ads', 2000000, 'marketing', 'Chạy quảng cáo Facebook', 'banking'),
(DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'VNPT', 890000, 'utilities', 'Cước internet và điện thoại', 'banking');

-- =====================================================
-- NHẬP DỮ LIỆU NGÂN SÁCH
-- =====================================================
INSERT INTO monthly_budgets (category, month, year, budget_amount, warning_threshold) VALUES
('food', MONTH(CURDATE()), YEAR(CURDATE()), 20000000, 80),
('utilities', MONTH(CURDATE()), YEAR(CURDATE()), 5000000, 80),
('salary', MONTH(CURDATE()), YEAR(CURDATE()), 50000000, 90),
('transport', MONTH(CURDATE()), YEAR(CURDATE()), 10000000, 80),
('rent', MONTH(CURDATE()), YEAR(CURDATE()), 15000000, 90);

-- =====================================================
-- NHẬP DỮ LIỆU THÔNG BÁO
-- =====================================================
INSERT INTO notifications (title, message, type, is_read) VALUES
('Chào mừng', 'Hệ thống quản lý chi phí đã sẵn sàng!', 'info', FALSE),
('Cập nhật', 'Tính năng OCR đọc hóa đơn đã được tích hợp', 'success', FALSE),
('Nhắc nhở', 'Đã đến cuối tháng, hãy kiểm tra chi phí', 'warning', FALSE);

-- =====================================================
-- KIỂM TRA KẾT QUẢ
-- =====================================================
SELECT '✅ IMPORT THÀNH CÔNG!' as 'KẾT QUẢ';

SELECT '📊 DANH SÁCH BẢNG:' as '';
SHOW TABLES;

SELECT '📋 DANH MỤC:' as '';
SELECT id, code, name, sort_order FROM categories ORDER BY sort_order;

SELECT '💰 CHI PHÍ:' as '';
SELECT COUNT(*) as so_hoa_don, SUM(amount) as tong_tien FROM expenses;