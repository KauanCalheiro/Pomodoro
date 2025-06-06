import { loadSettings, settings } from './state/settingsState.js';
import { loadTasks } from './state/taskState.js';
import { loadCycleState, resetCycle } from './state/cycleState.js';
import { timerState, resetPageTitle } from './state/timerState.js';
import { requestNotificationPermission } from './services/notifications.js';
import { handleVisibilityChange, releaseWakeLock } from './services/wakeLock.js';
import { stopAlarm } from './services/alarm.js';
import { updateTimerMode, startTimer, resetTimer, nextCycleStep } from './components/timer.js';
import { addTask, toggleCompletedTasks } from './components/tasks.js';

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados salvos
    loadSettings();
    loadTasks();
    loadCycleState();
    
    // Solicitar permissão para notificações
    requestNotificationPermission();
    
    // Definir título inicial da página
    resetPageTitle();
    
    // Configurar modo inicial
    updateTimerMode('pomodoro');
    
    // Event Listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Timer Controls
    document.getElementById('startBtn').addEventListener('click', startTimer);
    
    document.getElementById('resetBtn').addEventListener('click', () => {
        resetTimer();
        resetCycle();
    });
    
    // Mode Buttons
    document.querySelectorAll('[data-mode]').forEach(button => {
        button.addEventListener('click', () => {
            if (timerState.isRunning) {
                clearInterval(timerState.timerId);
                timerState.isRunning = false;
                document.getElementById('startBtn').innerHTML = '<i class="fas fa-play mr-2"></i>Iniciar';
                releaseWakeLock();
            }
            updateTimerMode(button.dataset.mode);
            resetPageTitle();
        });
    });
    
    // Settings
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    
    settingsBtn.addEventListener('click', () => {
        const isModalOpen = !settingsModal.classList.contains('hidden');
        if (isModalOpen) {
            settingsModal.classList.remove('flex');
            settingsModal.classList.add('hidden');
            settingsBtn.classList.remove('active');
        } else {
            document.getElementById('pomodoroDuration').value = settings.pomodoro;
            document.getElementById('shortBreakDuration').value = settings.shortBreak;
            document.getElementById('longBreakDuration').value = settings.longBreak;
            settingsModal.classList.remove('hidden');
            settingsModal.classList.add('flex');
            settingsBtn.classList.add('active');
        }
    });
    
    closeSettings.addEventListener('click', () => {
        settingsModal.classList.remove('flex');
        settingsModal.classList.add('hidden');
        settingsBtn.classList.remove('active');
    });
    
    document.getElementById('settingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        settings.pomodoro = parseInt(document.getElementById('pomodoroDuration').value);
        settings.shortBreak = parseInt(document.getElementById('shortBreakDuration').value);
        settings.longBreak = parseInt(document.getElementById('longBreakDuration').value);
        
        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
        updateTimerMode(timerState.mode);
        
        settingsModal.classList.remove('flex');
        settingsModal.classList.add('hidden');
        settingsBtn.classList.remove('active');
    });
    
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
        settings.darkMode = !settings.darkMode;
        document.documentElement.classList.toggle('dark', settings.darkMode);
        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
        themeToggle.innerHTML = settings.darkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    });
    
    // Tasks
    document.getElementById('taskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const taskInput = document.getElementById('taskInput');
        const text = taskInput.value.trim();
        if (text) {
            addTask(text);
            taskInput.value = '';
        }
    });
    
    document.getElementById('toggleCompleted').addEventListener('click', toggleCompletedTasks);
    
    // Alarm
    const stopAlarmBtn = document.getElementById('stopAlarmBtn');
    if (stopAlarmBtn) {
        stopAlarmBtn.addEventListener('click', () => {
            stopAlarm();
            document.getElementById('alarmModal').classList.remove('flex');
            document.getElementById('alarmModal').classList.add('hidden');
            nextCycleStep();
        });
    }
    
    // Wake Lock
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        releaseWakeLock();
    });
} 