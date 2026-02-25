const Formation = require('../models/Formation');

// Crear nuevo sistema/jugada
exports.createFormation = async (req, res) => {
  try {
    const formation = new Formation({
      ...req.body,
      created_by: req.user._id
    });
    await formation.save();
    res.status(201).json(formation);
  } catch (error) {
    console.error('Error creating formation:', error);
    res.status(400).json({ message: error.message });
  }
};

// Obtener todos los sistemas (con filtros)
exports.getFormations = async (req, res) => {
  try {
    const { category, type } = req.query;
    const filter = { is_active: true };
    
    if (category && category !== 'all') {
      filter.$or = [
        { team_category: category },
        { team_category: 'all' }
      ];
    }
    
    if (type && type !== 'all') {
      filter.play_type = type;
    }

    const formations = await Formation.find(filter)
      .populate('created_by', 'name')
      .sort({ created_at: -1 });
    
    res.json(formations);
  } catch (error) {
    console.error('Error getting formations:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener un sistema específico
exports.getFormationById = async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id)
      .populate('created_by', 'name');
    
    if (!formation) {
      return res.status(404).json({ message: 'Sistema de juego no encontrado' });
    }
    
    res.json(formation);
  } catch (error) {
    console.error('Error getting formation:', error);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar sistema
exports.updateFormation = async (req, res) => {
  try {
    const formation = await Formation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: Date.now() },
      { new: true }
    );
    
    if (!formation) {
      return res.status(404).json({ message: 'Sistema de juego no encontrado' });
    }
    
    res.json(formation);
  } catch (error) {
    console.error('Error updating formation:', error);
    res.status(400).json({ message: error.message });
  }
};

// Eliminar sistema (soft delete)
exports.deleteFormation = async (req, res) => {
  try {
    const formation = await Formation.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );
    
    if (!formation) {
      return res.status(404).json({ message: 'Sistema de juego no encontrado' });
    }
    
    res.json({ message: 'Sistema de juego eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting formation:', error);
    res.status(500).json({ message: error.message });
  }
};

// Duplicar un sistema existente
exports.duplicateFormation = async (req, res) => {
  try {
    const original = await Formation.findById(req.params.id);
    
    if (!original) {
      return res.status(404).json({ message: 'Sistema de juego no encontrado' });
    }
    
    const duplicated = new Formation({
      name: `${original.name} (Copia)`,
      code: `${original.code}-COPY-${Date.now()}`,
      description: original.description,
      play_type: original.play_type,
      team_category: original.team_category,
      total_steps: original.total_steps,
      steps: original.steps,
      starting_positions: original.starting_positions,
      created_by: req.user._id,
      is_active: true
    });
    
    await duplicated.save();
    res.status(201).json(duplicated);
  } catch (error) {
    console.error('Error duplicating formation:', error);
    res.status(400).json({ message: error.message });
  }
};
