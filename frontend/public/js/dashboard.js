// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    if (!checkAuth()) return;
    
    // Inicializar menú móvil
    initMobileMenu();
    
    // Cargar datos del dashboard
    loadDashboardData();
    
    // Mostrar fecha actual
    showCurrentDate();
});

// Inicializar menú móvil
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (mobileMenuBtn && sidebar) {
        // Toggle menú al hacer clic en el botón
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            if (mobileOverlay) {
                mobileOverlay.classList.toggle('active');
            }
        });
        
        // Cerrar menú al hacer clic en el overlay
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', function() {
                sidebar.classList.remove('active');
                mobileOverlay.classList.remove('active');
            });
        }
        
        // Cerrar menú al hacer clic en un enlace (en móviles)
        const navLinks = sidebar.querySelectorAll('.nav-item a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    if (mobileOverlay) {
                        mobileOverlay.classList.remove('active');
                    }
                }
            });
        });
    }
}


// Mostrar fecha actual
function showCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = new Date().toLocaleDateString('es-ES', options);
    }
}

// Helper para headers de autenticación
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`
    };
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        // Cargar estadísticas
        await loadStats();
        
        // Cargar pagos pendientes (solo admin)
        await loadPendingPayments();
        
        // Cargar pagos recientes
        await loadRecentPayments();
        
        // Cargar próximos eventos
        await loadUpcomingEvents();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error al cargar datos del dashboard', 'error');
    }
}


// Cargar estadísticas
async function loadStats() {
    try {
        // Obtener jugadores
        const playersResponse = await fetch(`${API_URL}/auth/users`, {
            headers: getAuthHeaders()
        });
        
        if (playersResponse.ok) {
            const players = await playersResponse.json();
            document.getElementById('totalPlayers').textContent = players.length || 0;
        }
        
        // Obtener pagos
        const paymentsResponse = await fetch(`${API_URL}/payments`, {
            headers: getAuthHeaders()
        });
        
        if (paymentsResponse.ok) {
            const payments = await paymentsResponse.json();
            
            // Calcular pagos del mes
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            
            const monthlyPayments = payments.filter(p => {
                const monthCovered = (p.month_covered || '').toLowerCase();
                const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase();
                const paymentDate = p.date_uploaded ? new Date(p.date_uploaded) : null;
                const isCurrentYear = paymentDate ? paymentDate.getFullYear() === currentYear : true;
                return monthCovered === currentMonthName &&
                       isCurrentYear &&
                       p.status === 'approved';
            });
            
            const totalMonthly = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            document.getElementById('monthlyPayments').textContent = formatCurrency(totalMonthly);
            
            // Calcular pagos pendientes
            const pendingPayments = payments.filter(p => p.status === 'pending');
            document.getElementById('pendingPayments').textContent = pendingPayments.length;
        }
        
        // El contador de eventos se actualiza en loadUpcomingEvents()

        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Cargar pagos recientes
async function loadRecentPayments() {
    const tbody = document.getElementById('recentPaymentsBody');
    if (!tbody) return;
    
    try {
        const response = await fetch(`${API_URL}/payments`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const payments = await response.json();
            
            // Tomar los últimos 5 pagos
            const recentPayments = payments.slice(0, 5);
            
            tbody.innerHTML = recentPayments.map(payment => `
                <tr>
                    <td>${payment.player_ref?.name || payment.playerName || 'Jugador'}</td>
                    <td>${capitalize(payment.concept || 'Mensualidad')}</td>
                    <td>${formatCurrency(payment.amount || 0)}</td>
                    <td>${formatDate(payment.date_uploaded)}</td>
                    <td>
                        <span class="status ${payment.status || 'pending'}">
                            ${payment.status === 'approved' ? 'Aprobado' : 
                              payment.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent payments:', error);
        tbody.innerHTML = '<tr><td colspan="5">Error al cargar pagos</td></tr>';
    }
}

// Cargar próximos eventos desde localStorage
async function loadUpcomingEvents() {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) {
        console.log('[Dashboard] No se encontró eventsList');
        return;
    }
    
    try {
        // Cargar eventos desde localStorage
        const savedEvents = localStorage.getItem('clubEvents');
        let events = [];
        
        if (savedEvents) {
            events = JSON.parse(savedEvents);
            console.log('[Dashboard] Eventos cargados:', events.length);
        } else {
            console.log('[Dashboard] No hay eventos en localStorage');
        }
        
        // Filtrar eventos futuros (desde hoy en adelante)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Helper para parsear fecha local desde YYYY-MM-DD
        const parseLocalDate = (dateStr) => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        };
        
        const upcomingEvents = events
            .filter(event => {
                const eventDate = parseLocalDate(event.date);
                return eventDate >= today;
            })
            .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date))
            .slice(0, 5); // Mostrar máximo 5 eventos próximos
        
        // Actualizar contador
        const upcomingEventsCount = document.getElementById('upcomingEvents');
        if (upcomingEventsCount) {
            upcomingEventsCount.textContent = upcomingEvents.length.toString();
        }
        
        if (upcomingEvents.length === 0) {
            eventsList.innerHTML = '<p class="no-events">No hay eventos próximos</p>';
            return;
        }
        
        eventsList.innerHTML = upcomingEvents.map(event => {
            // Parsear fecha local desde YYYY-MM-DD
            const [year, month, day] = event.date.split('-').map(Number);
            const eventDate = new Date(year, month - 1, day);
            const dayStr = day.toString().padStart(2, '0');
            const monthStr = eventDate.toLocaleDateString('es-ES', { month: 'short' });
            
            return `
                <div class="event-item">
                    <div class="event-date">
                        <div class="day">${dayStr}</div>
                        <div class="month">${monthStr}</div>
                    </div>
                    <div class="event-info">
                        <h4>${event.title}</h4>
                        <p><i class="fas fa-clock"></i> ${event.time || '--:--'}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${event.location || 'Sin ubicación'}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('[Dashboard] Eventos renderizados:', upcomingEvents.length);
        
    } catch (error) {
        console.error('[Dashboard] Error cargando eventos:', error);
        eventsList.innerHTML = '<p class="no-events">Error al cargar eventos</p>';
    }
}



// Cargar pagos pendientes de verificación (Admin)
async function loadPendingPayments() {
    const tbody = document.getElementById('pendingPaymentsBody');
    const noPending = document.getElementById('noPendingPayments');
    if (!tbody) return;
    
    try {
        const response = await fetch(`${API_URL}/payments/pending`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const payments = await response.json();
            
            if (payments.length === 0) {
                tbody.innerHTML = '';
                noPending.style.display = 'block';
                return;
            }
            
            noPending.style.display = 'none';
            
            tbody.innerHTML = payments.map(payment => `
                <tr>
                    <td>${payment.player_ref?.name || 'N/A'}</td>
                    <td>${payment.player_ref?.team_category || 'N/A'}</td>
                    <td>${translateMonth(payment.month_covered)}</td>
                    <td>$${payment.amount.toLocaleString()}</td>
                    <td>${new Date(payment.date_uploaded).toLocaleDateString('es-ES')}</td>
                    <td>
                        ${payment.receipt_url ? 
                            `<a href="${payment.receipt_url}" target="_blank" class="btn-view">
                                <i class="fas fa-eye"></i> Ver
                            </a>` : 
                            '<span class="text-muted">-</span>'
                        }
                    </td>
                    <td>
                        <button onclick="approvePayment('${payment._id}')" class="btn-approve" title="Aprobar">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="rejectPayment('${payment._id}')" class="btn-reject" title="Rechazar">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading pending payments:', error);
        tbody.innerHTML = '<tr><td colspan="7">Error al cargar pagos pendientes</td></tr>';
    }
}

// Aprobar pago
async function approvePayment(paymentId) {
    if (!confirm('¿Estás seguro de aprobar este pago?')) return;
    
    try {
        const response = await fetch(`${API_URL}/payments/${paymentId}/status`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'approved' })
        });
        
        if (response.ok) {
            showToast('Pago aprobado exitosamente', 'success');
            loadPendingPayments();
            loadStats();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al aprobar pago', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al aprobar pago', 'error');
    }
}

// Rechazar pago
async function rejectPayment(paymentId) {
    if (!confirm('¿Estás seguro de rechazar este pago?')) return;
    
    try {
        const response = await fetch(`${API_URL}/payments/${paymentId}/status`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'rejected' })
        });
        
        if (response.ok) {
            showToast('Pago rechazado', 'success');
            loadPendingPayments();
            loadStats();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al rechazar pago', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al rechazar pago', 'error');
    }
}

// Helper para traducir meses
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

// Helper para mostrar toast
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
