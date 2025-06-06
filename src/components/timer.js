import { timerState, formatTime, resetPageTitle } from '../state/timerState.js';
import { settings } from '../state/settingsState.js';
import { cycleState, saveCycleState } from '../state/cycleState.js';
import { requestWakeLock, releaseWakeLock } from '../services/wakeLock.js';
import { startAlarm } from '../services/alarm.js';
import { showTimerCompleteNotification } from '../services/notifications.js';

export const updateTimerDisplay = () => {
    const timerDisplay = document.getElementById('timer');
    const progressBar = document.getElementById('progress');
    const timeText = formatTime(timerState.timeLeft);
    
    timerDisplay.textContent = timeText;
    const progress = ((timerState.initialTime - timerState.timeLeft) / timerState.initialTime) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Update page title with current time and mode
    const modeNames = {
        pomodoro: 'Pomodoro',
        shortBreak: 'Pausa Curta',
        longBreak: 'Pausa Longa'
    };
    
    const modeName = modeNames[timerState.mode] || 'Pomodoro';
    const status = timerState.isRunning ? '⏰' : '⏸️';
    document.title = `${status} ${timeText} - ${modeName}`;
};

export const updateTimerMode = (mode) => {
    timerState.mode = mode;
    timerState.timeLeft = settings[mode] * 60;
    timerState.initialTime = settings[mode] * 60;
    updateTimerDisplay();
    
    // Atualizar estilos dos botões ativos
    const modeButtons = document.querySelectorAll('[data-mode]');
    modeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
        
        // Definir cores dos botões
        if (btn.dataset.mode === 'pomodoro') {
            btn.classList.remove('btn-secondary', 'btn-accent');
            btn.classList.add('btn-primary');
        } else if (btn.dataset.mode === 'shortBreak') {
            btn.classList.remove('btn-primary', 'btn-accent');
            btn.classList.add('btn-secondary');
        } else {
            btn.classList.remove('btn-primary', 'btn-secondary');
            btn.classList.add('btn-accent');
        }
    });
    
    // Atualizar indicador do ciclo
    updateCycleIndicator();
};

export const startTimer = () => {
    const startBtn = document.getElementById('startBtn');
    
    if (timerState.isRunning) {
        clearInterval(timerState.timerId);
        startBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Iniciar';
        timerState.isRunning = false;
        releaseWakeLock();
        return;
    }
    
    timerState.isRunning = true;
    startBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>Pausar';
    requestWakeLock();
    
    timerState.timerId = setInterval(() => {
        timerState.timeLeft--;
        updateTimerDisplay();
        
        if (timerState.timeLeft <= 0) {
            clearInterval(timerState.timerId);
            timerState.isRunning = false;
            startBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Iniciar';
            releaseWakeLock();
            
            startAlarm();
            showTimerCompleteNotification();
        }
    }, 1000);
};

export const resetTimer = () => {
    clearInterval(timerState.timerId);
    timerState.isRunning = false;
    timerState.timeLeft = timerState.initialTime;
    updateTimerDisplay();
    document.getElementById('startBtn').innerHTML = '<i class="fas fa-play mr-2"></i>Iniciar';
    releaseWakeLock();
    resetPageTitle();
};

export const updateCycleIndicator = () => {
    const cycleIndicator = document.getElementById('cycleIndicator');
    const cycleText = document.getElementById('cycleText');
    
    if (!cycleIndicator || !cycleText) return;
    
    // Limpar indicadores existentes
    cycleIndicator.innerHTML = '';
    
    // Criar os 4 pontos do ciclo
    cycleState.sequence.forEach((mode, index) => {
        const dot = document.createElement('div');
        dot.className = 'w-2 h-2 rounded-full transition-colors duration-300';
        
        // Definir cor baseada no modo e estado
        if (index < cycleState.currentStep) {
            // Já concluído
            dot.classList.add('bg-green-500');
        } else if (index === cycleState.currentStep) {
            // Atual
            if (mode === 'pomodoro') {
                dot.classList.add('bg-everforest-red-light', 'dark:bg-everforest-red-dark');
            } else if (mode === 'shortBreak') {
                dot.classList.add('bg-everforest-yellow-light', 'dark:bg-everforest-yellow-dark');
            } else {
                dot.classList.add('bg-everforest-blue-light', 'dark:bg-everforest-blue-dark');
            }
            // Adicionar animação pulsante para o step atual
            dot.classList.add('animate-pulse');
        } else {
            // Ainda não iniciado
            dot.classList.add('bg-gray-400', 'dark:bg-gray-600');
        }
        
        cycleIndicator.appendChild(dot);
    });
    
    // Atualizar texto do ciclo
    cycleText.textContent = `${cycleState.currentStep + 1}/4`;
};

export const nextCycleStep = () => {
    // Avançar para o próximo step
    cycleState.currentStep++;
    
    // Se completou um ciclo completo (4 steps), reiniciar
    if (cycleState.currentStep >= cycleState.sequence.length) {
        cycleState.currentStep = 0;
        cycleState.completedCycles++;
        console.log(`Ciclo Pomodoro completo! Total de ciclos: ${cycleState.completedCycles}`);
    }
    
    // Obter o próximo modo
    const nextMode = cycleState.sequence[cycleState.currentStep];
    
    // Atualizar o timer para o próximo modo
    updateTimerMode(nextMode);
    
    // Atualizar indicador visual
    updateCycleIndicator();
    
    // Salvar estado do ciclo
    saveCycleState();
    
    console.log(`Avançando para: ${nextMode} (Step ${cycleState.currentStep + 1}/4)`);
}; 