// ============================================
// SISTEMAS DE JUEGO - EDITOR (ADMIN)
// ============================================

// Estado global
let currentFormation = {
    _id: null,
    name: '',
    code: '',
    play_type: 'ataque',
    team_category: 'all',
    description: '',
    total_steps: 1,
    steps: [],
    starting_positions: []
};

let currentStepIndex = 0;
let players = []; // Array de jugadores en el campo
let isPlaying = false;
let animationSpeed = 1;
let deleteFormationId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadFormations();
    initializeCourt();
    setupEventListeners();
});

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const canManageFormations = user.role === 'admin' || user.role === 'assistant';

    if (!token || !canManageFormations) {
        window.location.href = '../index.html';
        return;
    }
    
    document.getElementById('userName').textContent = user.name || 'Usuario';
}

// Configurar event listeners
function setupEventListeners() {
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
        });
    }
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            mobileOverlay.classList.remove('active');
        });
    }
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                if (modal.id === 'formationModal') {
                    closeFormationModal();
                } else if (modal.id === 'deleteModal') {
                    closeDeleteModal();
                }
            }
        });
    });
}

// Inicializar cancha con 5 jugadores
function initializeCourt() {
    const playersLayer = document.getElementById('playersLayer');
    if (!playersLayer) return;
    
    playersLayer.innerHTML = '';
    players = [];
    
    // Posiciones iniciales (formación básica)
    const initialPositions = [
        { x: 50, y: 15 },   // P1 - Base
        { x: 25, y: 35 },   // P2 - Escolta
        { x: 75, y: 35 },   // P3 - Alero
        { x: 35, y: 65 },   // P4 - Ala-pívot
        { x: 65, y: 65 }    // P5 - Pívot
    ];
    
    for (let i = 1; i <= 5; i++) {
        const player = createPlayerElement(i, initialPositions[i-1]);
        playersLayer.appendChild(player.element);
        players.push(player);
    }
    
    // Inicializar primer paso si no existe
    if (currentFormation.steps.length === 0) {
        addStep();
    }
}

// Crear elemento de jugador
function createPlayerElement(number, position) {
    const div = document.createElement('div');
    div.className = 'court-player';
    div.id = `player-${number}`;
    div.style.left = `${position.x}%`;
    div.style.top = `${position.y}%`;
    
    div.innerHTML = `
        <div class="player-controls">
            <button class="btn-ball" onclick="toggleBall(${number})" title="Tiene balón">
                <i class="fas fa-basketball-ball"></i>
            </button>
        </div>
        <div class="player-jersey" id="jersey-${number}">
            ${number}
        </div>
        <div class="player-label">J${number}</div>
    `;
    
    // Hacer draggable
    makeDraggable(div, number);
    
    return {
        number: number,
        element: div,
        x: position.x,
        y: position.y,
        hasBall: false
    };
}

// Auto-save con debounce
let autoSaveTimeout = null;
let lastSavedPositions = null;

function debouncedAutoSave() {
    // Cancelar timeout anterior
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    
    // Mostrar indicador de "Guardando..."
    showAutoSaveIndicator('Guardando...');
    
    // Guardar después de 300ms de inactividad
    autoSaveTimeout = setTimeout(() => {
        saveCurrentStepPositions();
        const currentPositions = JSON.stringify(players.map(p => ({x: p.x, y: p.y, hasBall: p.hasBall})));
        
        if (currentPositions !== lastSavedPositions) {
            lastSavedPositions = currentPositions;
            showAutoSaveIndicator('Guardado ✓');
        } else {
            hideAutoSaveIndicator();
        }
    }, 300);
}

function showAutoSaveIndicator(text) {
    let indicator = document.getElementById('autoSaveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'autoSaveIndicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            z-index: 10000;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(indicator);
    }
    indicator.textContent = text;
    indicator.style.opacity = '1';
    indicator.style.transform = 'translateY(0)';
}

function hideAutoSaveIndicator() {
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateY(10px)';
    }
}

// Hacer jugador arrastrable
function makeDraggable(element, playerNumber) {
    let isDragging = false;
    let startX, startY;
    let startPercentX, startPercentY;
    
    element.addEventListener('mousedown', (e) => {
        if (e.target.closest('.player-controls')) return;
        
        isDragging = true;
        element.classList.add('dragging');
        
        const court = document.getElementById('basketballCourt');
        const courtRect = court.getBoundingClientRect();
        
        // Store starting mouse position
        startX = e.clientX;
        startY = e.clientY;
        
        // Get current player position in percentages
        const player = players.find(p => p.number === playerNumber);
        if (player) {
            startPercentX = player.x;
            startPercentY = player.y;
        }
        
        element.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const court = document.getElementById('basketballCourt');
        const courtRect = court.getBoundingClientRect();
        
        // Calculate mouse movement in pixels
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // Convert to percentage movement
        const deltaPercentX = (deltaX / courtRect.width) * 100;
        const deltaPercentY = (deltaY / courtRect.height) * 100;
        
        // Calculate new position in percentages
        let newPercentX = startPercentX + deltaPercentX;
        let newPercentY = startPercentY + deltaPercentY;
        
        // Limit to court bounds (4% to 96% to keep player visible)
        newPercentX = Math.max(4, Math.min(newPercentX, 96));
        newPercentY = Math.max(4, Math.min(newPercentY, 96));
        
        // Update element position (always in percentages)
        element.style.left = `${newPercentX}%`;
        element.style.top = `${newPercentY}%`;
        
        // Update player data
        const player = players.find(p => p.number === playerNumber);
        if (player) {
            player.x = newPercentX;
            player.y = newPercentY;
        }
        
        // Auto-save durante el arrastre (con debounce)
        debouncedAutoSave();
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            element.classList.remove('dragging');
            element.style.cursor = 'grab';
            // Guardar inmediatamente al soltar
            saveCurrentStepPositions();
            showAutoSaveIndicator('Guardado ✓');
            lastSavedPositions = JSON.stringify(players.map(p => ({x: p.x, y: p.y, hasBall: p.hasBall})));
        }
    });
    
    // Touch support for mobile
    element.addEventListener('touchstart', (e) => {
        if (e.target.closest('.player-controls')) return;
        
        isDragging = true;
        element.classList.add('dragging');
        
        const court = document.getElementById('basketballCourt');
        const touch = e.touches[0];
        
        startX = touch.clientX;
        startY = touch.clientY;
        
        const player = players.find(p => p.number === playerNumber);
        if (player) {
            startPercentX = player.x;
            startPercentY = player.y;
        }
        
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const court = document.getElementById('basketballCourt');
        const courtRect = court.getBoundingClientRect();
        const touch = e.touches[0];
        
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        
        const deltaPercentX = (deltaX / courtRect.width) * 100;
        const deltaPercentY = (deltaY / courtRect.height) * 100;
        
        let newPercentX = startPercentX + deltaPercentX;
        let newPercentY = startPercentY + deltaPercentY;
        
        newPercentX = Math.max(4, Math.min(newPercentX, 96));
        newPercentY = Math.max(4, Math.min(newPercentY, 96));
        
        element.style.left = `${newPercentX}%`;
        element.style.top = `${newPercentY}%`;
        
        const player = players.find(p => p.number === playerNumber);
        if (player) {
            player.x = newPercentX;
            player.y = newPercentY;
        }
        
        debouncedAutoSave();
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            element.classList.remove('dragging');
            saveCurrentStepPositions();
            showAutoSaveIndicator('Guardado ✓');
            lastSavedPositions = JSON.stringify(players.map(p => ({x: p.x, y: p.y, hasBall: p.hasBall})));
        }
    });
}



// Toggle balón para un jugador
function toggleBall(playerNumber) {
    const player = players.find(p => p.number === playerNumber);
    if (!player) return;
    
    // Quitar balón de todos los demás
    players.forEach(p => {
        p.hasBall = false;
        const jersey = document.getElementById(`jersey-${p.number}`);
        const btn = document.querySelector(`#player-${p.number} .btn-ball`);
        if (jersey) jersey.classList.remove('has-ball');
        if (btn) btn.classList.remove('active');
    });
    
    // Dar balón al seleccionado
    player.hasBall = true;
    const jersey = document.getElementById(`jersey-${playerNumber}`);
    const btn = document.querySelector(`#player-${playerNumber} .btn-ball`);
    if (jersey) jersey.classList.add('has-ball');
    if (btn) btn.classList.add('active');
    
    // Actualizar posición del balón visual
    updateBasketballPosition();
    
    // Auto-save al cambiar el balón
    saveCurrentStepPositions();
    showAutoSaveIndicator('Guardado ✓');
    lastSavedPositions = JSON.stringify(players.map(p => ({x: p.x, y: p.y, hasBall: p.hasBall})));
}


// Actualizar posición visual del balón
function updateBasketballPosition() {
    const ball = document.getElementById('basketball');
    const playerWithBall = players.find(p => p.hasBall);
    
    if (playerWithBall && ball) {
        const court = document.getElementById('basketballCourt');
        ball.style.display = 'flex';
        ball.style.left = `${playerWithBall.x}%`;
        ball.style.top = `${playerWithBall.y}%`;
    } else if (ball) {
        ball.style.display = 'none';
    }
}

// Agregar nuevo paso
function addStep() {
    const stepNumber = currentFormation.steps.length + 1;
    
    // Guardar posiciones actuales antes de crear nuevo paso
    const currentPositions = players.map(p => ({
        player_number: p.number,
        position_x: p.x,
        position_y: p.y,
        has_ball: p.hasBall,
        action: p.hasBall ? 'dribble' : 'move',
        action_description: ''
    }));
    
    const newStep = {
        step_number: stepNumber,
        duration: parseInt(document.getElementById('stepDuration')?.value) || 2000,
        description: document.getElementById('stepDescription')?.value || `Paso ${stepNumber}`,
        player_movements: currentPositions,
        ball_position: null
    };
    
    currentFormation.steps.push(newStep);
    currentFormation.total_steps = currentFormation.steps.length;
    
    renderStepsTimeline();
    goToStep(stepNumber - 1);
    updateStepCounter();
}

// Eliminar paso actual
function removeCurrentStep() {
    if (currentFormation.steps.length <= 1) {
        alert('Debe haber al menos un paso');
        return;
    }
    
    currentFormation.steps.splice(currentStepIndex, 1);
    
    // Reenumerar pasos
    currentFormation.steps.forEach((step, idx) => {
        step.step_number = idx + 1;
    });
    
    currentFormation.total_steps = currentFormation.steps.length;
    
    // Ajustar índice actual
    if (currentStepIndex >= currentFormation.steps.length) {
        currentStepIndex = currentFormation.steps.length - 1;
    }
    
    renderStepsTimeline();
    goToStep(currentStepIndex);
    updateStepCounter();
}

// Ir a un paso específico
function goToStep(index) {
    if (index < 0 || index >= currentFormation.steps.length) return;
    
    currentStepIndex = index;
    const step = currentFormation.steps[index];
    
    // Actualizar UI
    document.getElementById('stepDescription').value = step.description || '';
    document.getElementById('stepDuration').value = step.duration || 2000;
    updateDurationDisplay();
    
    // Actualizar jugadores en el campo
    if (step.player_movements && step.player_movements.length > 0) {
        step.player_movements.forEach(movement => {
            const player = players.find(p => p.number === movement.player_number);
            if (player) {
                player.x = movement.position_x;
                player.y = movement.position_y;
                player.hasBall = movement.has_ball || false;
                
                // Actualizar posición visual
                player.element.style.left = `${player.x}%`;
                player.element.style.top = `${player.y}%`;
                
                // Actualizar estado del balón
                const jersey = document.getElementById(`jersey-${player.number}`);
                const btn = document.querySelector(`#player-${player.number} .btn-ball`);
                
                if (player.hasBall) {
                    if (jersey) jersey.classList.add('has-ball');
                    if (btn) btn.classList.add('active');
                } else {
                    if (jersey) jersey.classList.remove('has-ball');
                    if (btn) btn.classList.remove('active');
                }
            }
        });
        
        updateBasketballPosition();
    }
    
    // Actualizar timeline visual
    document.querySelectorAll('.step-item').forEach((item, idx) => {
        item.classList.toggle('active', idx === currentStepIndex);
    });
    
    updateStepCounter();
}

// Renderizar timeline de pasos
function renderStepsTimeline() {
    const container = document.getElementById('stepsTimeline');
    if (!container) return;
    
    container.innerHTML = '';
    
    currentFormation.steps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = `step-item ${index === currentStepIndex ? 'active' : ''}`;
        stepEl.onclick = () => goToStep(index);
        
        stepEl.innerHTML = `
            <div class="step-number">${step.step_number}</div>
            <div class="step-info">
                <div class="step-title">${step.description || `Paso ${step.step_number}`}</div>
                <div class="step-duration">${step.duration}ms</div>
            </div>
        `;
        
        container.appendChild(stepEl);
    });
    
    // Mostrar/ocultar botón de eliminar
    const removeBtn = document.getElementById('removeStepBtn');
    if (removeBtn) {
        removeBtn.style.display = currentFormation.steps.length > 1 ? 'flex' : 'none';
    }
}

// Actualizar contador de pasos
function updateStepCounter() {
    const counter = document.getElementById('stepCounter');
    if (counter) {
        counter.textContent = `Paso ${currentStepIndex + 1} de ${currentFormation.steps.length}`;
    }
}

// Guardar posiciones del paso actual
function saveCurrentStepPositions() {
    if (currentFormation.steps[currentStepIndex]) {
        currentFormation.steps[currentStepIndex].player_movements = players.map(p => ({
            player_number: p.number,
            position_x: p.x,
            position_y: p.y,
            has_ball: p.hasBall,
            action: p.hasBall ? 'dribble' : 'move',
            action_description: ''
        }));
        
        // Actualizar descripción y duración
        const descInput = document.getElementById('stepDescription');
        const durationInput = document.getElementById('stepDuration');
        
        if (descInput) currentFormation.steps[currentStepIndex].description = descInput.value;
        if (durationInput) currentFormation.steps[currentStepIndex].duration = parseInt(durationInput.value) || 2000;
        
        renderStepsTimeline();
    }
}

// Actualizar display de duración
function updateDurationDisplay() {
    const display = document.getElementById('durationDisplay');
    const input = document.getElementById('stepDuration');
    if (display && input) {
        display.textContent = `${input.value}ms`;
    }
}

// Navegación entre pasos
function previousStep() {
    if (currentStepIndex > 0) {
        saveCurrentStepPositions();
        goToStep(currentStepIndex - 1);
    }
}

function nextStep() {
    if (currentStepIndex < currentFormation.steps.length - 1) {
        saveCurrentStepPositions();
        goToStep(currentStepIndex + 1);
    }
}

// Reproducir preview de animación
async function playPreview() {
    if (isPlaying || currentFormation.steps.length < 2) return;
    
    isPlaying = true;
    const playBtn = document.querySelector('.btn-play i');
    if (playBtn) playBtn.className = 'fas fa-pause';
    
    // Guardar posición actual
    const startIndex = currentStepIndex;
    
    for (let i = 0; i < currentFormation.steps.length - 1; i++) {
        if (!isPlaying) break; // Permitir cancelar
        
        await animateBetweenSteps(i, i + 1);
        currentStepIndex = i + 1;
        updateStepCounter();
        renderStepsTimeline();
    }
    
    isPlaying = false;
    if (playBtn) playBtn.className = 'fas fa-play';
}

// Animar entre dos pasos
function animateBetweenSteps(fromIndex, toIndex) {
    return new Promise((resolve) => {
        const fromStep = currentFormation.steps[fromIndex];
        const toStep = currentFormation.steps[toIndex];
        const duration = (toStep.duration || 2000) / animationSpeed;
        
        const startTime = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing suave (ease-in-out)
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            // Interpolar posiciones
            toStep.player_movements.forEach((toPos, idx) => {
                const fromPos = fromStep.player_movements.find(p => p.player_number === toPos.player_number);
                const player = players.find(p => p.number === toPos.player_number);
                
                if (player && fromPos) {
                    const currentX = fromPos.position_x + (toPos.position_x - fromPos.position_x) * easeProgress;
                    const currentY = fromPos.position_y + (toPos.position_y - fromPos.position_y) * easeProgress;
                    
                    player.element.style.left = `${currentX}%`;
                    player.element.style.top = `${currentY}%`;
                    player.x = currentX;
                    player.y = currentY;
                    
                    // Actualizar balón
                    if (toPos.has_ball && progress > 0.5) {
                        player.hasBall = true;
                        document.getElementById(`jersey-${player.number}`)?.classList.add('has-ball');
                    } else if (!toPos.has_ball) {
                        player.hasBall = false;
                        document.getElementById(`jersey-${player.number}`)?.classList.remove('has-ball');
                    }
                }
            });
            
            updateBasketballPosition();
            
            if (progress < 1 && isPlaying) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        
        requestAnimationFrame(animate);
    });
}

// Actualizar velocidad de preview
function updatePreviewSpeed() {
    const select = document.getElementById('previewSpeed');
    if (select) {
        animationSpeed = parseFloat(select.value);
    }
}

// ============================================
// CRUD OPERATIONS
// ============================================

// Cargar lista de sistemas
async function loadFormations() {
    try {
        const typeFilter = document.getElementById('typeFilter')?.value || 'all';
        const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
        
        const response = await fetch(`${API_URL}/formations?type=${typeFilter}&category=${categoryFilter}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error cargando sistemas');
        
        const formations = await response.json();
        renderFormationsList(formations);
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar sistemas de juego', 'error');
    }
}

// Renderizar lista de sistemas
function renderFormationsList(formations) {
    const container = document.getElementById('formationsList');
    const emptyState = document.getElementById('noFormations');
    
    if (!container) return;
    
    if (formations.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    container.innerHTML = formations.map(formation => `
        <div class="formation-card" onclick="viewFormation('${formation._id}')">
            <div class="formation-card-header ${formation.play_type}">
                <div class="formation-badges">
                    <span class="badge">${formation.play_type}</span>
                    ${formation.team_category !== 'all' ? `<span class="badge">${formation.team_category}</span>` : ''}
                </div>
                <h3>${formation.name}</h3>
                <div class="formation-code">${formation.code}</div>
            </div>
            <div class="formation-card-body">
                <div class="formation-preview">
                    <svg viewBox="0 0 100 100">
                        <rect x="10" y="10" width="80" height="80" fill="#c17f59" stroke="white" stroke-width="2"/>
                        <circle cx="50" cy="50" r="15" fill="none" stroke="white" stroke-width="1"/>
                        ${formation.steps && formation.steps[0] ? formation.steps[0].player_movements.map((p, i) => `
                            <circle cx="${p.position_x}" cy="${p.position_y}" r="4" 
                                    fill="${p.has_ball ? '#ffd93d' : '#ff6b6b'}" stroke="white" stroke-width="1"/>
                        `).join('') : ''}
                    </svg>
                </div>
                <div class="formation-info">
                    <span class="formation-steps">
                        <i class="fas fa-list-ol"></i> ${formation.total_steps} pasos
                    </span>
                    <span class="formation-date">
                        ${new Date(formation.created_at).toLocaleDateString()}
                    </span>
                </div>
                <p class="formation-description">${formation.description || 'Sin descripción'}</p>
            </div>
            <div class="formation-card-footer">
                <button class="btn-view" onclick="event.stopPropagation(); viewFormation('${formation._id}')">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn-edit" onclick="event.stopPropagation(); editFormation('${formation._id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-delete" onclick="event.stopPropagation(); confirmDeleteFormation('${formation._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Filtrar sistemas
function filterFormations() {
    loadFormations();
}

// Abrir modal para crear
function openFormationModal() {
    // Resetear estado
    currentFormation = {
        _id: null,
        name: '',
        code: '',
        play_type: 'ataque',
        team_category: 'all',
        description: '',
        total_steps: 1,
        steps: [],
        starting_positions: []
    };
    
    currentStepIndex = 0;
    
    // Resetear formulario
    document.getElementById('modalTitle').textContent = 'Crear Sistema de Juego';
    document.getElementById('formationName').value = '';
    document.getElementById('formationCode').value = '';
    document.getElementById('formationType').value = 'ataque';
    document.getElementById('formationCategory').value = 'all';
    document.getElementById('formationDescription').value = '';
    
    // Reiniciar cancha
    initializeCourt();
    
    // Mostrar modal
    document.getElementById('formationModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Cerrar modal
function closeFormationModal() {
    document.getElementById('formationModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    isPlaying = false;
}

// Ver formación (preview)
async function viewFormation(id) {
    try {
        const response = await fetch(`${API_URL}/formations/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error cargando sistema');
        
        const formation = await response.json();
        
        // Cargar en modo vista (similar a editar pero solo lectura)
        // Por ahora, abrimos en modo edición
        editFormation(id);
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar el sistema', 'error');
    }
}

// Editar formación
async function editFormation(id) {
    try {
        const response = await fetch(`${API_URL}/formations/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error cargando sistema');
        
        const formation = await response.json();
        
        // Cargar datos
        currentFormation = { ...formation };
        currentStepIndex = 0;
        
        // Llenar formulario
        document.getElementById('modalTitle').textContent = 'Editar Sistema de Juego';
        document.getElementById('formationName').value = formation.name || '';
        document.getElementById('formationCode').value = formation.code || '';
        document.getElementById('formationType').value = formation.play_type || 'ataque';
        document.getElementById('formationCategory').value = formation.team_category || 'all';
        document.getElementById('formationDescription').value = formation.description || '';
        
        // Cargar primer paso en la cancha
        if (formation.steps && formation.steps.length > 0) {
            const firstStep = formation.steps[0];
            if (firstStep.player_movements) {
                firstStep.player_movements.forEach(movement => {
                    const player = players.find(p => p.number === movement.player_number);
                    if (player) {
                        player.x = movement.position_x;
                        player.y = movement.position_y;
                        player.hasBall = movement.has_ball || false;
                        
                        player.element.style.left = `${player.x}%`;
                        player.element.style.top = `${player.y}%`;
                        
                        const jersey = document.getElementById(`jersey-${player.number}`);
                        const btn = document.querySelector(`#player-${player.number} .btn-ball`);
                        
                        if (player.hasBall) {
                            if (jersey) jersey.classList.add('has-ball');
                            if (btn) btn.classList.add('active');
                        } else {
                            if (jersey) jersey.classList.remove('has-ball');
                            if (btn) btn.classList.remove('active');
                        }
                    }
                });
                
                updateBasketballPosition();
            }
        }
        
        renderStepsTimeline();
        updateStepCounter();
        
        // Mostrar modal
        document.getElementById('formationModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar el sistema', 'error');
    }
}

// Guardar formación (crear o actualizar)
async function saveFormation() {
    // Validar
    const name = document.getElementById('formationName').value.trim();
    const code = document.getElementById('formationCode').value.trim();
    
    if (!name || !code) {
        alert('Por favor completa el nombre y código del sistema');
        return;
    }
    
    // Guardar paso actual antes de enviar
    saveCurrentStepPositions();
    
    // Asegurar que hay al menos un paso
    if (!currentFormation.steps || currentFormation.steps.length === 0) {
        // Crear paso inicial con posiciones actuales
        const initialPositions = players.map(p => ({
            player_number: p.number,
            position_x: p.x,
            position_y: p.y,
            has_ball: p.hasBall,
            action: p.hasBall ? 'dribble' : 'move',
            action_description: ''
        }));
        
        currentFormation.steps = [{
            step_number: 1,
            duration: 2000,
            description: 'Posición inicial',
            player_movements: initialPositions,
            ball_position: null
        }];
    }
    
    // Asegurar que cada paso tenga player_movements válido
    currentFormation.steps = currentFormation.steps.map((step, index) => ({
        step_number: step.step_number || (index + 1),
        duration: step.duration || 2000,
        description: step.description || `Paso ${index + 1}`,
        player_movements: step.player_movements || [],
        ball_position: step.ball_position || null
    }));
    
    // Preparar datos
    const formationData = {
        name: name,
        code: code,
        play_type: document.getElementById('formationType').value || 'ataque',
        team_category: document.getElementById('formationCategory').value || 'all',
        description: document.getElementById('formationDescription').value || '',
        total_steps: currentFormation.steps.length,
        steps: currentFormation.steps,
        starting_positions: currentFormation.steps[0]?.player_movements || []
    };
    
    console.log('Guardando sistema:', formationData);
    
    try {
        const url = currentFormation._id 
            ? `${API_URL}/formations/${currentFormation._id}`
            : `${API_URL}/formations`;
        
        const method = currentFormation._id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {

            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formationData)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            console.error('Error del servidor:', responseData);
            throw new Error(responseData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        console.log('Sistema guardado:', responseData);
        
        showNotification(
            currentFormation._id ? 'Sistema actualizado correctamente' : 'Sistema creado correctamente',
            'success'
        );
        
        closeFormationModal();
        loadFormations();
        
    } catch (error) {
        console.error('Error completo:', error);
        showNotification(error.message || 'Error al guardar el sistema. Revisa la consola para más detalles.', 'error');
    }
}


// Confirmar eliminación
function confirmDeleteFormation(id) {
    deleteFormationId = id;
    document.getElementById('deleteModal').style.display = 'block';
}

// Cerrar modal de eliminación
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteFormationId = null;
}

// Confirmar y ejecutar eliminación
async function confirmDelete() {
    if (!deleteFormationId) return;
    
    try {
        const response = await fetch(`${API_URL}/formations/${deleteFormationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error eliminando sistema');
        
        showNotification('Sistema eliminado correctamente', 'success');
        closeDeleteModal();
        loadFormations();
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar el sistema', 'error');
    }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Estilos inline para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

// Animaciones CSS para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
