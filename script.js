// Variables globales
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let charts = {};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tema
    initTheme();
    
    // Inicializar calculadora
    initCalculator();
    
    // Cargar gastos almacenados
    loadExpenses();
    
    // Inicializar gráficos
    initCharts();
    
    // Actualizar estadísticas
    updateStatistics();
});

// Tema claro/oscuro
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Establecer tema inicial
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    // Cambiar tema al hacer clic
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Calculadora de gastos
function initCalculator() {
    const addButton = document.getElementById('addExpense');
    
    addButton.addEventListener('click', function() {
        addExpense();
    });
    
    // También agregar con Enter
    document.getElementById('expenseAmount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addExpense();
        }
    });
}

function addExpense() {
    const nameInput = document.getElementById('expenseName');
    const amountInput = document.getElementById('expenseAmount');
    const categorySelect = document.getElementById('expenseCategory');
    
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    
    // Validaciones
    if (!name) {
        alert('Por favor ingresa una descripción para el gasto');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert('Por favor ingresa un monto válido');
        return;
    }
    
    // Crear objeto de gasto
    const expense = {
        id: Date.now(),
        name: name,
        amount: amount,
        category: category,
        date: new Date().toLocaleDateString('es-CO')
    };
    
    // Agregar a la lista
    expenses.push(expense);
    
    // Guardar en localStorage
    saveExpenses();
    
    // Actualizar la interfaz
    renderExpense(expense);
    updateStatistics();
    updateCharts();
    
    // Limpiar formulario
    nameInput.value = '';
    amountInput.value = '';
    nameInput.focus();
    
    // Mostrar notificación
    showNotification('Gasto agregado correctamente', 'success');
}

function renderExpense(expense) {
    const expenseList = document.getElementById('expenseList');
    
    // Remover mensaje de lista vacía si existe
    const emptyMessage = expenseList.querySelector('.empty-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // Crear elemento de gasto
    const expenseItem = document.createElement('div');
    expenseItem.className = 'expense-item';
    expenseItem.innerHTML = `
        <div class="expense-info">
            <h5>${expense.name}</h5>
            <span>${getCategoryIcon(expense.category)} ${getCategoryName(expense.category)} • ${expense.date}</span>
        </div>
        <div class="expense-actions">
            <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
            <button class="delete-btn" data-id="${expense.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Agregar al inicio de la lista
    expenseList.insertBefore(expenseItem, expenseList.firstChild);
    
    // Agregar evento para eliminar
    const deleteBtn = expenseItem.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
        deleteExpense(expense.id);
    });
}

function deleteExpense(id) {
    // Filtrar el gasto a eliminar
    expenses = expenses.filter(expense => expense.id !== id);
    
    // Guardar cambios
    saveExpenses();
    
    // Recargar lista
    loadExpenses();
    
    // Actualizar estadísticas
    updateStatistics();
    updateCharts();
    
    // Mostrar notificación
    showNotification('Gasto eliminado correctamente', 'info');
}

function loadExpenses() {
    const expenseList = document.getElementById('expenseList');
    
    // Limpiar lista
    expenseList.innerHTML = '';
    
    if (expenses.length === 0) {
        expenseList.innerHTML = '<p class="empty-message">No hay gastos registrados</p>';
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    const sortedExpenses = [...expenses].sort((a, b) => b.id - a.id);
    
    // Renderizar cada gasto
    sortedExpenses.forEach(expense => {
        renderExpense(expense);
    });
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Estadísticas
function updateStatistics() {
    const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
    const uniqueCategories = new Set(expenses.map(expense => expense.category)).size;
    
    // Actualizar UI
    document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('categoryCount').textContent = `${uniqueCategories} categorías`;
}

// Gráficos
function initCharts() {
    // Gráfico de categorías (doughnut)
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    charts.category = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', 
                    '#8B5CF6', '#EC4899', '#6366F1'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
    
    // Gráfico mensual (bar)
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    charts.monthly = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            datasets: [{
                label: 'Gastos por semana',
                data: [0, 0, 0, 0],
                backgroundColor: '#10B981',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Actualizar gráficos con datos iniciales
    updateCharts();
}

function updateCharts() {
    if (expenses.length === 0) {
        // Datos de ejemplo para gráficos vacíos
        charts.category.data.labels = ['Sin datos'];
        charts.category.data.datasets[0].data = [1];
        charts.category.update();
        
        charts.monthly.data.datasets[0].data = [0, 0, 0, 0];
        charts.monthly.update();
        return;
    }
    
    // Agrupar gastos por categoría
    const categoryTotals = {};
    expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
    });
    
    // Actualizar gráfico de categorías
    charts.category.data.labels = Object.keys(categoryTotals).map(getCategoryName);
    charts.category.data.datasets[0].data = Object.values(categoryTotals);
    charts.category.update();
    
    // Simular datos semanales (en un proyecto real, agruparías por fecha)
    const weeklyData = [0, 0, 0, 0];
    expenses.forEach(expense => {
        // Simular distribución por semanas
        const week = Math.floor(Math.random() * 4);
        weeklyData[week] += expense.amount;
    });
    
    // Actualizar gráfico mensual
    charts.monthly.data.datasets[0].data = weeklyData;
    charts.monthly.update();
}

// Utilidades
function getCategoryIcon(category) {
    const icons = {
        'comida': '🍔',
        'transporte': '🚗',
        'entretenimiento': '🎬',
        'vivienda': '🏠',
        'salud': '🏥',
        'educacion': '📚',
        'otros': '📦'
    };
    return icons[category] || '📝';
}

function getCategoryName(category) {
    const names = {
        'comida': 'Comida',
        'transporte': 'Transporte',
        'entretenimiento': 'Entretenimiento',
        'vivienda': 'Vivienda',
        'salud': 'Salud',
        'educacion': 'Educación',
        'otros': 'Otros'
    };
    return names[category] || 'Otros';
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Agregar al body
    document.body.appendChild(notification);
    
    // Estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : '#3B82F6'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    // Animaciones
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                document.head.removeChild(style);
            }
        }, 300);
    }, 3000);
}

// Exportar datos (funcionalidad extra)
function exportData() {
    if (expenses.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    const dataStr = JSON.stringify(expenses, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `gastos-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Agregar botón de exportación al final del script
document.addEventListener('DOMContentLoaded', function() {
    // Crear botón de exportación
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-secondary';
    exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar Datos';
    exportBtn.style.margin = '20px auto';
    exportBtn.style.display = 'block';
    exportBtn.onclick = exportData;
    
    // Agregar después de la calculadora
    const calculatorSection = document.querySelector('.calculator');
    calculatorSection.appendChild(exportBtn);
});