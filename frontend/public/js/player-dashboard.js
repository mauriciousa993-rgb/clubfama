// Dashboard del Jugador - Club FAMA VALLE
// API_URL is already defined in auth.js

// Cargar datos del jugador al iniciar

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    // Initialize mobile menu
    initMobileMenu();
    
    loadUserInfo();
    loadMyPayments();
    setupUploadForm();
});


// Cargar información del usuario
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = user.name || user.email;
        }
        
        // Mostrar estado de deuda (si existe el elemento)
        const debtStatus = document.getElementById('debtStatus');
        if (debtStatus) {
            if (user.debt_status) {
                debtStatus.textContent = 'Estado: Pendiente de Pago';
                debtStatus.className = 'badge badge-warning';
            } else {
                debtStatus.textContent = 'Estado: Al Día';
                debtStatus.className = 'badge badge-success';
            }
        }
    }
}


// Cargar mis pagos
async function loadMyPayments() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/payments/my-payments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar pagos');
        }
        
        const payments = await response.json();
        displayPayments(payments);
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al cargar tus pagos', 'error');
    }
}

// Mostrar pagos en la tabla
function displayPayments(payments) {
    const tbody = document.getElementById('paymentsBody');
    const noPayments = document.getElementById('noPayments');
    
    if (payments.length === 0) {
        tbody.innerHTML = '';
        noPayments.style.display = 'block';
        return;
    }
    
    noPayments.style.display = 'none';
    
    tbody.innerHTML = payments.map(payment => {
        const date = new Date(payment.date_uploaded).toLocaleDateString('es-ES');
        const statusClass = getStatusClass(payment.status);
        const statusText = getStatusText(payment.status);
        
        return `
            <tr>
                <td>${date}</td>
                <td>${translateMonth(payment.month_covered)}</td>
                <td>$${payment.amount.toLocaleString()}</td>
                <td>
                    ${payment.receipt_url ? 
                        `<a href="${payment.receipt_url}" target="_blank" class="btn-view">
                            <i class="fas fa-eye"></i> Ver
                        </a>` : 
                        '<span class="text-muted">-</span>'
                    }
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Configurar formulario de subida
function setupUploadForm() {
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('receipt');
    const fileLabel = document.querySelector('.file-label span');
    
    // Mostrar nombre del archivo seleccionado
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            fileLabel.textContent = this.files[0].name;
        }
    });
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const amount = document.getElementById('amount').value;
        const month = document.getElementById('month').value;
        const file = fileInput.files[0];
        
        if (!file) {
            showMessage('Por favor selecciona un comprobante', 'error');
            return;
        }
        
        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showMessage('El archivo es muy grande. Máximo 10MB', 'error');
            return;
        }

        
        const formData = new FormData();
        formData.append('amount', amount);
        formData.append('month_covered', month);
        formData.append('receipt', file);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al subir comprobante');
            }
            
            const data = await response.json();
            showMessage('Comprobante subido exitosamente', 'success');
            
            // Limpiar formulario
            form.reset();
            fileLabel.textContent = 'Arrastra o haz clic para subir';
            
            // Recargar pagos
            loadMyPayments();
            
        } catch (error) {
            console.error('Error:', error);
            showMessage(error.message || 'Error al subir el comprobante', 'error');
        }
    });
}

// Helpers
function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected'
    };
    return classes[status] || 'status-pending';
}

function getStatusText(status) {
    const texts = {
        'pending': 'Pendiente',
        'approved': 'Aprobado',
        'rejected': 'Rechazado'
    };
    return texts[status] || 'Pendiente';
}

function translateMonth(month) {
    const months = {
        'January': 'Enero',
        'February': 'Febrero',
        'March': 'Marzo',
        'April': 'Abril',
        'May': 'Mayo',
        'June': 'Junio',
        'July': 'Julio',
        'August': 'Agosto',
        'September': 'Septiembre',
        'October': 'Octubre',
        'November': 'Noviembre',
        'December': 'Diciembre'
    };
    return months[month] || month;
}

function showMessage(message, type) {
    const container = document.getElementById('messageContainer');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 5000);
}
