// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    if (!checkAuth()) return;
    
    // Inicializar menú móvil
    initMobileMenu();

    // Inicializar filtros del resumen mensual
    initStudentMonthlySummaryFilters();
    
    // Cargar datos del dashboard
    loadDashboardData();
    
    // Mostrar fecha actual
    showCurrentDate();
});

let studentMonthlySummaryRows = [];
let defaultMonthlyPaymentsTotal = 0;

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

        // Cargar resumen mensual por estudiante
        await loadStudentMonthlySummary();
        
        // Cargar pagos recientes
        await loadRecentPayments();
        
        // Cargar próximos eventos desde API (sincronizados entre dispositivos)
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
                const monthCovered = normalizeMonthToEnglish(p.month_covered).toLowerCase();
                const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase();
                const paymentDate = p.date_uploaded ? new Date(p.date_uploaded) : null;
                const isCurrentYear = paymentDate ? paymentDate.getFullYear() === currentYear : true;
                return monthCovered === currentMonthName &&
                       isCurrentYear &&
                       p.status === 'approved';
            });
            
            const totalMonthly = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            defaultMonthlyPaymentsTotal = totalMonthly;
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

// Cargar resumen mensual por estudiante
async function loadStudentMonthlySummary() {
    const tbody = document.getElementById('studentMonthlySummaryBody');
    const emptyState = document.getElementById('noStudentMonthlySummary');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_URL}/payments`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            tbody.innerHTML = '<tr><td colspan="7">Error al cargar el resumen mensual</td></tr>';
            if (emptyState) emptyState.style.display = 'none';
            return;
        }

        const payments = await response.json();

        if (!payments.length) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        const numberToEnglishMonth = {
            1: 'January',
            2: 'February',
            3: 'March',
            4: 'April',
            5: 'May',
            6: 'June',
            7: 'July',
            8: 'August',
            9: 'September',
            10: 'October',
            11: 'November',
            12: 'December'
        };

        const summaryMap = new Map();

        payments.forEach((payment) => {
            const playerName = payment.player_ref?.name || payment.playerName || 'Jugador';
            const monthCovered = normalizeMonthToEnglish(payment.month_covered);
            const paymentDate = payment.date_uploaded ? new Date(payment.date_uploaded) : new Date();
            const year = paymentDate.getFullYear();
            const monthNumber = monthNameToNumber(monthCovered) || (paymentDate.getMonth() + 1);
            const normalizedMonth = monthCovered || numberToEnglishMonth[monthNumber] || '';
            const monthKey = `${year}-${String(monthNumber).padStart(2, '0')}`;
            const mapKey = `${playerName}__${monthKey}`;

            if (!summaryMap.has(mapKey)) {
                summaryMap.set(mapKey, {
                    playerName,
                    monthCovered: normalizedMonth,
                    year,
                    monthNumber,
                    approvedTotal: 0,
                    approvedCount: 0,
                    pendingCount: 0,
                    rejectedCount: 0,
                    lastDate: null
                });
            }

            const row = summaryMap.get(mapKey);
            const amount = Number(payment.amount) || 0;

            if (payment.status === 'approved') {
                row.approvedTotal += amount;
                row.approvedCount += 1;
            } else if (payment.status === 'rejected') {
                row.rejectedCount += 1;
            } else {
                row.pendingCount += 1;
            }

            if (!row.lastDate || paymentDate > row.lastDate) {
                row.lastDate = paymentDate;
            }
        });

        const summaryRows = Array.from(summaryMap.values()).sort((a, b) => {
            const dateA = new Date(a.year, a.monthNumber - 1, 1);
            const dateB = new Date(b.year, b.monthNumber - 1, 1);
            if (dateB.getTime() !== dateA.getTime()) {
                return dateB - dateA;
            }
            return a.playerName.localeCompare(b.playerName, 'es');
        });

        studentMonthlySummaryRows = summaryRows;
        populateSummaryStudentFilter(summaryRows);
        populateSummaryYearFilter(summaryRows);
        renderStudentMonthlySummary();

        if (emptyState) emptyState.style.display = 'none';
    } catch (error) {
        console.error('Error loading monthly summary:', error);
        tbody.innerHTML = '<tr><td colspan="7">Error al cargar el resumen mensual</td></tr>';
        if (emptyState) emptyState.style.display = 'none';
    }
}

function initStudentMonthlySummaryFilters() {
    const studentFilter = document.getElementById('summaryStudentFilter');
    const monthFilter = document.getElementById('summaryMonthFilter');
    const yearFilter = document.getElementById('summaryYearFilter');

    if (studentFilter) {
        studentFilter.addEventListener('change', renderStudentMonthlySummary);
    }

    if (monthFilter) {
        monthFilter.addEventListener('change', renderStudentMonthlySummary);
    }

    if (yearFilter) {
        yearFilter.addEventListener('change', renderStudentMonthlySummary);
    }
}

function populateSummaryStudentFilter(rows) {
    const studentFilter = document.getElementById('summaryStudentFilter');
    if (!studentFilter) return;

    const selectedValue = studentFilter.value || 'all';
    const students = [...new Set(rows.map((row) => row.playerName))]
        .sort((a, b) => a.localeCompare(b, 'es'));

    studentFilter.innerHTML = [
        '<option value="all">Todos</option>',
        ...students.map((student) => `<option value="${student}">${student}</option>`)
    ].join('');

    if (students.includes(selectedValue)) {
        studentFilter.value = selectedValue;
    } else {
        studentFilter.value = 'all';
    }
}

function populateSummaryYearFilter(rows) {
    const yearFilter = document.getElementById('summaryYearFilter');
    if (!yearFilter) return;

    const selectedValue = yearFilter.value || 'all';
    const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => b - a);

    yearFilter.innerHTML = [
        '<option value="all">Todos</option>',
        ...years.map((year) => `<option value="${year}">${year}</option>`)
    ].join('');

    if (years.some((year) => String(year) === selectedValue)) {
        yearFilter.value = selectedValue;
    } else {
        yearFilter.value = 'all';
    }
}

function renderStudentMonthlySummary() {
    const tbody = document.getElementById('studentMonthlySummaryBody');
    const emptyState = document.getElementById('noStudentMonthlySummary');
    const emptyText = emptyState ? emptyState.querySelector('p') : null;
    const studentFilter = document.getElementById('summaryStudentFilter');
    const monthFilter = document.getElementById('summaryMonthFilter');
    const yearFilter = document.getElementById('summaryYearFilter');

    if (!tbody) return;

    const selectedStudent = studentFilter ? studentFilter.value : 'all';
    const selectedMonth = monthFilter ? monthFilter.value : 'all';
    const selectedMonthNormalized = selectedMonth === 'all'
        ? 'all'
        : normalizeMonthToEnglish(selectedMonth);
    const selectedYear = yearFilter ? yearFilter.value : 'all';

    const filteredRows = studentMonthlySummaryRows.filter((row) => {
        const matchStudent = selectedStudent === 'all' || row.playerName === selectedStudent;
        const matchMonth = selectedMonthNormalized === 'all' || row.monthCovered === selectedMonthNormalized;
        const matchYear = selectedYear === 'all' || String(row.year) === selectedYear;
        return matchStudent && matchMonth && matchYear;
    });

    syncMonthlyPaymentsCardWithFilters(
        selectedStudent,
        selectedMonth,
        selectedYear,
        filteredRows
    );

    if (!filteredRows.length) {
        tbody.innerHTML = '';
        if (emptyText) {
            emptyText.textContent = studentMonthlySummaryRows.length
                ? 'No hay resultados para el filtro seleccionado'
                : 'No hay pagos registrados para resumir';
        }
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    tbody.innerHTML = filteredRows.map((row) => `
        <tr>
            <td>${row.playerName}</td>
            <td>${translateMonth(row.monthCovered)} ${row.year}</td>
            <td>${formatCurrency(row.approvedTotal)}</td>
            <td>${row.approvedCount}</td>
            <td>${row.pendingCount}</td>
            <td>${row.rejectedCount}</td>
            <td>${row.lastDate ? formatDate(row.lastDate) : '-'}</td>
        </tr>
    `).join('');

    if (emptyState) emptyState.style.display = 'none';
}

function syncMonthlyPaymentsCardWithFilters(selectedStudent, selectedMonth, selectedYear, filteredRows) {
    const monthlyPaymentsEl = document.getElementById('monthlyPayments');
    if (!monthlyPaymentsEl) return;

    const isDefaultView =
        selectedStudent === 'all' &&
        selectedMonth === 'all' &&
        selectedYear === 'all';

    if (isDefaultView) {
        monthlyPaymentsEl.textContent = formatCurrency(defaultMonthlyPaymentsTotal);
        return;
    }

    // Si el usuario usa filtros (sobre todo mes), reflejamos ese total arriba.
    const filteredApprovedTotal = filteredRows.reduce(
        (sum, row) => sum + (Number(row.approvedTotal) || 0),
        0
    );
    monthlyPaymentsEl.textContent = formatCurrency(filteredApprovedTotal);
}

// Cargar próximos eventos desde API (sincronizados entre todos los dispositivos)
async function loadUpcomingEvents() {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) {
        console.log('[Dashboard] No se encontró eventsList');
        return;
    }
    
    try {
        console.log('[Dashboard] Cargando eventos desde API...');
        
        // Cargar eventos desde la API (sincronizados entre dispositivos)
        const response = await fetch(`${API_URL}/events/upcoming?limit=5`, {
            headers: getAuthHeaders()
        });
        
        let events = [];
        
        if (response.ok) {
            events = await response.json();
            console.log('[Dashboard] Eventos cargados desde API:', events.length);
        } else {
            console.error('[Dashboard] Error al cargar eventos desde API:', response.status);
            // Fallback: intentar cargar desde localStorage temporalmente
            const savedEvents = localStorage.getItem('clubEvents');
            if (savedEvents) {
                events = JSON.parse(savedEvents);
                console.log('[Dashboard] Fallback - Eventos desde localStorage:', events.length);
            }
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
            loadStudentMonthlySummary();
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
            loadStudentMonthlySummary();
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
    const normalizedMonth = normalizeMonthToEnglish(month);
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
    return months[normalizedMonth] || month;
}

function monthNameToNumber(monthName) {
    const monthNumbers = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12
    };
    return monthNumbers[monthName] || null;
}

function normalizeMonthToEnglish(month) {
    const value = String(month || '').trim().toLowerCase();
    const monthMap = {
        january: 'January',
        february: 'February',
        march: 'March',
        april: 'April',
        may: 'May',
        june: 'June',
        july: 'July',
        august: 'August',
        september: 'September',
        october: 'October',
        november: 'November',
        december: 'December',
        enero: 'January',
        febrero: 'February',
        marzo: 'March',
        abril: 'April',
        mayo: 'May',
        junio: 'June',
        julio: 'July',
        agosto: 'August',
        septiembre: 'September',
        setiembre: 'September',
        octubre: 'October',
        noviembre: 'November',
        diciembre: 'December'
    };
    return monthMap[value] || '';
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
