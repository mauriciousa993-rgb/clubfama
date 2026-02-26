// Sistema de Notificaciones para FAMA VALLE

class NotificationManager {
    constructor() {
        this.permission = Notification.permission;
        this.swRegistration = null;
        this.init();
    }

    async init() {
        // Registrar service worker para notificaciones push
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.ready;
                console.log('[Notifications] SW listo para notificaciones');
            } catch (error) {
                console.error('[Notifications] Error al registrar SW:', error);
            }
        }
    }

    // Solicitar permiso de notificaciones
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('[Notifications] Notificaciones no soportadas');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                console.log('[Notifications] Permiso concedido');
                await this.subscribeToPush();
                return true;
            } else {
                console.log('[Notifications] Permiso denegado:', permission);
                return false;
            }
        } catch (error) {
            console.error('[Notifications] Error al solicitar permiso:', error);
            return false;
        }
    }

    // Suscribirse a notificaciones push
    async subscribeToPush() {
        if (!this.swRegistration) return;

        try {
            // Verificar si ya existe una suscripción
            let subscription = await this.swRegistration.pushManager.getSubscription();
            
            if (!subscription) {
                // Crear nueva suscripción
                // En producción, necesitarás las claves VAPID del servidor
                const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Reemplazar con tu clave pública VAPID
                
                const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
                
                subscription = await this.swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey
                });
                
                console.log('[Notifications] Suscripción creada:', subscription);
                
                // Enviar suscripción al servidor
                await this.sendSubscriptionToServer(subscription);
            } else {
                console.log('[Notifications] Ya suscrito:', subscription);
            }
        } catch (error) {
            console.error('[Notifications] Error al suscribirse:', error);
        }
    }

    // Convertir clave VAPID
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Enviar suscripción al servidor
    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch(`${API_URL}/notifications/subscribe`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    subscription: subscription,
                    userId: localStorage.getItem('userId'),
                    role: localStorage.getItem('userRole')
                })
            });

            if (response.ok) {
                console.log('[Notifications] Suscripción guardada en servidor');
            } else {
                console.error('[Notifications] Error al guardar suscripción');
            }
        } catch (error) {
            console.error('[Notifications] Error de red:', error);
        }
    }

    // Mostrar notificación local
    showLocalNotification(title, options = {}) {
        if (Notification.permission !== 'granted') {
            console.log('[Notifications] No hay permiso para notificaciones');
            return;
        }

        const defaultOptions = {
            icon: '/images/logo.jpg',
            badge: '/images/logo.jpg',
            tag: 'fama-valle',
            requireInteraction: false,
            ...options
        };

        if (this.swRegistration) {
            this.swRegistration.showNotification(title, defaultOptions);
        } else {
            new Notification(title, defaultOptions);
        }
    }

    // Programar recordatorio de pago
    schedulePaymentReminder() {
        const now = new Date();
        const dayOfMonth = now.getDate();
        const hour = now.getHours();

        // Solo mostrar en los primeros 5 días del mes
        if (dayOfMonth > 5) {
            console.log('[Notifications] Fuera de período de recordatorios');
            return;
        }

        // Verificar si ya se mostró hoy
        const lastShown = localStorage.getItem('paymentReminderLastShown');
        const today = now.toDateString();

        if (lastShown === today) {
            console.log('[Notifications] Recordatorio ya mostrado hoy');
            return;
        }

        // Mostrar notificación después de 3 segundos
        setTimeout(() => {
            this.showPaymentReminder();
            localStorage.setItem('paymentReminderLastShown', today);
        }, 3000);
    }

    // Mostrar recordatorio específico de pago
    showPaymentReminder() {
        const title = '💰 Recordatorio de Pago - FAMA VALLE';
        const options = {
            body: `Hola! Es el día ${new Date().getDate()} del mes. Recuerda realizar el pago de tu mensualidad para evitar recargos por mora.`,
            icon: '/images/logo.jpg',
            badge: '/images/logo.jpg',
            tag: 'payment-reminder',
            requireInteraction: true,
            actions: [
                {
                    action: 'pay',
                    title: '💳 Ir a Pagar'
                },
                {
                    action: 'dismiss',
                    title: '✓ Entendido'
                }
            ],
            data: {
                url: '/pages/payments.html',
                type: 'payment-reminder'
            }
        };

        this.showLocalNotification(title, options);
    }

    // Cancelar suscripción
    async unsubscribe() {
        if (!this.swRegistration) return;

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                console.log('[Notifications] Suscripción cancelada');
                
                // Notificar al servidor
                await fetch(`${API_URL}/notifications/unsubscribe`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ userId: localStorage.getItem('userId') })
                });
            }
        } catch (error) {
            console.error('[Notifications] Error al cancelar suscripción:', error);
        }
    }

    // Verificar si está suscrito
    async isSubscribed() {
        if (!this.swRegistration) return false;
        
        const subscription = await this.swRegistration.pushManager.getSubscription();
        return !!subscription;
    }
}

// Instancia global
let notificationManager = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si el usuario está autenticado
    if (localStorage.getItem('token')) {
        notificationManager = new NotificationManager();
        
        // Para jugadores, programar recordatorio de pago
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'player') {
            setTimeout(() => {
                notificationManager.schedulePaymentReminder();
            }, 5000);
        }
    }
});

// Funciones globales
window.requestNotificationPermission = async function() {
    if (notificationManager) {
        const granted = await notificationManager.requestPermission();
        if (granted) {
            showToast('Notificaciones activadas correctamente', 'success');
        } else {
            showToast('Permiso de notificaciones denegado', 'error');
        }
        return granted;
    }
    return false;
};

window.showPaymentNotification = function() {
    if (notificationManager) {
        notificationManager.showPaymentReminder();
    }
};

window.NotificationManager = NotificationManager;
