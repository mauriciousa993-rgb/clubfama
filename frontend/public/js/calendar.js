// Calendar functionality
let currentDate = new Date();
let events = [];

// Guardar eventos en localStorage
function saveEvents() {
    localStorage.setItem('clubEvents', JSON.stringify(events));
}

// Cargar eventos desde localStorage
function loadEventsFromStorage() {
    const savedEvents = localStorage.getItem('clubEvents');
    if (savedEvents) {
        events = JSON.parse(savedEvents);
        return true;
    }
    return false;
}


document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Cargar eventos primero, luego renderizar
    await loadEvents();
    renderCalendar();
    
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
    renderEventsList();
}

// Mes siguiente
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    renderEventsList();
}


// Cargar eventos
async function loadEvents() {
    try {
        // Intentar cargar desde localStorage primero
        const hasSavedEvents = loadEventsFromStorage();
        
        // Si no hay eventos guardados, iniciar con array vacío (sin eventos de ejemplo)
        if (!hasSavedEvents) {
            events = [];
            saveEvents();
        }
        
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

// Generar fechas recurrentes
function generateRecurringDates(startDate, recurrence, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
    
    let current = new Date(start);
    
    while (current <= end) {
        dates.push(new Date(current).toISOString().split('T')[0]);
        
        switch (recurrence) {
            case 'daily':
                current.setDate(current.getDate() + 1);
                break;
            case 'weekly':
                current.setDate(current.getDate() + 7);
                break;
            case 'monthly':
                current.setMonth(current.getMonth() + 1);
                break;
            default:
                return dates;
        }
    }
    
    return dates;
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
        description: document.getElementById('eventDescription').value,
        recurrence: document.getElementById('eventRecurrence').value,
        recurrenceEnd: document.getElementById('eventRecurrenceEnd').value
    };
    
    try {
        // Generar eventos según recurrencia
        const recurrence = eventData.recurrence;
        const dates = recurrence !== 'none' 
            ? generateRecurringDates(eventData.date, recurrence, eventData.recurrenceEnd)
            : [eventData.date];
        
        // Crear eventos para cada fecha
        dates.forEach(date => {
            events.push({
                _id: generateId(),
                title: eventData.title,
                date: date,
                time: eventData.time,
                type: eventData.type,
                category: eventData.category,
                location: eventData.location,
                description: eventData.description,
                recurrence: recurrence,
                parentEvent: dates.length > 1 ? dates[0] : null
            });
        });
        
        const message = dates.length > 1 
            ? `${dates.length} eventos creados exitosamente` 
            : 'Evento creado exitosamente';
        
        // Guardar eventos en localStorage
        saveEvents();
        
        showToast(message, 'success');
        closeEventModal();
        renderCalendar();
        renderEventsList();
        
    } catch (error) {
        console.error('Error saving event:', error);
        showToast('Error al crear evento', 'error');
    }
}
