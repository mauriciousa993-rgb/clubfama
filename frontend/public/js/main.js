// Funciones utilitarias generales

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Obtener token de autenticación
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Mostrar/ocultar loading
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    }
}

// Confirmar acción
function confirmAction(message) {
    return confirm(message);
}

// Mostrar notificación toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Estilos inline para el toast
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Validar email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validar teléfono
function isValidPhone(phone) {
    const re = /^[0-9]{10}$/;
    return re.test(phone.replace(/\D/g, ''));
}

// Capitalizar primera letra
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Generar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Guardar en localStorage
function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Obtener de localStorage
function getFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Eliminar de localStorage
function removeFromStorage(key) {
    localStorage.removeItem(key);
}

// Animación de entrada para elementos
function animateEntry(element, delay = 0) {
    setTimeout(() => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 50);
    }, delay);
}

// Manejo de errores de API
function handleApiError(error, defaultMessage = 'Error en la operación') {
    console.error('API Error:', error);
    showToast(error.message || defaultMessage, 'error');
}

// Inicializar menú móvil (para todas las páginas con sidebar)
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (mobileMenuBtn && sidebar) {
        // Toggle menú al hacer clic en el botón
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            if (mobileOverlay) {
                mobileOverlay.classList.toggle('active');
            }
        });
        
        // Cerrar menú al hacer clic en el overlay
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', function() {
                sidebar.classList.remove('active');
                mobileOverlay.classList.remove('active');
            });
        }
        
        // Cerrar menú al hacer clic en un enlace (en móviles)
        const navLinks = sidebar.querySelectorAll('.nav-item a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    if (mobileOverlay) {
                        mobileOverlay.classList.remove('active');
                    }
                }
            });
        });
    }
}

// Exportar funciones para uso global
window.formatDate = formatDate;

window.formatCurrency = formatCurrency;
window.getAuthHeaders = getAuthHeaders;
window.showLoading = showLoading;
window.confirmAction = confirmAction;
window.showToast = showToast;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.capitalize = capitalize;
window.generateId = generateId;
window.saveToStorage = saveToStorage;
window.getFromStorage = getFromStorage;
window.removeFromStorage = removeFromStorage;
window.animateEntry = animateEntry;
window.handleApiError = handleApiError;
window.initMobileMenu = initMobileMenu;
