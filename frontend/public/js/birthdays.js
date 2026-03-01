// Birthdays functionality
let allPlayers = [];
let currentUserRole = '';

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    initMobileMenu();
    loadUserRole();
    setupNavigationMenu();
    loadBirthdays();
    
    // Fecha actual
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Cargar el rol del usuario
function loadUserRole() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    currentUserRole = user.role || 'player';
}

// Configurar menú de navegación según el rol
function setupNavigationMenu() {
    const navMenu = document.getElementById('navMenu');
    
    if (currentUserRole === 'admin') {
        navMenu.innerHTML = `
            <li class="nav-item">
                <a href="dashboard.html">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="players.html">
                    <i class="fas fa-users"></i>
                    <span>Jugadores</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="payments.html">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>Pagos</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="calendar.html">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Calendario</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="formations.html">
                    <i class="fas fa-basketball-ball"></i>
                    <span>Sistemas de Juego</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="reports.html">
                    <i class="fas fa-chart-bar"></i>
                    <span>Informes</span>
                </a>
            </li>
            <li class="nav-item active">
                <a href="birthdays.html">
                    <i class="fas fa-birthday-cake"></i>
                    <span>Cumpleaños</span>
                </a>
            </li>
        `;
    } else if (currentUserRole === 'assistant') {
        navMenu.innerHTML = `
            <li class="nav-item">
                <a href="calendar.html">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Calendario</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="formations.html">
                    <i class="fas fa-basketball-ball"></i>
                    <span>Sistemas de Juego</span>
                </a>
            </li>
            <li class="nav-item active">
                <a href="birthdays.html">
                    <i class="fas fa-birthday-cake"></i>
                    <span>Cumpleaños</span>
                </a>
            </li>
        `;
    } else {
        navMenu.innerHTML = `
            <li class="nav-item">
                <a href="player-dashboard.html">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>Mis Pagos</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="player-profile.html">
                    <i class="fas fa-user"></i>
                    <span>Mi Perfil</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="player-calendar.html">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Calendario</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="player-formations.html">
                    <i class="fas fa-basketball-ball"></i>
                    <span>Sistemas de Juego</span>
                </a>
            </li>
            <li class="nav-item active">
                <a href="birthdays.html">
                    <i class="fas fa-birthday-cake"></i>
                    <span>Cumpleaños</span>
                </a>
            </li>
        `;
    }

    // Aplicar reglas globales de visibilidad por rol después de crear el menú dinámico
    if (typeof configureMenuByRole === 'function') {
        configureMenuByRole(currentUserRole);
    }
}

// Cargar cumpleaños - funciona para ambos roles (usa endpoint /auth/birthdays)
async function loadBirthdays() {
    try {
        // Usar el nuevo endpoint de cumpleaños disponible para todos los usuarios autenticados
        const response = await fetch(`${API_URL}/auth/birthdays`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            allPlayers = await response.json();
            processBirthdays();
        } else {
            showError('Error al cargar los cumpleaños');
        }
        
    } catch (error) {
        console.error('Error loading birthdays:', error);
        showError('Error de conexión');
    }
}


// Procesar y mostrar cumpleaños
function processBirthdays() {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    
    // Filtrar jugadores con fecha de nacimiento
    const playersWithBirthday = allPlayers.filter(p => p.birth_date);
    
    // Si no hay jugadores con cumpleaños, mostrar mensaje
    if (playersWithBirthday.length === 0) {
        document.getElementById('todayCount').textContent = '0';
        document.getElementById('thisWeekCount').textContent = '0';
        document.getElementById('thisMonthCount').textContent = '0';
        document.getElementById('todaySection').style.display = 'none';
        document.getElementById('upcomingBirthdays').innerHTML = `
            <div class="empty-birthdays">
                <i class="fas fa-calendar-check"></i>
                <p>No hay información de cumpleaños disponible</p>
            </div>
        `;
        document.getElementById('monthBirthdaysBody').innerHTML = '<tr><td colspan="6" class="text-center">No hay cumpleaños registrados</td></tr>';
        return;
    }
    
    // Calcular datos para cada jugador
    const birthdayData = playersWithBirthday.map(player => {
        const birthDate = new Date(player.birth_date);
        const birthMonth = birthDate.getMonth();
        const birthDay = birthDate.getDate();
        
        // Calcular próximo cumpleaños
        let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
        if (nextBirthday < today) {
            nextBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
        }
        
        const age = today.getFullYear() - birthDate.getFullYear();
        const turningAge = age + 1;
        
        // Calcular días hasta el cumpleaños
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        
        return {
            ...player,
            birthMonth,
            birthDay,
            nextBirthday,
            age,
            turningAge,
            daysUntil,
            isToday: birthMonth === todayMonth && birthDay === todayDate,
            isThisWeek: daysUntil <= 7 && daysUntil > 0,
            isThisMonth: birthMonth === todayMonth
        };
    });
    
    // Ordenar por días hasta el cumpleaños
    birthdayData.sort((a, b) => a.daysUntil - b.daysUntil);
    
    // Actualizar contadores
    const todayCount = birthdayData.filter(p => p.isToday).length;
    const thisWeekCount = birthdayData.filter(p => p.isToday || (p.daysUntil <= 7 && p.daysUntil > 0)).length;
    const thisMonthCount = birthdayData.filter(p => p.isThisMonth).length;
    
    document.getElementById('todayCount').textContent = todayCount;
    document.getElementById('thisWeekCount').textContent = thisWeekCount;
    document.getElementById('thisMonthCount').textContent = thisMonthCount;
    
    // Renderizar secciones
    renderTodayBirthdays(birthdayData.filter(p => p.isToday));
    renderUpcomingBirthdays(birthdayData.filter(p => !p.isToday));
    renderMonthBirthdays(birthdayData.filter(p => p.isThisMonth).sort((a, b) => a.birthDay - b.birthDay));
}

// Renderizar cumpleaños de hoy
function renderTodayBirthdays(players) {
    const container = document.getElementById('todayBirthdays');
    const section = document.getElementById('todaySection');
    
    if (players.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    container.innerHTML = players.map(player => `
        <div class="birthday-card">
            <div class="player-photo">
                ${player.photo_url ? 
                    `<img src="${player.photo_url}" alt="${player.name}">` : 
                    `<i class="fas fa-user"></i>`
                }
            </div>
            <h3>${player.name}</h3>
            <div class="age">${player.turningAge}</div>
            <div class="age-label">¡Feliz Cumpleaños!</div>
            <span class="category">${player.team_category || 'Sin categoría'}</span>
        </div>
    `).join('');
}

// Renderizar próximos cumpleaños
function renderUpcomingBirthdays(players) {
    const container = document.getElementById('upcomingBirthdays');
    
    if (players.length === 0) {
        container.innerHTML = `
            <div class="empty-birthdays">
                <i class="fas fa-calendar-check"></i>
                <p>No hay más cumpleaños próximos</p>
            </div>
        `;
        return;
    }
    
    // Mostrar solo los próximos 10
    const upcoming = players.slice(0, 10);
    
    container.innerHTML = upcoming.map(player => {
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const isThisWeek = player.daysUntil <= 7;
        
        return `
            <div class="birthday-item ${isThisWeek ? 'this-week' : ''}">
                <div class="date-badge">
                    <div class="day">${player.birthDay}</div>
                    <div class="month">${monthNames[player.birthMonth]}</div>
                </div>
                <div class="player-info">
                    ${player.photo_url ? 
                        `<img src="${player.photo_url}" alt="${player.name}">` : 
                        `<div class="placeholder"><i class="fas fa-user"></i></div>`
                    }
                    <div class="player-details">
                        <h4>${player.name}</h4>
                        <p>${player.team_category || 'Sin categoría'}</p>
                    </div>
                </div>
                <div class="age-info">
                    <div class="years">${player.turningAge}</div>
                    <div class="label">años • ${player.daysUntil} días</div>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar cumpleaños del mes
function renderMonthBirthdays(players) {
    const tbody = document.getElementById('monthBirthdaysBody');
    
    if (players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay cumpleaños este mes</td></tr>';
        return;
    }
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    tbody.innerHTML = players.map(player => {
        const nextBirthday = new Date(new Date().getFullYear(), player.birthMonth, player.birthDay);
        const dayName = dayNames[nextBirthday.getDay()];
        
        return `
            <tr>
                <td>
                    <div class="player-cell">
                        ${player.photo_url ? 
                            `<img src="${player.photo_url}" alt="${player.name}">` : 
                            `<div class="placeholder"><i class="fas fa-user"></i></div>`
                        }
                        <span>${player.name}</span>
                    </div>
                </td>
                <td>${player.birthDay} de ${monthNames[player.birthMonth]}</td>
                <td>${dayName}</td>
                <td>${player.turningAge} años</td>
                <td>
                    <span class="category-badge category-${player.team_category || 'none'}">
                        ${player.team_category || 'Sin categoría'}
                    </span>
                </td>
                <td>${player.phone || 'No registrado'}</td>
            </tr>
        `;
    }).join('');
}

// Mostrar error
function showError(message) {
    const container = document.getElementById('upcomingBirthdays');
    if (container) {
        container.innerHTML = `
            <div class="empty-birthdays">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Helper para headers de autenticación
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`
    };
}
