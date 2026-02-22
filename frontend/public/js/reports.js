// Reports functionality
let allPlayers = [];
let filteredPlayers = [];
let currentPlayerDetail = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    loadPlayersForReports();
});

// Cargar jugadores para informes
async function loadPlayersForReports() {
    showLoading('reportsTableBody');
    
    try {
        const response = await fetch(`${API_URL}/auth/users`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            allPlayers = await response.json();
            filteredPlayers = [...allPlayers];
            updateSummaryCards();
            renderCategoryStats();
            renderMedicalSummary();
            renderEducationSummary();
            renderIncompleteList();
            renderReportsTable();
        } else {
            document.getElementById('reportsTableBody').innerHTML = 
                '<tr><td colspan="8" class="text-center">Error al cargar jugadores</td></tr>';
        }
    } catch (error) {
        console.error('Error loading players:', error);
        document.getElementById('reportsTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center">Error de conexión</td></tr>';
    }
}

// Actualizar tarjetas de resumen
function updateSummaryCards() {
    const total = allPlayers.length;
    const complete = allPlayers.filter(p => p.profile_completed).length;
    const incomplete = total - complete;
    const withDebt = allPlayers.filter(p => p.debt_status).length;
    
    document.getElementById('totalPlayersReport').textContent = total;
    document.getElementById('completeProfiles').textContent = complete;
    document.getElementById('incompleteProfiles').textContent = incomplete;
    document.getElementById('playersWithDebt').textContent = withDebt;
}

// Renderizar estadísticas por categoría
function renderCategoryStats() {
    const categories = ['femenino', 'mini', 'juvenil', 'elite'];
    const categoryNames = {
        'femenino': 'Femenino',
        'mini': 'Mini',
        'juvenil': 'Juvenil',
        'elite': 'Elite'
    };

    
    const stats = categories.map(cat => {
        const count = allPlayers.filter(p => p.team_category === cat).length;
        return { category: cat, name: categoryNames[cat], count };
    }).filter(s => s.count > 0);
    
    const container = document.getElementById('categoryStats');
    
    if (stats.length === 0) {
        container.innerHTML = '<p class="text-center">No hay jugadores por categoría</p>';
        return;
    }
    
    container.innerHTML = stats.map(stat => `
        <div class="category-stat-item">
            <h4>${stat.name}</h4>
            <div class="stat-number">${stat.count}</div>
            <div class="stat-label">jugadores</div>
        </div>
    `).join('');
}

// Renderizar resumen médico
function renderMedicalSummary() {
    const withAllergies = allPlayers.filter(p => p.allergies && p.allergies.trim() !== '').length;
    const withDiseases = allPlayers.filter(p => p.diseases && p.diseases.trim() !== '').length;
    const withHistory = allPlayers.filter(p => p.medical_history && p.medical_history.trim() !== '').length;
    
    const container = document.getElementById('medicalSummary');
    container.innerHTML = `
        <div class="medical-stat">
            <h4>${withAllergies}</h4>
            <p>Con Alergias</p>
        </div>
        <div class="medical-stat">
            <h4>${withDiseases}</h4>
            <p>Con Enfermedades</p>
        </div>
        <div class="medical-stat">
            <h4>${withHistory}</h4>
            <p>Con Historial Médico</p>
        </div>
    `;
}

// Renderizar resumen educativo
function renderEducationSummary() {
    const educationLevels = {};
    allPlayers.forEach(p => {
        const level = p.education_level || 'No registrado';
        educationLevels[level] = (educationLevels[level] || 0) + 1;
    });
    
    const container = document.getElementById('educationSummary');
    
    if (Object.keys(educationLevels).length === 0) {
        container.innerHTML = '<p class="text-center">No hay información educativa registrada</p>';
        return;
    }
    
    const levelNames = {
        'primaria': 'Primaria',
        'secundaria': 'Secundaria',
        'tecnico': 'Técnico',
        'universitario': 'Universitario',
        'profesional': 'Profesional',
        'otro': 'Otro',
        'No registrado': 'No registrado'
    };
    
    container.innerHTML = Object.entries(educationLevels).map(([level, count]) => `
        <div class="education-item">
            <span>${levelNames[level] || level}</span>
            <span>${count} jugadores</span>
        </div>
    `).join('');
}

// Renderizar lista de jugadores con información incompleta
function renderIncompleteList() {
    const incomplete = allPlayers.filter(p => !p.profile_completed);
    const container = document.getElementById('incompleteList');
    
    if (incomplete.length === 0) {
        container.innerHTML = '<p class="text-center">¡Todos los jugadores tienen su perfil completo!</p>';
        return;
    }
    
    container.innerHTML = incomplete.slice(0, 5).map(player => {
        const missingFields = getMissingFields(player);
        return `
            <div class="incomplete-item">
                <div>
                    <div class="player-name">${player.name}</div>
                    <div class="missing-fields">Faltante: ${missingFields.join(', ')}</div>
                </div>
                <button class="action-btn" onclick="viewReportDetail('${player._id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        `;
    }).join('') + (incomplete.length > 5 ? 
        `<p class="text-center" style="margin-top: 10px;">Y ${incomplete.length - 5} jugadores más...</p>` : '');
}

// Obtener campos faltantes
function getMissingFields(player) {
    const requiredFields = ['document_type', 'document_number', 'birth_date', 'phone', 'address'];
    const fieldNames = {
        'document_type': 'Tipo de documento',
        'document_number': 'Número de documento',
        'birth_date': 'Fecha de nacimiento',
        'phone': 'Teléfono',
        'address': 'Dirección'
    };
    
    return requiredFields
        .filter(field => !player[field])
        .map(field => fieldNames[field]);
}

// Aplicar filtros
function applyFilters() {
    const category = document.getElementById('filterCategory').value;
    const profileStatus = document.getElementById('filterProfileStatus').value;
    const debtStatus = document.getElementById('filterDebtStatus').value;
    const medical = document.getElementById('filterMedical').value;
    const search = document.getElementById('searchReport').value.toLowerCase();
    const minAge = parseInt(document.getElementById('filterMinAge').value) || 0;
    const maxAge = parseInt(document.getElementById('filterMaxAge').value) || 999;
    const sortBy = document.getElementById('sortBy').value;
    
    filteredPlayers = allPlayers.filter(player => {
        // Filtro por categoría
        if (category && player.team_category !== category) return false;
        
        // Filtro por estado de perfil
        if (profileStatus === 'complete' && !player.profile_completed) return false;
        if (profileStatus === 'incomplete' && player.profile_completed) return false;
        
        // Filtro por estado de deuda
        if (debtStatus === 'withDebt' && !player.debt_status) return false;
        if (debtStatus === 'noDebt' && player.debt_status) return false;
        
        // Filtro por información médica
        if (medical === 'withAllergies' && (!player.allergies || player.allergies.trim() === '')) return false;
        if (medical === 'withDiseases' && (!player.diseases || player.diseases.trim() === '')) return false;
        if (medical === 'withMedicalHistory' && (!player.medical_history || player.medical_history.trim() === '')) return false;
        
        // Filtro por edad
        const age = calculateAge(player.birth_date);
        if (age && (age < minAge || age > maxAge)) return false;
        
        // Filtro por búsqueda
        if (search) {
            const searchFields = [
                player.name,
                player.email,
                player.document_number,
                player.phone
            ].filter(Boolean).join(' ').toLowerCase();
            
            if (!searchFields.includes(search)) return false;
        }
        
        return true;
    });
    
    // Ordenar
    filteredPlayers.sort((a, b) => {
        switch(sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'age':
                return calculateAge(a.birth_date) - calculateAge(b.birth_date);
            case 'category':
                return (a.team_category || '').localeCompare(b.team_category || '');
            case 'registration':
                return new Date(b.created_at) - new Date(a.created_at);
            default:
                return 0;
        }
    });
    
    renderReportsTable();
}

// Renderizar tabla de informes
function renderReportsTable() {
    const tbody = document.getElementById('reportsTableBody');
    const noResults = document.getElementById('noResults');
    
    if (filteredPlayers.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    tbody.innerHTML = filteredPlayers.map(player => {
        const age = calculateAge(player.birth_date);
        const hasMedicalInfo = player.allergies || player.diseases || player.medical_history;
        
        return `
            <tr>
                <td>
                    <div class="player-cell">
                        ${player.photo_url ? 
                            `<img src="${player.photo_url}" alt="${player.name}">` : 
                            `<div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white;">
                                <i class="fas fa-user"></i>
                            </div>`
                        }
                        <div class="player-info">
                            <span class="player-name">${player.name}</span>
                            <span class="player-email">${player.email}</span>
                        </div>
                    </div>
                </td>
                <td>${player.team_category || 'No asignada'}</td>
                <td>${age ? age + ' años' : 'N/A'}</td>
                <td>${player.phone || 'No registrado'}</td>
                <td>
                    <span class="status-badge ${player.profile_completed ? 'complete' : 'incomplete'}">
                        <i class="fas ${player.profile_completed ? 'fa-check' : 'fa-exclamation'}"></i>
                        ${player.profile_completed ? 'Completo' : 'Incompleto'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${player.debt_status ? 'debt-yes' : 'debt-no'}">
                        <i class="fas ${player.debt_status ? 'fa-exclamation' : 'fa-check'}"></i>
                        ${player.debt_status ? 'Con deuda' : 'Sin deuda'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${hasMedicalInfo ? 'medical-yes' : 'medical-no'}">
                        <i class="fas ${hasMedicalInfo ? 'fa-heartbeat' : 'fa-minus'}"></i>
                        ${hasMedicalInfo ? 'Registrada' : 'No registrada'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewReportDetail('${player._id}')" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Ver detalle en modal
function viewReportDetail(id) {
    const player = allPlayers.find(p => p._id === id);
    if (!player) return;
    
    currentPlayerDetail = player;
    
    const modalTitle = document.getElementById('detailModalTitle');
    const modalContent = document.getElementById('detailModalContent');
    
    modalTitle.innerHTML = `<i class="fas fa-user"></i> ${player.name}`;
    
    const age = calculateAge(player.birth_date);
    const emergency = player.emergency_contact || {};
    
    modalContent.innerHTML = `
        <div class="detail-section">
            <h4><i class="fas fa-id-card"></i> Información Personal</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Email</label>
                    <span>${player.email}</span>
                </div>
                <div class="detail-item">
                    <label>Teléfono</label>
                    <span>${player.phone || 'No registrado'}</span>
                </div>
                <div class="detail-item">
                    <label>Documento</label>
                    <span>${player.document_type || 'N/A'} ${player.document_number || ''}</span>
                </div>
                <div class="detail-item">
                    <label>Edad</label>
                    <span>${age ? age + ' años' : 'No registrada'}</span>
                </div>
                <div class="detail-item full-width">
                    <label>Dirección</label>
                    <span>${player.address || 'No registrada'}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-heartbeat"></i> Información Médica</h4>
            <div class="detail-grid">
                <div class="detail-item full-width">
                    <label>Alergias</label>
                    <span>${player.allergies || 'No registradas'}</span>
                </div>
                <div class="detail-item full-width">
                    <label>Enfermedades</label>
                    <span>${player.diseases || 'No registradas'}</span>
                </div>
                <div class="detail-item full-width">
                    <label>Historial Médico</label>
                    <span>${player.medical_history || 'No registrado'}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-phone-alt"></i> Contacto de Emergencia</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Nombre</label>
                    <span>${emergency.name || 'No registrado'}</span>
                </div>
                <div class="detail-item">
                    <label>Teléfono</label>
                    <span>${emergency.phone || 'No registrado'}</span>
                </div>
                <div class="detail-item">
                    <label>Parentesco</label>
                    <span>${emergency.relationship || 'No registrado'}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-info-circle"></i> Estado en el Sistema</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Perfil</label>
                    <span class="status-badge ${player.profile_completed ? 'complete' : 'incomplete'}">
                        ${player.profile_completed ? 'Completo' : 'Incompleto'}
                    </span>
                </div>
                <div class="detail-item">
                    <label>Deuda</label>
                    <span class="status-badge ${player.debt_status ? 'debt-yes' : 'debt-no'}">
                        ${player.debt_status ? 'Con deuda pendiente' : 'Sin deuda'}
                    </span>
                </div>
                <div class="detail-item">
                    <label>Categoría</label>
                    <span>${player.team_category || 'No asignada'}</span>
                </div>
                <div class="detail-item">
                    <label>Registro</label>
                    <span>${player.created_at ? new Date(player.created_at).toLocaleDateString('es-ES') : 'N/A'}</span>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('reportDetailModal').classList.add('active');
}

// Cerrar modal de detalle
function closeReportDetailModal() {
    document.getElementById('reportDetailModal').classList.remove('active');
    currentPlayerDetail = null;
}

// Ver perfil completo del jugador
function viewPlayerFull() {
    if (currentPlayerDetail) {
        closeReportDetailModal();
        // Redirigir a la página de jugadores con el ID para ver el perfil completo
        localStorage.setItem('viewPlayerId', currentPlayerDetail._id);
        window.location.href = 'players.html';
    }
}

// Exportar reporte
function exportReport() {
    // Crear CSV con los datos filtrados
    const headers = ['Nombre', 'Email', 'Categoría', 'Edad', 'Teléfono', 'Perfil Completo', 'Deuda', 'Fecha Registro'];
    
    const rows = filteredPlayers.map(p => [
        p.name,
        p.email,
        p.team_category || 'N/A',
        calculateAge(p.birth_date) || 'N/A',
        p.phone || 'N/A',
        p.profile_completed ? 'Sí' : 'No',
        p.debt_status ? 'Sí' : 'No',
        p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES') : 'N/A'
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `informe_jugadores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Informe exportado correctamente', 'success');
}

// Calcular edad
function calculateAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
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
        element.innerHTML = '<tr><td colspan="8" class="text-center"><div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div></td></tr>';
    }
}
