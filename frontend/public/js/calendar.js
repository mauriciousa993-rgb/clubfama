// Calendar functionality
let currentDate = new Date();
let events = [];

document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Cargar eventos desde API, luego renderizar
    await loadEvents();
    renderCalendar();
    
    // Formulario de evento
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventSubmit);
    }
});

// Cargar eventos desde API (sincronizados entre dispositivos)
async function loadEvents() {
    try {
        console.log('[Calendar] Cargando eventos desde API...');
        
        const response = await fetch(`${API_URL}/events`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            events = await response.json();
            console.log('[Calendar] Eventos cargados desde API:', events.length);
            
            // Guardar copia local para offline
            localStorage.setItem('clubEvents', JSON.stringify(events));
        } else {
            console.error('[Calendar] Error al cargar desde API:', response.status);
            // Fallback: cargar desde localStorage
            const savedEvents = localStorage.getItem('clubEvents');
            if (savedEvents) {
                events = JSON.parse(savedEvents);
                console.log('[Calendar] Fallback - Eventos desde localStorage:', events.length);
            } else {
                events = [];
            }
        }
        
        renderEventsList();
    } catch (error) {
        console.error('[Calendar] Error loading events:', error);
        // Fallback: cargar desde localStorage
        const savedEvents = localStorage.getItem('clubEvents');
        if (savedEvents) {
            events = JSON.parse(savedEvents);
            renderEventsList();
        }
    }
}

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
                dot.className = `event-dot ${event.event_type || 'otro'}`;
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
        // Parsear la fecha correctamente como local (YYYY-MM-DD)
        const [eventYear, eventMonth, eventDay] = event.date.split('-').map(Number);
        return eventDay === day &&
               (eventMonth - 1) === month &&
               eventYear === year;
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

// Renderizar lista de eventos
function renderEventsList() {
    const container = document.getElementById('monthEvents');
    if (!container) return;
    
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthEvents = events.filter(event => {
        // Parsear la fecha correctamente como local (YYYY-MM-DD)
        const [eventYear, eventMonth, eventDay] = event.date.split('-').map(Number);
        return (eventMonth - 1) === currentMonth && 
               eventYear === currentYear;
    });
    
    if (monthEvents.length === 0) {
        container.innerHTML = '<p class="no-events">No hay eventos este mes</p>';
        return;
    }
    
    // Ordenar por fecha (comparando componentes de fecha local)
    monthEvents.sort((a, b) => {
        const [aYear, aMonth, aDay] = a.date.split('-').map(Number);
        const [bYear, bMonth, bDay] = b.date.split('-').map(Number);
        return new Date(aYear, aMonth - 1, aDay) - new Date(bYear, bMonth - 1, bDay);
    });
    
    container.innerHTML = monthEvents.map(event => {
        // Parsear la fecha correctamente como local
        const [eventYear, eventMonth, eventDay] = event.date.split('-').map(Number);
        const day = eventDay;
        const month = new Date(eventYear, eventMonth - 1).toLocaleDateString('es-ES', { month: 'short' });

        return `
            <div class="event-card ${event.event_type || 'otro'}" data-event-id="${event._id}">
                <div class="event-time">
                    <div class="time">${event.time || '--:--'}</div>
                    <div class="ampm">${day} ${month}</div>
                </div>
                <div class="event-details">
                    <h4>${event.title}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.location || 'Sin ubicación'}</p>
                    <p><i class="fas fa-users"></i> ${capitalize(event.team_category || 'Todas')}</p>
                </div>
                <div class="event-actions">
                    <button class="btn-action btn-edit" onclick="editEvent('${event._id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteEvent('${event._id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Variable para saber si estamos editando
let editingEventId = null;

// Editar evento
function editEvent(eventId) {
    const event = events.find(e => e._id === eventId);
    if (!event) return;
    
    editingEventId = eventId;
    
    // Llenar el formulario con los datos del evento
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventTime').value = event.time || '';
    document.getElementById('eventType').value = event.event_type || 'entrenamiento';
    document.getElementById('eventCategory').value = event.team_category || 'all';
    document.getElementById('eventLocation').value = event.location || '';
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventRecurrence').value = event.recurrence || 'none';
    document.getElementById('eventRecurrenceEnd').value = event.recurrence_end_date || '';
    
    // Cambiar el título del modal
    document.getElementById('eventModalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Evento';
    
    // Mostrar el modal
    document.getElementById('eventModal').classList.add('active');
}

// Eliminar evento
async function deleteEvent(eventId) {
    const event = events.find(e => e._id === eventId);
    if (!event) return;
    
    if (!confirm(`¿Estás seguro de eliminar el evento "${event.title}"?`)) {
        return;
    }
    
    try {
        // Intentar eliminar en la API
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            // Eliminar del array local
            events = events.filter(e => e._id !== eventId);
            // Actualizar localStorage
            localStorage.setItem('clubEvents', JSON.stringify(events));
            
            showToast('Evento eliminado correctamente', 'success');
            renderCalendar();
            renderEventsList();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al eliminar evento', 'error');
        }
    } catch (error) {
        console.error('[Calendar] Error deleting event:', error);
        showToast('Error de conexión al eliminar evento', 'error');
    }
}

// Mostrar modal de evento
function showAddEventModal() {
    editingEventId = null; // Resetear el modo edición
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
        event_type: document.getElementById('eventType').value,
        team_category: document.getElementById('eventCategory').value,
        location: document.getElementById('eventLocation').value,
        description: document.getElementById('eventDescription').value,
        recurrence: document.getElementById('eventRecurrence').value,
        recurrence_end_date: document.getElementById('eventRecurrenceEnd').value || null
    };
    
    try {
        if (editingEventId) {
            // Actualizar evento existente
            const response = await fetch(`${API_URL}/events/${editingEventId}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
            
            if (response.ok) {
                const updatedEvent = await response.json();
                
                // Actualizar en el array local
                const index = events.findIndex(e => e._id === editingEventId);
                if (index !== -1) {
                    events[index] = updatedEvent.event;
                }
                
                // Actualizar localStorage
                localStorage.setItem('clubEvents', JSON.stringify(events));
                
                showToast('Evento actualizado correctamente', 'success');
                closeEventModal();
                renderCalendar();
                renderEventsList();
                editingEventId = null;
            } else {
                const error = await response.json();
                showToast(error.message || 'Error al actualizar evento', 'error');
            }
        } else {
            // Crear nuevo evento
            const response = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Recargar eventos desde API para obtener todos (incluyendo recurrentes)
                await loadEvents();
                
                const message = result.event.recurrence !== 'none' 
                    ? 'Eventos creados exitosamente' 
                    : 'Evento creado exitosamente';
                
                showToast(message, 'success');
                closeEventModal();
                renderCalendar();
                renderEventsList();
            } else {
                const error = await response.json();
                showToast(error.message || 'Error al crear evento', 'error');
            }
        }
    } catch (error) {
        console.error('[Calendar] Error saving event:', error);
        showToast('Error de conexión al guardar evento', 'error');
    }
}

// Helper para capitalizar
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper para mostrar toast (si no existe)
if (typeof showToast !== 'function') {
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
}
