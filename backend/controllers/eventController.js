const Event = require('../models/Event');

// @desc    Crear nuevo evento
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, location, event_type, team_category, recurrence, recurrence_end_date } = req.body;

    // Validar campos requeridos
    if (!title || !date) {
      return res.status(400).json({ message: 'Título y fecha son requeridos' });
    }

    // Crear evento principal
    const event = await Event.create({
      title,
      description,
      date,
      time,
      location,
      event_type,
      team_category,
      recurrence,
      recurrence_end_date,
      created_by: req.user._id
    });

    // Si tiene recurrencia, crear eventos hijos
    if (recurrence && recurrence !== 'none' && recurrence_end_date) {
      await createRecurringEvents(event, req.user._id);
    }

    res.status(201).json({
      message: 'Evento creado exitosamente',
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Error al crear evento' });
  }
};

// Función auxiliar para crear eventos recurrentes
const createRecurringEvents = async (parentEvent, userId) => {
  const events = [];
  const startDate = new Date(parentEvent.date);
  const endDate = new Date(parentEvent.recurrence_end_date);
  
  let currentDate = new Date(startDate);
  
  // Avanzar al siguiente período según la recurrencia
  while (currentDate <= endDate) {
    let nextDate = new Date(currentDate);
    
    if (parentEvent.recurrence === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (parentEvent.recurrence === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (parentEvent.recurrence === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    // Si la fecha siguiente está dentro del rango, crear evento
    if (nextDate <= endDate) {
      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextDate.getDate()).padStart(2, '0');
      
      events.push({
        title: parentEvent.title,
        description: parentEvent.description,
        date: `${year}-${month}-${day}`,
        time: parentEvent.time,
        location: parentEvent.location,
        event_type: parentEvent.event_type,
        team_category: parentEvent.team_category,
        recurrence: 'none',
        parent_event_id: parentEvent._id,
        created_by: userId
      });
    }
    
    currentDate = nextDate;
  }
  
  // Insertar todos los eventos recurrentes
  if (events.length > 0) {
    await Event.insertMany(events);
  }
};

// @desc    Obtener todos los eventos
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  try {
    const { start_date, end_date, team_category } = req.query;
    
    let query = { is_active: true };
    
    // Filtrar por rango de fechas
    if (start_date && end_date) {
      query.date = {
        $gte: start_date,
        $lte: end_date
      };
    }
    
    // Filtrar por categoría
    if (team_category && team_category !== 'all') {
      query.team_category = { $in: [team_category, 'all'] };
    }
    
    const events = await Event.find(query)
      .sort({ date: 1, time: 1 })
      .populate('created_by', 'name');
    
    res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ message: 'Error al obtener eventos' });
  }
};

// @desc    Obtener evento por ID
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('created_by', 'name');
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(500).json({ message: 'Error al obtener evento' });
  }
};

// @desc    Actualizar evento
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    // Actualizar campos
    const allowedFields = ['title', 'description', 'date', 'time', 'location', 'event_type', 'team_category', 'is_active'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });
    
    event.updated_at = Date.now();
    await event.save();
    
    res.json({
      message: 'Evento actualizado exitosamente',
      event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error al actualizar evento' });
  }
};

// @desc    Eliminar evento
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    // Si es evento padre con recurrencia, eliminar también los hijos
    if (event.recurrence !== 'none') {
      await Event.deleteMany({ parent_event_id: event._id });
    }
    
    // Si es evento hijo, solo eliminar este
    await Event.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Evento eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error al eliminar evento' });
  }
};

// @desc    Obtener eventos próximos (para dashboard)
// @route   GET /api/events/upcoming
// @access  Private
const getUpcomingEvents = async (req, res) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    const { limit = 5, team_category } = req.query;
    
    let query = { 
      is_active: true,
      date: { $gte: todayStr }
    };
    
    if (team_category && team_category !== 'all') {
      query.team_category = { $in: [team_category, 'all'] };
    }
    
    const events = await Event.find(query)
      .sort({ date: 1, time: 1 })
      .limit(parseInt(limit))
      .populate('created_by', 'name');
    
    res.json(events);
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ message: 'Error al obtener eventos próximos' });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getUpcomingEvents
};
