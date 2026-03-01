// Configuración de la API
// Detecta automáticamente el entorno
const isProduction = window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('192.168.') &&
                     !window.location.hostname.includes('127.0.0.1');

// URL del backend en Render (producción)
const RENDER_API_URL = 'https://clubfama.onrender.com/api';



// URL local para desarrollo
const LOCAL_API_URL = 'http://localhost:8080/api';

// Seleccionar la URL correcta según el entorno
const API_URL = isProduction ? RENDER_API_URL : LOCAL_API_URL;

console.log('🌐 API URL:', API_URL, '| Modo:', isProduction ? 'Producción' : 'Desarrollo');



// Helper para obtener headers de autenticación

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Verificar si el usuario está autenticado

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user || user === 'undefined') {
        // Limpiar datos inválidos
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Si no estamos en la página de login o registro, redirigir
        const isLoginPage = window.location.pathname.includes('index.html') ||
            window.location.pathname.endsWith('/');
        const isRegisterPage = window.location.pathname.includes('pages/register.html');
        if (!isLoginPage && !isRegisterPage) {
            window.location.href = '../index.html';
        }
        return false;
    }
    
    try {
        // Mostrar nombre del usuario en la sidebar
        const userNameElements = document.querySelectorAll('#userName');
        const userData = JSON.parse(user);
        userNameElements.forEach(el => {
            el.textContent = userData.name || userData.email;
        });
        
        // Configurar menú según el rol
        configureMenuByRole(userData.role);
        
        return true;
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
    }
}


// Verificar si el jugador necesita completar perfil
async function checkProfileCompletion(token) {
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const profile = await response.json();
            return profile.profile_completed === true;
        }
        return false;
    } catch (error) {
        console.error('Error checking profile:', error);
        return false;
    }
}

// Login
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            showMessage('Inicio de sesión exitoso', 'success');
            
            setTimeout(async () => {
                // Redirigir según el rol
                if (data.role === 'admin') {
                    window.location.href = 'pages/dashboard.html';
                } else {
                    // Verificar si el jugador necesita completar su perfil
                    const profileCompleted = await checkProfileCompletion(data.token);
                    if (profileCompleted) {
                        window.location.href = 'pages/player-dashboard.html';
                    } else {
                        window.location.href = 'pages/player-profile.html';
                    }
                }
            }, 1000);
            return true;
        } else {
            showMessage(data.message || 'Error al iniciar sesión', 'error');
            return false;
        }
    } catch (error) {
        showMessage('Error de conexión con el servidor', 'error');
        console.error('Login error:', error);
        return false;
    }
}




// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

// Mostrar mensajes
function showMessage(message, type) {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        setTimeout(() => {
            messageEl.className = 'message';
            messageEl.textContent = '';
        }, 5000);
    }
}

// Mostrar toast notification
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

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Capitalizar texto
function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Mostrar loading
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    }
}

// Toggle password visibility

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Mostrar modal de recuperar contraseña

function showForgotPassword() {
    alert('Función de recuperación de contraseña en desarrollo');
}

// Configurar visibilidad del menú según el rol del usuario
function configureMenuByRole(role) {
    // IDs de los elementos del menú en el HTML
    const menuItems = {
        'dashboard': 'menu-dashboard',
        'players': 'menu-players',
        'payments': 'menu-payments',
        'calendar': 'menu-calendar',
        'formations': 'menu-formations',
        'reports': 'menu-reports',
        'birthdays': 'menu-birthdays'
    };
    
    // Ocultar todos los elementos primero
    Object.values(menuItems).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
        }
    });
    
    // Mostrar según el rol
    if (role === 'admin') {
        // Admin ve todo
        Object.values(menuItems).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = '';
            }
        });
    } else if (role === 'assistant') {
        // Asistente ve: dashboard, calendar, formations, birthdays
        const assistantMenus = ['menu-dashboard', 'menu-calendar', 'menu-formations', 'menu-birthdays'];
        assistantMenus.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = '';
            }
        });
    } else if (role === 'player') {
        // Jugador ve: dashboard, calendar, formations, birthdays
        const playerMenus = ['menu-dashboard', 'menu-calendar', 'menu-formations', 'menu-birthdays'];
        playerMenus.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = '';
            }
        });
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación en páginas protegidas
    checkAuth();
    
    // Formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await login(email, password);
        });
    }
    
    // Cerrar modal al hacer click fuera

    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    };
});
