<?php
// api-proxy.php - Đặt trong thư mục gốc của InfinityFree
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Kết nối database
$host = 'sql305.infinityfree.com';
$user = 'if0_41418425';
$pass = 'h1zFcfQv4eE'; // Điền mật khẩu thật
$db = 'if0_41418425_expense_manage';

$conn = new mysqli($host, $user, $pass, $db);
$conn->set_charset('utf8mb4');

if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Lấy method và action
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Xử lý CORS
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Router
switch ($action) {
    case 'get_expenses':
        getExpenses($conn);
        break;
    case 'add_expense':
        addExpense($conn);
        break;
    case 'delete_expense':
        deleteExpense($conn);
        break;
    case 'test':
        testConnection($conn);
        break;
    default:
        echo json_encode([
            'success' => false,
            'error' => 'Action not found'
        ]);
}

$conn->close();

// Hàm lấy danh sách chi phí
function getExpenses($conn) {
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $offset = ($page - 1) * $limit;
    
    $query = "SELECT e.*, c.name as category_name, c.icon, c.color 
              FROM expenses e 
              LEFT JOIN categories c ON e.category = c.code 
              ORDER BY e.date DESC 
              LIMIT ? OFFSET ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $expenses = [];
    while ($row = $result->fetch_assoc()) {
        $expenses[] = $row;
    }
    
    // Đếm tổng
    $totalResult = $conn->query("SELECT COUNT(*) as total FROM expenses");
    $total = $totalResult->fetch_assoc()['total'];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'expenses' => $expenses,
            'stats' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => ceil($total / $limit)
            ]
        ]
    ]);
}

// Hàm thêm chi phí
function addExpense($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $conn->prepare("INSERT INTO expenses (date, vendor, amount, category, description) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssdss", 
        $input['date'],
        $input['vendor'],
        $input['total'],
        $input['category'],
        $input['description']
    );
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Thêm thành công',
            'id' => $stmt->insert_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $stmt->error
        ]);
    }
}

// Hàm xóa chi phí
function deleteExpense($conn) {
    $id = $_GET['id'] ?? 0;
    
    $stmt = $conn->prepare("DELETE FROM expenses WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Xóa thành công'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $stmt->error
        ]);
    }
}

// Hàm test
function testConnection($conn) {
    $tables = $conn->query("SHOW TABLES");
    $tableList = [];
    while ($row = $tables->fetch_array()) {
        $tableList[] = $row[0];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Kết nối thành công!',
        'data' => [
            'database' => $conn->query("SELECT DATABASE() as db")->fetch_assoc()['db'],
            'tables' => $tableList
        ]
    ]);
}
?>