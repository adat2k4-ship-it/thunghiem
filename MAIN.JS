// js/main.js
// Cấu hình API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

// Biến toàn cục
let currentExpense = null;
let expenseChart = null;
let categoryChart = null;
let currentPage = 1;
let totalPages = 1;
let deleteId = null;
let categories = [];

// Khởi tạo
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Ứng dụng khởi động...');
    await loadCategories();
    setupEventListeners();
    await loadData();
    setupFilters();
});

// Thiết lập event listeners
function setupEventListeners() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');

    // Click để chọn file
    dropArea.addEventListener('click', () => fileInput.click());
    
    // Drag & drop
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.style.background = 'rgba(67, 97, 238, 0.2)';
        dropArea.style.borderColor = '#3046c0';
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.style.background = 'rgba(67, 97, 238, 0.05)';
        dropArea.style.borderColor = '#4361ee';
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.style.background = 'rgba(67, 97, 238, 0.05)';
        dropArea.style.borderColor = '#4361ee';
        
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    });

    // Chọn file
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileUpload(file);
    });

    // Filter events
    document.getElementById('categoryFilter').addEventListener('change', () => {
        currentPage = 1;
        loadData();
    });

    document.getElementById('monthFilter').addEventListener('change', () => {
        currentPage = 1;
        loadData();
    });
}

// Tải danh sách categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/expenses?limit=1`);
        const result = await response.json();
        
        if (result.success && result.data.stats.categoryStats) {
            categories = result.data.stats.categoryStats;
            
            // Cập nhật filter
            const categoryFilter = document.getElementById('categoryFilter');
            categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>';
            
            categories.forEach(cat => {
                categoryFilter.innerHTML += `<option value="${cat.category}">${cat.category_name}</option>`;
            });
        }
    } catch (error) {
        console.error('Lỗi tải categories:', error);
    }
}

// Thiết lập filters
function setupFilters() {
    // Tháng filter
    const monthFilter = document.getElementById('monthFilter');
    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const month = (now.getMonth() - i + 12) % 12;
        const year = now.getFullYear() - (i > now.getMonth() ? 1 : 0);
        const value = `${year}-${String(month + 1).padStart(2, '0')}`;
        monthFilter.innerHTML += `<option value="${value}">${months[month]} ${year}</option>`;
    }
}

// Xử lý upload file
async function handleFileUpload(file) {
    // Kiểm tra file
    if (!file.type.startsWith('image/')) {
        showAlert('Vui lòng chọn file hình ảnh', 'warning');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showAlert('File không được vượt quá 5MB', 'warning');
        return;
    }

    // Hiển thị preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('imagePreview').src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Show loading
    showLoading('Đang xử lý hóa đơn...', 'AI đang đọc và phân tích nội dung');

    // Upload và OCR
    const formData = new FormData();
    formData.append('receipt', file);

    try {
        const response = await fetch(`${API_URL}/upload-receipt`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            currentExpense = result.data;
            displayOCRResult(result.data);
            document.getElementById('previewArea').style.display = 'block';
            showAlert('Đọc hóa đơn thành công!', 'success');
        } else {
            showAlert(result.error || 'Lỗi xử lý hóa đơn', 'error');
        }
    } catch (error) {
        hideLoading();
        showAlert('Lỗi kết nối: ' + error.message, 'error');
    }
}

// Hiển thị kết quả OCR
function displayOCRResult(data) {
    const category = categories.find(c => c.category === data.category) || {
        category_name: 'Khác',
        color: '#fb8500',
        icon: 'fa-ellipsis-h'
    };

    const html = `
        <div class="mb-3">
            <small class="text-muted d-block">Ngày hóa đơn</small>
            <strong>${formatDate(data.date)}</strong>
        </div>
        <div class="mb-3">
            <small class="text-muted d-block">Nhà cung cấp</small>
            <strong>${data.vendor || 'Không xác định'}</strong>
        </div>
        <div class="mb-3">
            <small class="text-muted d-block">Số tiền</small>
            <h4 class="text-primary">${formatCurrency(data.total)}</h4>
        </div>
        <div class="mb-3">
            <small class="text-muted d-block">Danh mục</small>
            <span class="category-badge" style="background: ${category.color};">
                <i class="fas ${category.icon} me-1"></i>
                ${category.category_name}
            </span>
        </div>
        <div class="mb-3">
            <small class="text-muted d-block">Mô tả</small>
            <p class="mb-0">${data.description || 'Không có mô tả'}</p>
        </div>
    `;
    
    document.getElementById('ocrResult').innerHTML = html;
}

// Lưu chi phí
async function saveExpense() {
    if (!currentExpense) return;

    showLoading('Đang lưu...', 'Vui lòng đợi trong giây lát');

    try {
        const response = await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentExpense)
        });

        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showAlert('Đã lưu chi phí thành công!', 'success');
            closePreview();
            await loadData();
        } else {
            showAlert(result.error || 'Lỗi lưu dữ liệu', 'error');
        }
    } catch (error) {
        hideLoading();
        showAlert('Lỗi: ' + error.message, 'error');
    }
}

// Tải dữ liệu
async function loadData() {
    showLoading('Đang tải dữ liệu...', 'Vui lòng đợi');

    try {
        const category = document.getElementById('categoryFilter').value;
        const monthYear = document.getElementById('monthFilter').value;
        
        let url = `${API_URL}/expenses?page=${currentPage}&limit=10`;
        if (category) url += `&category=${category}`;
        if (monthYear) {
            const [year, month] = monthYear.split('-');
            url += `&month=${month}&year=${year}`;
        }

        const response = await fetch(url);
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            displayExpenses(result.data.expenses);
            updateStats(result.data);
            updateCharts(result.data);
            updatePagination(result.data.stats);
            checkWarning(result.data);
        }
    } catch (error) {
        hideLoading();
        console.error('Lỗi tải dữ liệu:', error);
        showAlert('Không thể tải dữ liệu', 'error');
    }
}

// Hiển thị danh sách chi phí
function displayExpenses(expenses) {
    const tbody = document.getElementById('expenseList');
    
    if (!expenses || expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-5">
                    <i class="fas fa-inbox fa-4x mb-3" style="opacity: 0.5;"></i>
                    <p class="mb-0">Chưa có dữ liệu chi phí</p>
                    <small>Hãy tải lên hóa đơn đầu tiên của bạn</small>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = expenses.map(expense => {
        const category = categories.find(c => c.category === expense.category) || {
            category_name: expense.category,
            color: '#6c757d',
            icon: 'fa-tag'
        };

        return `
            <tr class="expense-item" style="border-left-color: ${category.color};">
                <td>
                    <strong>${formatDate(expense.date)}</strong>
                    <small class="text-muted d-block">${timeAgo(expense.date)}</small>
                </td>
                <td>
                    <strong>${expense.vendor || 'Không xác định'}</strong>
                </td>
                <td>
                    <span class="category-badge" style="background: ${category.color};">
                        <i class="fas ${category.icon} me-1"></i>
                        ${category.category_name}
                    </span>
                </td>
                <td>
                    <small>${expense.description || 'Không có mô tả'}</small>
                </td>
                <td class="text-end">
                    <strong class="text-primary">${formatCurrency(expense.amount)}</strong>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal(${expense.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Cập nhật thống kê
function updateStats(data) {
    const expenses = data.expenses || [];
    const now = new Date();
    const thisMonth = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
    });

    const total = thisMonth.reduce((sum, e) => sum + e.amount, 0);
    const highest = thisMonth.length > 0 
        ? Math.max(...thisMonth.map(e => e.amount)) 
        : 0;
    const highestExpense = thisMonth.find(e => e.amount === highest);

    document.getElementById('totalExpense').textContent = formatCurrency(total);
    document.getElementById('totalInvoices').textContent = thisMonth.length;
    document.getElementById('highestExpense').textContent = formatCurrency(highest);
    
    if (highestExpense) {
        document.getElementById('highestExpenseDate').innerHTML = 
            `<i class="fas fa-calendar me-1"></i>${formatDate(highestExpense.date)}`;
    }

    // Tính trung bình ngày
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const last30Days = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
    const avgDaily = last30Days.length > 0 
        ? last30Days.reduce((sum, e) => sum + e.amount, 0) / 30
        : 0;
    
    document.getElementById('avgDailyExpense').textContent = formatCurrency(avgDaily);
}

// Cập nhật biểu đồ
function updateCharts(data) {
    const expenses = data.expenses || [];
    
    // Biểu đồ theo tháng
    const monthlyData = {};
    expenses.forEach(e => {
        const month = e.date.substring(0, 7);
        monthlyData[month] = (monthlyData[month] || 0) + e.amount;
    });

    const months = Object.keys(monthlyData).sort().slice(-6);
    const amounts = months.map(m => monthlyData[m]);

    const ctx1 = document.getElementById('expenseChart').getContext('2d');
    if (expenseChart) expenseChart.destroy();
    
    expenseChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: months.map(m => {
                const [y, mth] = m.split('-');
                return `Tháng ${mth}/${y}`;
            }),
            datasets: [{
                label: 'Chi phí',
                data: amounts,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#4361ee',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => formatCurrency(context.raw)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });

    // Biểu đồ phân loại
    const categoryStats = data.stats.categoryStats || [];
    
    const ctx2 = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    
    categoryChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: categoryStats.map(c => c.category_name),
            datasets: [{
                data: categoryStats.map(c => c.total_amount),
                backgroundColor: categoryStats.map(c => c.color || '#4361ee'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });

    // Hiển thị legend
    const legend = document.getElementById('categoryLegend');
    legend.innerHTML = categoryStats.map(c => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <span style="display: inline-block; width: 12px; height: 12px; background: ${c.color}; border-radius: 3px; margin-right: 8px;"></span>
                <small>${c.category_name}</small>
            </div>
            <small class="text-muted">${formatCurrency(c.total_amount)}</small>
        </div>
    `).join('');
}

// Cập nhật phân trang
function updatePagination(stats) {
    totalPages = stats.totalPages;
    
    const pagination = document.getElementById('pagination');
    let html = '';
    
    if (totalPages > 1) {
        html += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                html += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                    </li>
                `;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        html += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
    }
    
    pagination.innerHTML = html;
}

// Đổi trang
function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    loadData();
    
    // Scroll lên đầu danh sách
    document.getElementById('expenses').scrollIntoView({ behavior: 'smooth' });
}

// Kiểm tra cảnh báo
function checkWarning(data) {
    const categoryStats = data.stats.categoryStats || [];
    const total = categoryStats.reduce((sum, c) => sum + c.total_amount, 0);
    
    // Kiểm tra tăng đột biến
    const warningAlert = document.getElementById('warningAlert');
    const warningMessage = document.getElementById('warningMessage');
    
    let warning = false;
    let message = '';

    // Cảnh báo nếu có danh mục chiếm > 50% tổng chi phí
    categoryStats.forEach(cat => {
        const percentage = (cat.total_amount / total) * 100;
        if (percentage > 50) {
            warning = true;
            message += `Chi phí ${cat.category_name} chiếm ${percentage.toFixed(1)}% tổng chi phí. `;
        }
    });

    // Cảnh báo nếu tổng chi phí > 50 triệu
    if (total > 50000000) {
        warning = true;
        message += `Tổng chi phí đã vượt 50 triệu đồng. `;
    }

    if (warning) {
        warningAlert.style.display = 'block';
        warningMessage.textContent = message;
    } else {
        warningAlert.style.display = 'none';
    }
}

// Mở modal xóa
function openDeleteModal(id) {
    deleteId = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// Xác nhận xóa
async function confirmDelete() {
    if (!deleteId) return;

    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    modal.hide();

    showLoading('Đang xóa...', 'Vui lòng đợi');

    try {
        const response = await fetch(`${API_URL}/expenses?id=${deleteId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showAlert('Xóa thành công!', 'success');
            await loadData();
        } else {
            showAlert(result.error || 'Lỗi xóa dữ liệu', 'error');
        }
    } catch (error) {
        hideLoading();
        showAlert('Lỗi: ' + error.message, 'error');
    }
    
    deleteId = null;
}

// Refresh dữ liệu
async function refreshData() {
    await loadCategories();
    await loadData();
    showAlert('Đã cập nhật dữ liệu mới nhất!', 'success');
}

// Đóng preview
function closePreview() {
    document.getElementById('previewArea').style.display = 'none';
    document.getElementById('fileInput').value = '';
    currentExpense = null;
}

// Hủy preview
function cancelPreview() {
    closePreview();
}

// Đóng cảnh báo
function closeWarning() {
    document.getElementById('warningAlert').style.display = 'none';
}

// Hiển thị loading
function showLoading(text = 'Đang xử lý...', subtext = 'Vui lòng đợi trong giây lát') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingSubtext').textContent = subtext;
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// Ẩn loading
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Hiển thị alert
function showAlert(message, type = 'info') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: type,
        title: message
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('₫', '₫');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Time ago
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return formatDate(dateString);
}