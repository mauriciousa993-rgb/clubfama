// Players functionality
let players = [];
let editingPlayerId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    initMobileMenu();
    loadPlayers();
    
    // Formulario de jugador
    const playerForm = document.getElementById('playerForm');
    if (playerForm) {
        playerForm.addEventListener('submit', handlePlayerSubmit);
    }
    
    // Preview de foto
    const photoInput = document.getElementById('playerPhoto');
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoPreview);
    }
});


// Cargar jugadores
async function loadPlayers() {
    const grid = document.getElementById('playersGrid');
    if (!grid) return;
    
    showLoading('playersGrid');
    
    try {
        const response = await fetch(`${API_URL}/auth/users`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            players = await response.json();
            renderPlayers(players);
        } else {
            grid.innerHTML = '<p>Error al cargar jugadores</p>';
        }
    } catch (error) {
        console.error('Error loading players:', error);
        grid.innerHTML = '<p>Error de conexión</p>';
    }
}

// Renderizar jugadores
function renderPlayers(playersToRender) {
    const grid = document.getElementById('playersGrid');
    if (!grid) return;
    
    if (playersToRender.length === 0) {
        grid.innerHTML = '<p class="no-data">No hay jugadores registrados</p>';
        return;
    }
    
    grid.innerHTML = playersToRender.map(player => `
        <div class="player-card">
            <div class="player-photo">
                ${player.photo_url ? 
                    `<img src="${player.photo_url}" alt="${player.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : 
                    `<i class="fas fa-user"></i>`
                }
                <span class="player-category">${player.team_category || player.category || 'Senior'}</span>
            </div>

            <div class="player-info">
                <h3>${player.name}</h3>
                <p>${player.position || 'Jugador'} • ${player.email || ''}</p>
                <div class="player-stats">
                    <span><i class="fas fa-phone"></i> ${player.phone || 'N/A'}</span>
                    <span><i class="fas fa-birthday-cake"></i> ${calculateAge(player.birth_date) || 'N/A'} años</span>
                </div>
                <div class="player-actions">
                    <button class="btn-view" onclick="viewPlayer('${player._id}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn-edit" onclick="editPlayer('${player._id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deletePlayer('${player._id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>

            </div>
        </div>
    `).join('');
}

// Calcular edad
function calculateAge(birthDate) {
    if (!birthDate) return null;
    
    // Crear fecha evitando el problema de zona horaria
    let birth;
    if (typeof birthDate === 'string') {
        // Si es un string ISO, extraer solo la parte de fecha
        const datePart = birthDate.split('T')[0];
        birth = new Date(datePart + 'T12:00:00'); // Mediodía para evitar problemas de zona horaria
    } else {
        birth = new Date(birthDate);
    }
    
    if (isNaN(birth.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Mostrar modal de agregar jugador
function showAddPlayerModal() {
    editingPlayerId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Jugador';
    document.getElementById('playerForm').reset();
    document.getElementById('photoPreview').innerHTML = `
        <i class="fas fa-camera"></i>
        <span>Click para subir foto</span>
    `;
    
    // Mostrar campo de contraseña para nuevo jugador
    const passwordRow = document.getElementById('passwordRow');
    if (passwordRow) {
        passwordRow.style.display = 'flex';
    }
    
    // Hacer email requerido para nuevo jugador
    document.getElementById('playerEmail').required = true;
    
    document.getElementById('playerModal').classList.add('active');
}

// Cerrar modal
function closePlayerModal() {
    document.getElementById('playerModal').classList.remove('active');
}

// Ver jugador - Mostrar información completa
function viewPlayer(id) {
    const player = players.find(p => p._id === id);
    if (!player) return;
    
    const content = document.getElementById('viewPlayerContent');
    const modalTitle = document.getElementById('viewModalTitle');
    
    modalTitle.innerHTML = `<i class="fas fa-user"></i> ${player.name}`;
    
    // Formatear fechas
    let birthDateStr = 'No registrada';
    if (player.birth_date) {
        // Extraer solo la parte de fecha para evitar problema de zona horaria
        const datePart = player.birth_date.split('T')[0];
        const [year, month, day] = datePart.split('-');
        birthDateStr = `${day}/${month}/${year}`;
    }
    const age = calculateAge(player.birth_date);
    
    // Información de contacto de emergencia
    const emergencyContact = player.emergency_contact || {};
    
    content.innerHTML = `
        <div class="player-profile-view">
            <!-- Foto y datos básicos -->
            <div class="profile-header">
                <div class="profile-photo-large">
                    ${player.photo_url ? 
                        `<img src="${player.photo_url}" alt="${player.name}">` : 
                        `<i class="fas fa-user"></i>`
                    }
                </div>
                <div class="profile-basic-info">
                    <h3>${player.name}</h3>
                    <p class="profile-email"><i class="fas fa-envelope"></i> ${player.email}</p>
                    <p class="profile-category"><i class="fas fa-users"></i> Categoría: ${player.team_category || 'No asignada'}</p>
                    <span class="profile-status ${player.profile_completed ? 'completed' : 'pending'}">
                        <i class="fas ${player.profile_completed ? 'fa-check-circle' : 'fa-clock'}"></i>
                        ${player.profile_completed ? 'Perfil completo' : 'Perfil pendiente'}
                    </span>
                </div>
            </div>

            <!-- Información Personal -->
            <div class="profile-section">
                <h4><i class="fas fa-id-card"></i> Información Personal</h4>
                <div class="profile-grid">
                    <div class="profile-item">
                        <label>Tipo de documento:</label>
                        <span>${player.document_type || 'No registrado'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Número de documento:</label>
                        <span>${player.document_number || 'No registrado'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Fecha de nacimiento:</label>
                        <span>${birthDateStr} ${age ? `(${age} años)` : ''}</span>
                    </div>
                    <div class="profile-item">
                        <label>Teléfono:</label>
                        <span>${player.phone || 'No registrado'}</span>
                    </div>
                    <div class="profile-item full-width">
                        <label>Dirección:</label>
                        <span>${player.address || 'No registrada'}</span>
                    </div>
                </div>
            </div>

            <!-- Información Médica -->
            <div class="profile-section">
                <h4><i class="fas fa-heartbeat"></i> Información Médica</h4>
                <div class="profile-grid">
                    <div class="profile-item full-width">
                        <label>Historial médico:</label>
                        <span>${player.medical_history || 'No registrado'}</span>
                    </div>
                    <div class="profile-item full-width">
                        <label>Alergias:</label>
                        <span>${player.allergies || 'No registradas'}</span>
                    </div>
                    <div class="profile-item full-width">
                        <label>Enfermedades:</label>
                        <span>${player.diseases || 'No registradas'}</span>
                    </div>
                </div>
            </div>

            <!-- Contacto de Emergencia -->
            <div class="profile-section">
                <h4><i class="fas fa-phone-alt"></i> Contacto de Emergencia</h4>
                <div class="profile-grid">
                    <div class="profile-item">
                        <label>Nombre:</label>
                        <span>${emergencyContact.name || 'No registrado'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Teléfono:</label>
                        <span>${emergencyContact.phone || 'No registrado'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Parentesco:</label>
                        <span>${emergencyContact.relationship || 'No registrado'}</span>
                    </div>
                </div>
            </div>

            <!-- Información de Padres -->
            <div class="profile-section">
                <h4><i class="fas fa-users"></i> Información de Padres</h4>
                <div class="profile-grid">
                    <div class="profile-item">
                        <label>Padre:</label>
                        <span>${player.father_name || 'No registrado'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Teléfono padre:</label>
                        <span>${player.father_phone || 'No registrado'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Ocupación padre:</label>
                        <span>${player.father_occupation || 'No registrada'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Madre:</label>
                        <span>${player.mother_name || 'No registrada'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Teléfono madre:</label>
                        <span>${player.mother_phone || 'No registrado'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Ocupación madre:</label>
                        <span>${player.mother_occupation || 'No registrada'}</span>
                    </div>
                </div>
            </div>

            <!-- Información Académica -->
            <div class="profile-section">
                <h4><i class="fas fa-graduation-cap"></i> Información Académica</h4>
                <div class="profile-grid">
                    <div class="profile-item">
                        <label>Nivel educativo:</label>
                        <span>${player.education_level || 'No registrado'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Institución:</label>
                        <span>${player.institution || 'No registrada'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Grado/Carrera:</label>
                        <span>${player.career_grade || 'No registrado'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Semestre:</label>
                        <span>${player.semester || 'No registrado'}</span>
                    </div>
                </div>
            </div>

            <!-- Información del Sistema -->
            <div class="profile-section">
                <h4><i class="fas fa-info-circle"></i> Información del Sistema</h4>
                <div class="profile-grid">
                    <div class="profile-item">
                        <label>Estado de deuda:</label>
                        <span class="${player.debt_status ? 'debt-yes' : 'debt-no'}">
                            <i class="fas ${player.debt_status ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
                            ${player.debt_status ? 'Con deuda pendiente' : 'Sin deuda'}
                        </span>
                    </div>
                    <div class="profile-item">
                        <label>Fecha de registro:</label>
                        <span>${player.created_at ? new Date(player.created_at).toLocaleDateString('es-ES') : 'No disponible'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Última actualización:</label>
                        <span>${player.updated_at ? new Date(player.updated_at).toLocaleDateString('es-ES') : 'No disponible'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('viewPlayerModal').classList.add('active');
}

// Cerrar modal de ver jugador
function closeViewPlayerModal() {
    document.getElementById('viewPlayerModal').classList.remove('active');
}


// Editar jugador
function editPlayer(id) {
    const player = players.find(p => p._id === id);
    if (!player) return;
    
    editingPlayerId = id;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-edit"></i> Editar Jugador';
    
    // Ocultar campo de contraseña para edición
    const passwordRow = document.getElementById('passwordRow');
    if (passwordRow) {
        passwordRow.style.display = 'none';
    }
    
    // No requerir email en modo edición
    document.getElementById('playerEmail').required = false;
    
    // Llenar los campos del formulario
    document.getElementById('playerName').value = player.name || '';
    
    // Manejar fecha de nacimiento correctamente para evitar problema de zona horaria
    if (player.birth_date) {
        const birthDate = player.birth_date.split('T')[0];
        document.getElementById('playerBirthDate').value = birthDate;
    } else {
        document.getElementById('playerBirthDate').value = '';
    }
    
    document.getElementById('playerCategory').value = player.category || 'infantil';
    document.getElementById('playerPosition').value = player.position || 'base';
    document.getElementById('playerPhone').value = player.phone || '';
    document.getElementById('playerEmail').value = player.email || '';
    document.getElementById('playerPassword').value = '';
    document.getElementById('playerInfo').value = player.additionalInfo || '';
    
    document.getElementById('playerModal').classList.add('active');
}

// Manejar preview de foto
function handlePhotoPreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('photoPreview').innerHTML = `
                <img src="${e.target.result}" style="max-width: 100%; max-height: 100%; object-fit: cover; border-radius: 8px;">
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Manejar submit del formulario
async function handlePlayerSubmit(e) {
    e.preventDefault();
    
    const playerData = {
        name: document.getElementById('playerName').value,
        // Enviar fecha con hora del mediodía para evitar problema de zona horaria
        birthDate: document.getElementById('playerBirthDate').value ? document.getElementById('playerBirthDate').value + 'T12:00:00' : null,
        category: document.getElementById('playerCategory').value,
        position: document.getElementById('playerPosition').value,
        phone: document.getElementById('playerPhone').value,
        email: document.getElementById('playerEmail').value,
        team_category: document.getElementById('playerTeamCategory').value,
        additionalInfo: document.getElementById('playerInfo').value,
        role: 'player' // Rol automático de jugador
    };
    
    // Solo agregar contraseña si es nuevo jugador y tiene valor
    const password = document.getElementById('playerPassword').value;
    if (!editingPlayerId && password) {
        playerData.password = password;
    }
    
    // Validar contraseña solo para nuevo jugador
    if (!editingPlayerId && (!password || password.length < 6)) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Validar email solo para nuevo jugador
    if (!editingPlayerId && !playerData.email) {
        showToast('El correo electrónico es requerido para nuevos jugadores', 'error');
        return;
    }
    
    try {
        const url = editingPlayerId ? 
            `${API_URL}/auth/users/${editingPlayerId}` : 
            `${API_URL}/auth/register`;
        
        const method = editingPlayerId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playerData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast(editingPlayerId ? 'Jugador actualizado' : `Jugador registrado. Usuario creado: ${result.email}`, 'success');
            closePlayerModal();
            loadPlayers();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error saving player:', error);
        showToast('Error de conexión', 'error');
    }
}


// Buscar jugadores
function searchPlayers() {
    const searchTerm = document.getElementById('searchPlayer').value.toLowerCase();
    const filtered = players.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        (p.email && p.email.toLowerCase().includes(searchTerm))
    );
    renderPlayers(filtered);
}

// Filtrar jugadores
function filterPlayers() {
    const category = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    let filtered = players;
    
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (status) {
        filtered = filtered.filter(p => p.status === status);
    }
    
    renderPlayers(filtered);
}

// Helper para headers de autenticación
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`
    };
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

// Helper para mostrar loading
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    }
}

// Eliminar jugador
async function deletePlayer(id) {
    const player = players.find(p => p._id === id);
    if (!player) return;
    
    // Confirmar eliminación
    const confirmed = confirm(`¿Estás seguro de que deseas eliminar al jugador "${player.name}"?\n\nEsta acción no se puede deshacer.`);
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_URL}/auth/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showToast('Jugador eliminado correctamente', 'success');
            loadPlayers(); // Recargar la lista
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al eliminar jugador', 'error');
        }
    } catch (error) {
        console.error('Error deleting player:', error);
        showToast('Error de conexión al eliminar jugador', 'error');
    }
}
