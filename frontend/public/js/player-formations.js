// ============================================
// SISTEMAS DE JUEGO - VISUALIZADOR (JUGADOR)
// ============================================

// Estado global
let currentFormation = null;
let currentStepIndex = 0;
let isAnimating = false;
let animationSpeed = 1;
let players = [];
let animationTimeout = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadFormations();
    setupEventListeners();
});

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    
    document.getElementById('userName').textContent = user.name || 'Jugador';
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
        const modal = document.getElementById('viewerModal');
        if (e.target === modal) {
            closeViewerModal();
        }
    });
}

// Cargar sistemas disponibles
async function loadFormations() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const category = user.team_category || 'all';
        const typeFilter = document.getElementById('typeFilter')?.value || 'all';
        
        const response = await fetch(`/api/formations?category=${category}&type=${typeFilter}`, {
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
        <div class="formation-card" onclick="openFormationViewer('${formation._id}')">
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
                <div class="formation-card-footer" style="justify-content: center;">
                    <button class="btn-view" onclick="event.stopPropagation(); openFormationViewer('${formation._id}')">
                        <i class="fas fa-play"></i> Ver Animación
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtrar sistemas
function filterFormations() {
    loadFormations();
}

// Abrir visualizador de formación
async function openFormationViewer(id) {
    try {
        const response = await fetch(`/api/formations/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error cargando sistema');
        
        currentFormation = await response.json();
        currentStepIndex = 0;
        
        // Actualizar información
        document.getElementById('viewerTitle').textContent = currentFormation.name;
        document.getElementById('viewerType').textContent = currentFormation.play_type;
        document.getElementById('viewerCategory').textContent = currentFormation.team_category;
        document.getElementById('viewerDescription').textContent = currentFormation.description || '';
        
        // Inicializar jugadores
        initializeViewerPlayers();
        
        // Renderizar lista de pasos
        renderViewerStepsList();
        
        // Mostrar primer paso
        goToStep(0);
        
        // Mostrar modal
        document.getElementById('viewerModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar el sistema', 'error');
    }
}

// Inicializar jugadores en el visualizador
function initializeViewerPlayers() {
    const playersLayer = document.getElementById('viewerPlayersLayer');
    if (!playersLayer) return;
    
    playersLayer.innerHTML = '';
    players = [];
    
    if (!currentFormation || !currentFormation.steps || currentFormation.steps.length === 0) return;
    
    const firstStep = currentFormation.steps[0];
    if (!firstStep.player_movements) return;
    
    firstStep.player_movements.forEach((movement, index) => {
        const player = createViewerPlayer(movement);
        playersLayer.appendChild(player.element);
        players.push(player);
    });
    
    updateViewerBasketball();
}

// Crear elemento de jugador para visualizador
function createViewerPlayer(movement) {
    const div = document.createElement('div');
    div.className = 'court-player';
    div.id = `viewer-player-${movement.player_number}`;
    div.style.left = `${movement.position_x}%`;
    div.style.top = `${movement.position_y}%`;
    
    div.innerHTML = `
        <div class="player-jersey ${movement.has_ball ? 'has-ball' : ''}" id="viewer-jersey-${movement.player_number}">
            ${movement.player_number}
        </div>
        <div class="player-label">J${movement.player_number}</div>
    `;
    
    return {
        number: movement.player_number,
        element: div,
        x: movement.position_x,
        y: movement.position_y,
        hasBall: movement.has_ball || false
    };
}

// Actualizar posición del balón en visualizador
function updateViewerBasketball() {
    const ball = document.getElementById('viewerBasketball');
    const playerWithBall = players.find(p => p.hasBall);
    
    if (playerWithBall && ball) {
        ball.style.display = 'flex';
        ball.style.left = `${playerWithBall.x}%`;
        ball.style.top = `${playerWithBall.y}%`;
    } else if (ball) {
        ball.style.display = 'none';
    }
}

// Renderizar lista de pasos en el visualizador
function renderViewerStepsList() {
    const container = document.getElementById('viewerStepsList');
    if (!container || !currentFormation) return;
    
    container.innerHTML = currentFormation.steps.map((step, index) => `
        <div class="step-thumbnail ${index === currentStepIndex ? 'active' : ''}" 
             onclick="goToStep(${index})"
             data-duration="${step.duration}ms">
            <div class="step-thumbnail-number">${step.step_number}</div>
        </div>
    `).join('');
}

// Ir a un paso específico
function goToStep(index) {
    if (!currentFormation || !currentFormation.steps || index < 0 || index >= currentFormation.steps.length) return;
    
    // Detener animación si está corriendo
    if (isAnimating) {
        stopAnimation();
    }
    
    currentStepIndex = index;
    const step = currentFormation.steps[index];
    
    // Actualizar jugadores
    if (step.player_movements) {
        step.player_movements.forEach(movement => {
            const player = players.find(p => p.number === movement.player_number);
            if (player) {
                player.x = movement.position_x;
                player.y = movement.position_y;
                player.hasBall = movement.has_ball || false;
                
                player.element.style.left = `${player.x}%`;
                player.element.style.top = `${player.y}%`;
                
                const jersey = document.getElementById(`viewer-jersey-${player.number}`);
                if (jersey) {
                    if (player.hasBall) {
                        jersey.classList.add('has-ball');
                    } else {
                        jersey.classList.remove('has-ball');
                    }
                }
            }
        });
        
        updateViewerBasketball();
    }
    
    // Actualizar UI
    document.getElementById('currentStepNum').textContent = index + 1;
    document.getElementById('totalSteps').textContent = currentFormation.steps.length;
    document.getElementById('stepTitle').textContent = `Paso ${index + 1}`;
    document.getElementById('stepDescriptionText').textContent = step.description || 'Sin descripción';
    
    // Actualizar progreso
    const progress = ((index + 1) / currentFormation.steps.length) * 100;
    document.getElementById('animationProgress').style.width = `${progress}%`;
    
    // Actualizar thumbnails
    document.querySelectorAll('.step-thumbnail').forEach((thumb, idx) => {
        thumb.classList.toggle('active', idx === index);
    });
}

// Toggle play/pause
function togglePlayPause() {
    if (isAnimating) {
        stopAnimation();
    } else {
        playAnimation();
    }
}

// Reproducir animación
async function playAnimation() {
    if (!currentFormation || currentFormation.steps.length < 2) return;
    
    isAnimating = true;
    updatePlayButtonState();
    
    // Si estamos en el último paso, reiniciar
    if (currentStepIndex >= currentFormation.steps.length - 1) {
        goToStep(0);
        await wait(500);
    }
    
    // Reproducir desde el paso actual hasta el final
    for (let i = currentStepIndex; i < currentFormation.steps.length - 1; i++) {
        if (!isAnimating) break;
        
        await animateBetweenSteps(i, i + 1);
        currentStepIndex = i + 1;
        updateStepUI();
    }
    
    isAnimating = false;
    updatePlayButtonState();
}

// Animar entre dos pasos
function animateBetweenSteps(fromIndex, toIndex) {
    return new Promise((resolve) => {
        const fromStep = currentFormation.steps[fromIndex];
        const toStep = currentFormation.steps[toIndex];
        const duration = (toStep.duration || 2000) / animationSpeed;
        
        const startTime = performance.now();
        
        function animate(currentTime) {
            if (!isAnimating) {
                resolve();
                return;
            }
            
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing suave
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            // Interpolar posiciones
            toStep.player_movements.forEach(toPos => {
                const fromPos = fromStep.player_movements.find(p => p.player_number === toPos.player_number);
                const player = players.find(p => p.number === toPos.player_number);
                
                if (player && fromPos) {
                    const currentX = fromPos.position_x + (toPos.position_x - fromPos.position_x) * easeProgress;
                    const currentY = fromPos.position_y + (toPos.position_y - fromPos.position_y) * easeProgress;
                    
                    player.element.style.left = `${currentX}%`;
                    player.element.style.top = `${currentY}%`;
                    player.x = currentX;
                    player.y = currentY;
                    
                    // Actualizar balón durante la animación
                    if (toPos.has_ball && progress > 0.3) {
                        if (!player.hasBall) {
                            player.hasBall = true;
                            document.getElementById(`viewer-jersey-${player.number}`)?.classList.add('has-ball');
                        }
                    } else if (!toPos.has_ball) {
                        if (player.hasBall) {
                            player.hasBall = false;
                            document.getElementById(`viewer-jersey-${player.number}`)?.classList.remove('has-ball');
                        }
                    }
                }
            });
            
            updateViewerBasketball();
            
            // Actualizar progreso visual
            const totalProgress = ((fromIndex + progress) / (currentFormation.steps.length - 1)) * 100;
            document.getElementById('animationProgress').style.width = `${totalProgress}%`;
            
            if (progress < 1 && isAnimating) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        
        requestAnimationFrame(animate);
    });
}

// Detener animación
function stopAnimation() {
    isAnimating = false;
    updatePlayButtonState();
}

// Reiniciar animación
function resetAnimation() {
    stopAnimation();
    goToStep(0);
}

// Actualizar UI del paso actual durante animación
function updateStepUI() {
    document.getElementById('currentStepNum').textContent = currentStepIndex + 1;
    
    const step = currentFormation.steps[currentStepIndex];
    document.getElementById('stepTitle').textContent = `Paso ${currentStepIndex + 1}`;
    document.getElementById('stepDescriptionText').textContent = step.description || 'Sin descripción';
    
    // Actualizar thumbnails
    document.querySelectorAll('.step-thumbnail').forEach((thumb, idx) => {
        thumb.classList.toggle('active', idx === currentStepIndex);
    });
}

// Actualizar estado del botón play/pause
function updatePlayButtonState() {
    const btn = document.getElementById('playPauseBtn');
    if (btn) {
        btn.innerHTML = isAnimating ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
}

// Actualizar velocidad de animación
function updateAnimationSpeed() {
    const select = document.getElementById('animationSpeed');
    if (select) {
        animationSpeed = parseFloat(select.value);
    }
}

// Utilidad: esperar
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Cerrar visualizador
function closeViewerModal() {
    stopAnimation();
    document.getElementById('viewerModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentFormation = null;
    currentStepIndex = 0;
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
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

// Animaciones CSS
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
