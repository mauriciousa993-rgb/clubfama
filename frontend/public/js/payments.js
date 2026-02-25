// Payments functionality
let payments = [];
let players = [];

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    loadPayments();
    loadPlayersForSelect();
    
    // Formulario de pago
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
    
    // Establecer año actual
    const yearInput = document.getElementById('paymentYear');
    if (yearInput) {
        yearInput.value = new Date().getFullYear();
    }
});

// Cargar pagos
async function loadPayments() {
    const tbody = document.getElementById('paymentsBody');
    if (!tbody) return;
    
    showLoading('paymentsBody');
    
    try {
        const response = await fetch(`${API_URL}/payments`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            payments = await response.json();
            renderPayments(payments);
            updateSummary();
        } else {
            tbody.innerHTML = '<tr><td colspan="8">Error al cargar pagos</td></tr>';
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        tbody.innerHTML = '<tr><td colspan="8">Error de conexión</td></tr>';
    }
}

// Renderizar pagos
function renderPayments(paymentsToRender) {
    const tbody = document.getElementById('paymentsBody');
    if (!tbody) return;
    
    if (paymentsToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No hay pagos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = paymentsToRender.map(payment => {
        // Obtener nombre del jugador desde player_ref (populate) o playerName
        const playerName = payment.player_ref?.name || payment.playerName || 'Jugador';
        
        // Obtener mes desde month_covered o month
        const monthDisplay = payment.month_covered || getMonthName(payment.month);
        
        // Fecha de subida o fecha de pago
        const dateDisplay = payment.date_uploaded ? formatDate(payment.date_uploaded) : 
                          (payment.paymentDate ? formatDate(payment.paymentDate) : '-');
        
        // Botones según el estado
        let actionButtons = '';
        if (payment.status === 'pending') {
            actionButtons = `
                <button class="btn-action btn-view" onclick="viewReceipt('${payment._id}')" title="Ver comprobante">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action" onclick="approvePayment('${payment._id}')" title="Aprobar" style="background: #d1fae5; color: #065f46;">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-action btn-delete" onclick="rejectPayment('${payment._id}')" title="Rechazar">
                    <i class="fas fa-times"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deletePayment('${payment._id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        } else {
            actionButtons = `
                <button class="btn-action btn-view" onclick="viewReceipt('${payment._id}')" title="Ver comprobante">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deletePayment('${payment._id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
        
        return `
        <tr>
            <td>${playerName}</td>
            <td>${capitalize(payment.concept || 'Mensualidad')}</td>
            <td>${monthDisplay}</td>
            <td>${formatCurrency(payment.amount || 0)}</td>
            <td>${dateDisplay}</td>
            <td>
                <span class="payment-method">
                    <i class="fas ${getPaymentIcon(payment.method)}"></i>
                    ${capitalize(payment.method || 'Transferencia')}
                </span>
            </td>
            <td>
                <span class="status ${payment.status || 'pending'}">
                    ${getStatusText(payment.status)}
                </span>
            </td>
            <td>
                ${actionButtons}
            </td>
        </tr>
    `}).join('');
}


// Obtener nombre del mes
function getMonthName(month) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || month;
}

// Obtener icono de método de pago
function getPaymentIcon(method) {
    const icons = {
        'efectivo': 'fa-money-bill-wave',
        'transferencia': 'fa-university',
        'tarjeta': 'fa-credit-card',
        'deposito': 'fa-piggy-bank'
    };
    return icons[method] || 'fa-money-bill-wave';
}

// Obtener texto de estado
function getStatusText(status) {
    const texts = {
        'paid': 'Pagado',
        'pending': 'Pendiente',
        'overdue': 'Vencido',
        'approved': 'Aprobado',
        'rejected': 'Rechazado'
    };
    return texts[status] || 'Pendiente';
}

// Ver comprobante
function viewReceipt(id) {
    const payment = payments.find(p => p._id === id);
    if (payment && payment.receipt_url) {
        window.open(payment.receipt_url, '_blank');
    } else {
        showToast('No hay comprobante disponible', 'error');
    }
}

// Aprobar pago
async function approvePayment(id) {
    if (!confirm('¿Aprobar este pago?')) return;
    
    try {
        const response = await fetch(`${API_URL}/payments/${id}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'approved' })
        });
        
        if (response.ok) {
            showToast('Pago aprobado exitosamente', 'success');
            loadPayments();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al aprobar pago', 'error');
        }
    } catch (error) {
        console.error('Error approving payment:', error);
        showToast('Error de conexión', 'error');
    }
}

// Rechazar pago
async function rejectPayment(id) {
    if (!confirm('¿Rechazar este pago?')) return;
    
    try {
        const response = await fetch(`${API_URL}/payments/${id}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'rejected' })
        });
        
        if (response.ok) {
            showToast('Pago rechazado', 'success');
            loadPayments();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al rechazar pago', 'error');
        }
    } catch (error) {
        console.error('Error rejecting payment:', error);
        showToast('Error de conexión', 'error');
    }
}


// Actualizar resumen
function updateSummary() {
    const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
    const currentYear = new Date().getFullYear();

    const monthlyPayments = payments.filter(p => {
        const monthCovered = (p.month_covered || '').toLowerCase();
        const isCurrentMonth = monthCovered === currentMonthName.toLowerCase();
        const paymentDate = p.date_uploaded ? new Date(p.date_uploaded) : null;
        if (!paymentDate) {
            return false;
        }
        const isCurrentYear = paymentDate.getFullYear() === currentYear;
        return isCurrentMonth && isCurrentYear && p.status === 'approved';
    });

    const totalIncome = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);

    const pending = payments.filter(p => p.status === 'pending');
    const pendingAmount = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
    document.getElementById('pendingAmount').textContent = formatCurrency(pendingAmount);

    const rejected = payments.filter(p => p.status === 'rejected');
    const rejectedAmount = rejected.reduce((sum, p) => sum + (p.amount || 0), 0);
    document.getElementById('overdueAmount').textContent = formatCurrency(rejectedAmount);
}

// Cargar jugadores para el select
async function loadPlayersForSelect() {
    const select = document.getElementById('paymentPlayer');
    if (!select) return;
    
    try {
        const response = await fetch(`${API_URL}/auth/users`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            players = await response.json();
            select.innerHTML = '<option value="">Seleccionar jugador</option>' +
                players.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading players:', error);
    }
}

// Mostrar modal de pago
function showAddPaymentModal() {
    document.getElementById('paymentForm').reset();
    document.getElementById('paymentYear').value = new Date().getFullYear();
    document.getElementById('paymentModal').classList.add('active');
}

// Cerrar modal
function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

// Ver pago
function viewPayment(id) {
    const payment = payments.find(p => p._id === id);
    if (payment) {
        alert(`Pago de: ${payment.playerName}\nConcepto: ${payment.concept}\nMonto: ${formatCurrency(payment.amount)}\nEstado: ${getStatusText(payment.status)}`);
    }
}

// Editar pago
function editPayment(id) {
    const payment = payments.find(p => p._id === id);
    if (!payment) return;
    
    document.getElementById('paymentPlayer').value = payment.playerId || '';
    document.getElementById('paymentConcept').value = payment.concept || 'mensualidad';
    document.getElementById('paymentAmount').value = payment.amount || '';
    document.getElementById('paymentMonth').value = payment.month || new Date().getMonth() + 1;
    document.getElementById('paymentYear').value = payment.year || new Date().getFullYear();
    document.getElementById('paymentMethod').value = payment.method || 'efectivo';
    document.getElementById('paymentNotes').value = payment.notes || '';
    
    document.getElementById('paymentModal').classList.add('active');
}

// Eliminar pago
async function deletePayment(id) {
    if (!confirm('¿Estás seguro de eliminar este pago?')) return;
    
    try {
        const response = await fetch(`${API_URL}/payments/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showToast('Pago eliminado', 'success');
            loadPayments();
        } else {
            showToast('Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error deleting payment:', error);
        showToast('Error de conexión', 'error');
    }
}

// Manejar submit del formulario
async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const playerId = document.getElementById('paymentPlayer').value;
    const player = players.find(p => p._id === playerId);
    
    const paymentData = {
        playerId: playerId,
        playerName: player ? player.name : 'Jugador',
        concept: document.getElementById('paymentConcept').value,
        amount: parseFloat(document.getElementById('paymentAmount').value),
        month: parseInt(document.getElementById('paymentMonth').value),
        year: parseInt(document.getElementById('paymentYear').value),
        method: document.getElementById('paymentMethod').value,
        notes: document.getElementById('paymentNotes').value,
        status: 'paid',
        paymentDate: new Date()
    };
    
    try {
        const response = await fetch(`${API_URL}/payments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(paymentData)
        });
        
        if (response.ok) {
            showToast('Pago registrado exitosamente', 'success');
            closePaymentModal();
            loadPayments();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al registrar pago', 'error');
        }
    } catch (error) {
        console.error('Error saving payment:', error);
        showToast('Error de conexión', 'error');
    }
}

// Buscar pagos
function searchPayments() {
    const searchTerm = document.getElementById('searchPayment').value.toLowerCase();
    const filtered = payments.filter(p => 
        (p.playerName && p.playerName.toLowerCase().includes(searchTerm)) ||
        (p.concept && p.concept.toLowerCase().includes(searchTerm))
    );
    renderPayments(filtered);
}

// Filtrar pagos
function filterPayments() {
    const month = document.getElementById('monthFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    let filtered = payments;
    
    if (month) {
        filtered = filtered.filter(p => p.month === parseInt(month));
    }
    
    if (status) {
        filtered = filtered.filter(p => p.status === status);
    }
    
    renderPayments(filtered);
}
