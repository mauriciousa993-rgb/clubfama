// Calendar functionality
let currentDate = new Date();
let events = [];

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    // Initialize mobile menu
    initMobileMenu();
    
    renderCalendar();
    loadEvents();
    
    // Formulario de evento
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventSubmit);
    }
});


// Renderizar calendario
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Actualizar título
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Obtener primer día del mes y último día
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Domingo
    
    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    // Días del mes anterior (gris)
    for (let i = startingDay - 1; i >= 0; i--) {
        const dayDiv = createDayElement(prevMonthLastDay - i, true);
        calendarDays.appendChild(dayDiv);
    }
    
    // Días del mes actual
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = today.getDate() === day && 
                       today.getMonth() === month && 
                       today.getFullYear() === year;
        
        const dayDiv = createDayElement(day, false, isToday);
        
        // Agregar eventos del día
        const dayEvents = getEventsForDay(year, month, day);
        if (dayEvents.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'events';
            
            dayEvents.slice(0, 3).forEach(event => {
                const dot = document.createElement('div');
                dot.className = `event-dot ${event.type}`;
                dot.title = event.title;
                eventsContainer.appendChild(dot);
            });
            
            if (dayEvents.length > 3) {
                const more = document.createElement('div');
                more.className = 'event-dot';
                more.style.background = '#9ca3af';
                more.title = `+${dayEvents.length - 3} más`;
                eventsContainer.appendChild(more);
            }
            
            dayDiv.appendChild(eventsContainer);
        }
        
        // Click para agregar evento
        dayDiv.addEventListener('click', () => showAddEventModalForDay(year, month, day));
        
        calendarDays.appendChild(dayDiv);
    }
    
    // Días del mes siguiente (gris)
    const remainingDays = 42 - (startingDay + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        const dayDiv = createDayElement(day, true);
        calendarDays.appendChild(dayDiv);
    }
}

// Crear elemento de día
function createDayElement(day, isOtherMonth, isToday = false) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    if (isOtherMonth) div.classList.add('other-month');
    if (isToday) div.classList.add('today');
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    div.appendChild(dayNumber);
    
    return div;
}

// Obtener eventos para un día específico
function getEventsForDay(year, month, day) {
    return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === day &&
               eventDate.getMonth() === month &&
               eventDate.getFullYear() === year;
    });
}

// Mes anterior
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    loadEvents();
}

// Mes siguiente
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    loadEvents();
}

// Cargar eventos
async function loadEvents() {
    try {
        // Simulación de eventos (en producción vendrían de la API)
        events = [
            {
                _id: '1',
                title: 'Entrenamiento Sub-16',
                date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 25).toISOString(),
                time: '16:00',
                type: 'training',
                category: 'juvenil',

                location: 'Gimnasio Principal',
                description: 'Entrenamiento de preparación física'
            },
            {
                _id: '2',
                title: 'Partido Amistoso',
                date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 28).toISOString(),
                time: '10:00',
                type: 'game',
                category: 'elite',

                location: 'Cancha Municipal',
                description: 'Partido contra Club Deportivo'
            },
            {
                _id: '3',
                title: 'Torneo Regional',
                date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 2).toISOString(),
                time: '08:00',
                type: 'tournament',
                category: 'todas',
                location: 'Coliseo',
                description: 'Torneo regional de baloncesto'
            }
        ];
        
        renderEventsList();
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Renderizar lista de eventos
function renderEventsList() {
    const container = document.getElementById('monthEvents');
    if (!container) return;
    
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === currentMonth && 
               eventDate.getFullYear() === currentYear;
    });
    
    if (monthEvents.length === 0) {
        container.innerHTML = '<p class="no-events">No hay eventos este mes</p>';
        return;
    }
    
    // Ordenar por fecha
    monthEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    container.innerHTML = monthEvents.map(event => {
        const eventDate = new Date(event.date);
        const day = eventDate.getDate();
        const month = eventDate.toLocaleDateString('es-ES', { month: 'short' });
        
        return `
            <div class="event-card ${event.type}">
                <div class="event-time">
                    <div class="time">${event.time || '--:--'}</div>
                    <div class="ampm">${day} ${month}</div>
                </div>
                <div class="event-details">
                    <h4>${event.title}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.location || 'Sin ubicación'}</p>
                    <p><i class="fas fa-users"></i> ${capitalize(event.category || 'Todas')}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Mostrar modal de evento
function showAddEventModal() {
    document.getElementById('eventForm').reset();
    document.getElementById('eventModalTitle').innerHTML = '<i class="fas fa-calendar-plus"></i> Nuevo Evento';
    document.getElementById('eventModal').classList.add('active');
}

// Mostrar modal para día específico
function showAddEventModalForDay(year, month, day) {
    showAddEventModal();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    document.getElementById('eventDate').value = dateStr;
}

// Cerrar modal
function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
}

// Manejar submit del formulario
async function handleEventSubmit(e) {
    e.preventDefault();
    
    const eventData = {
        title: document.getElementById('eventTitle').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        type: document.getElementById('eventType').value,
        category: document.getElementById('eventCategory').value,
        location: document.getElementById('eventLocation').value,
        description: document.getElementById('eventDescription').value
    };
    
    try {
        // En producción, enviar a la API
        // const response = await fetch(`${API_URL}/events`, {
        //     method: 'POST',
        //     headers: getAuthHeaders(),
        //     body: JSON.stringify(eventData)
        // });
        
        // Simulación de éxito
        events.push({
            _id: generateId(),
            ...eventData
        });
        
        showToast('Evento creado exitosamente', 'success');
        closeEventModal();
        renderCalendar();
        renderEventsList();
        
    } catch (error) {
        console.error('Error saving event:', error);
        showToast('Error al crear evento', 'error');
    }
}
