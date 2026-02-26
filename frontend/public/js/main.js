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

// ==================== PWA INSTALL PROMPT ====================

// Variable para almacenar el evento de instalación
let deferredPrompt = null;

// Escuchar el evento beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] beforeinstallprompt disparado');
    // Prevenir que el navegador muestre el prompt automáticamente
    e.preventDefault();
    // Guardar el evento para usarlo después
    deferredPrompt = e;
    // Mostrar el botón de instalación
    showInstallButton();
});

// Función para mostrar el botón de instalación
function showInstallButton() {
    // Verificar si ya existe el botón
    if (document.getElementById('pwa-install-btn')) {
        return;
    }

    // Crear el botón de instalación
    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.innerHTML = '<i class="fas fa-download"></i> Instalar App';
    installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        color: white;
        border: none;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(30, 64, 175, 0.4);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
    `;

    // Hover effect
    installBtn.addEventListener('mouseenter', () => {
        installBtn.style.transform = 'translateY(-2px)';
        installBtn.style.boxShadow = '0 6px 20px rgba(30, 64, 175, 0.5)';
    });

    installBtn.addEventListener('mouseleave', () => {
        installBtn.style.transform = 'translateY(0)';
        installBtn.style.boxShadow = '0 4px 15px rgba(30, 64, 175, 0.4)';
    });

    // Click handler
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            showToast('La app ya está instalada o no es compatible', 'error');
            return;
        }

        // Mostrar el prompt de instalación
        deferredPrompt.prompt();

        // Esperar la respuesta del usuario
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] Resultado de instalación: ${outcome}`);

        if (outcome === 'accepted') {
            showToast('¡App instalada correctamente!', 'success');
            installBtn.remove();
        } else {
            showToast('Instalación cancelada', 'error');
        }

        // Limpiar el evento
        deferredPrompt = null;
    });

    document.body.appendChild(installBtn);
}

// Escuchar cuando la app es instalada
window.addEventListener('appinstalled', () => {
    console.log('[PWA] App instalada');
    showToast('¡App instalada correctamente!', 'success');
    // Ocultar el botón de instalación
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.remove();
    }
    deferredPrompt = null;
});

// Verificar si la app ya está instalada (standalone)
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    console.log('[PWA] App ejecutándose en modo standalone');
}

// ==================== NOTIFICACIONES PUSH ====================

// Solicitar permiso para notificaciones
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('[Notifications] Este navegador no soporta notificaciones');
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('[Notifications] Permiso concedido');
            showToast('Notificaciones activadas', 'success');
            // Programar recordatorio de pagos
            schedulePaymentReminder();
        } else {
            console.log('[Notifications] Permiso denegado');
        }
    });
}

// Mostrar botón para activar notificaciones
function showNotificationButton() {
    // Verificar si ya existe el botón
    if (document.getElementById('notification-btn')) {
        return;
    }

    // Verificar si ya tiene permiso
    if (Notification.permission === 'granted') {
        schedulePaymentReminder();
        return;
    }

    if (Notification.permission === 'denied') {
        return; // No mostrar si ya fue denegado
    }

    // Crear el botón de notificaciones
    const notifBtn = document.createElement('button');
    notifBtn.id = 'notification-btn';
    notifBtn.innerHTML = '<i class="fas fa-bell"></i> Activar Notificaciones';
    notifBtn.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        padding: 12px 20px;
        background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
        color: white;
        border: none;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
        z-index: 9998;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
    `;

    notifBtn.addEventListener('mouseenter', () => {
        notifBtn.style.transform = 'translateY(-2px)';
        notifBtn.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.5)';
    });

    notifBtn.addEventListener('mouseleave', () => {
        notifBtn.style.transform = 'translateY(0)';
        notifBtn.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.4)';
    });

    notifBtn.addEventListener('click', () => {
        requestNotificationPermission();
        notifBtn.remove();
    });

    document.body.appendChild(notifBtn);
}

// Programar recordatorio de pagos (primeros 5 días del mes)
function schedulePaymentReminder() {
    const now = new Date();
    const dayOfMonth = now.getDate();

    // Solo mostrar en los primeros 5 días del mes
    if (dayOfMonth > 5) {
        console.log('[Notifications] Fuera del período de recordatorios (día ' + dayOfMonth + ')');
        return;
    }

    // Verificar si ya se mostró hoy
    const lastShown = localStorage.getItem('paymentReminderLastShown');
    const today = now.toDateString();

    if (lastShown === today) {
        console.log('[Notifications] Recordatorio ya mostrado hoy');
        return;
    }

    // Mostrar notificación después de 5 segundos
    setTimeout(() => {
        showPaymentNotification();
        localStorage.setItem('paymentReminderLastShown', today);
    }, 5000);
}

// Mostrar notificación de recordatorio de pago
function showPaymentNotification() {
    if (Notification.permission !== 'granted') {
        return;
    }

    const options = {
        body: 'Recuerda realizar el pago de tu mensualidad. Evita recargos por mora.',
        icon: '/images/logo.jpg',
        badge: '/images/logo.jpg',
        tag: 'payment-reminder',
        requireInteraction: true,
        actions: [
            {
                action: 'pay',
                title: 'Ir a pagar'
            },
            {
                action: 'dismiss',
                title: 'Descartar'
            }
        ]
    };

    const notification = new Notification('💰 Recordatorio de Pago - FAMA VALLE', options);

    notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        window.location.href = '/pages/payments.html';
        notification.close();
    };
}

// Inicializar notificaciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para no saturar al usuario
    setTimeout(() => {
        showNotificationButton();
    }, 2000);
});

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
