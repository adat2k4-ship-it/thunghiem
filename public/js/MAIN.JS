// js/main.js
// Đổi API_URL thành URL của file proxy trên InfinityFree
const API_URL = 'https://sql305.infinityfree.com/api-proxy.php?action=';

// Ví dụ: Nếu site của bạn là: expensemanager.infinityfreeapp.com
// const API_URL = 'https://expensemanager.infinityfreeapp.com/api-proxy.php?action=';

// Hàm lấy dữ liệu
async function loadData() {
    try {
        const response = await fetch(API_URL + 'get_expenses&page=' + currentPage + '&limit=10');
        const result = await response.json();
        
        if (result.success) {
            displayExpenses(result.data.expenses);
            updatePagination(result.data.stats);
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showAlert('Không thể kết nối đến server', 'error');
    }
}

// Hàm thêm chi phí
async function saveExpense() {
    try {
        const response = await fetch(API_URL + 'add_expense', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentExpense)
        });
        
        const result = await response.json();
        if (result.success) {
            showAlert('Thêm thành công!', 'success');
            loadData();
        }
    } catch (error) {
        console.error('Lỗi:', error);
    }
}