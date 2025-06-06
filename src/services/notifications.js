import { timerState } from '../state/timerState.js';
import { stopAlarm } from './alarm.js';

export const requestNotificationPermission = () => {
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
};

export const showTimerCompleteNotification = () => {
    if (Notification.permission === 'granted') {
        const notification = new Notification('⏰ Timer Concluído!', {
            body: `Sessão de ${timerState.mode === 'pomodoro' ? 'Pomodoro' : timerState.mode === 'shortBreak' ? 'pausa curta' : 'pausa longa'} concluída! Clique para parar o alarme.`,
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiNhN2MwODAiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIyMCIgeT0iMjAiPgo8cGF0aCBkPSJNMTIgMlY2TTE2IDZWMk0xMiAxMy41VjExTTEyIDFDNS45MjUgMSAxIDUuOTI1IDEgMTJTNS45MjUgMjMgMTIgMjNTMjMgMTguMDc1IDIzIDEyUzE4LjA3NSAxIDEyIDFaIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPC9zdmc+',
            requireInteraction: true,
            tag: 'pomodoro-timer'
        });
        
        notification.onclick = function() {
            window.focus();
            stopAlarm();
            notification.close();
        };
    }
}; 