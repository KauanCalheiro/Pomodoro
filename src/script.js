// Estado do cronômetro
let timerState = {
    mode: 'pomodoro',
    timeLeft: 5, // em segundos
    initialTime: 5,
    isRunning: false,
    timerId: null,
    alarmAudio: null,
    isAlarmPlaying: false,
    wakeLock: null // Wake Lock para manter a tela ativa
};

// Estado do ciclo Pomodoro
let cycleState = {
    currentStep: 0, // 0: pomodoro, 1: shortBreak, 2: pomodoro, 3: longBreak
    sequence: ['pomodoro', 'shortBreak', 'pomodoro', 'longBreak'],
    completedCycles: 0
};

// Estado das configurações com valores padrão
let settings = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    darkMode: false
};

// Estado das tarefas
let tasks = {
    items: [],
    showCompleted: false
};

// Elementos DOM
const timerDisplay = document.getElementById('timer');
const progressBar = document.getElementById('progress');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const modeButtons = document.querySelectorAll('[data-mode]');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const settingsForm = document.getElementById('settingsForm');
const themeToggle = document.getElementById('themeToggle');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const toggleCompleted = document.getElementById('toggleCompleted');

// Variáveis globais para edição de tarefas
let currentEditingTaskId = null;
const editTaskModal = document.getElementById('editTaskModal');
const editTaskInput = document.getElementById('editTaskInput');

// Funções auxiliares para tarefas
function formatDateTime(date, time) {
    if (!time) {
        // Se não tiver hora, retorna apenas a data às 00:00
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate;
    }
    
    const [hours, minutes] = time.split(':');
    const taskDate = new Date(date);
    taskDate.setHours(parseInt(hours), parseInt(minutes), 0);
    return taskDate;
}

function getFormattedDateTime(date) {
    return {
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().slice(0, 5)
    };
}

function getRemainingTime(dueDate) {
    const now = new Date();
    const diff = dueDate - now;
    
    if (diff < 0) return 'Atrasado';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

// Funções do Wake Lock para manter a tela ativa
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            timerState.wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock ativado - tela permanecerá ligada');
            
            // Event listener para quando o wake lock é liberado
            timerState.wakeLock.addEventListener('release', () => {
                console.log('Wake Lock liberado');
            });
        } else {
            console.log('Wake Lock API não suportada neste navegador');
        }
    } catch (err) {
        console.error('Erro ao solicitar Wake Lock:', err);
    }
}

async function releaseWakeLock() {
    if (timerState.wakeLock) {
        try {
            await timerState.wakeLock.release();
            timerState.wakeLock = null;
            console.log('Wake Lock liberado manualmente');
        } catch (err) {
            console.error('Erro ao liberar Wake Lock:', err);
        }
    }
}

// Função para reativar wake lock quando a página volta ao foco
async function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && timerState.isRunning && !timerState.wakeLock) {
        await requestWakeLock();
    }
}

// Carregar configurações e tarefas salvas
function loadSavedData() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    const savedTasks = localStorage.getItem('pomodoroTasks');
    
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
        updateTimerMode('pomodoro');
        document.documentElement.classList.toggle('dark', settings.darkMode);
    }
    
    if (savedTasks) {
        tasks.items = JSON.parse(savedTasks);
        renderTasks();
    }
}

// Funções do cronômetro
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
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
}

function updateTimerMode(mode) {
    timerState.mode = mode;
    timerState.timeLeft = settings[mode] * 60;
    timerState.initialTime = settings[mode] * 60;
    updateTimerDisplay();
    
    // Atualizar estilos dos botões ativos
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
    
    // Atualizar indicador do ciclo quando o modo é alterado
    updateCycleIndicator();
}

function resetPageTitle() {
    document.title = 'Pomodoro';
}

function startTimer() {
    if (timerState.isRunning) {
        clearInterval(timerState.timerId);
        startBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Iniciar';
        timerState.isRunning = false;
        releaseWakeLock(); // Liberar wake lock quando pausar
        return;
    }

    timerState.isRunning = true;
    startBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>Pausar';
    requestWakeLock(); // Ativar wake lock quando iniciar
    
    // Obter Wake Lock para manter a tela ativa
    requestWakeLock();
    
    timerState.timerId = setInterval(() => {
        timerState.timeLeft--;
        updateTimerDisplay();
        
        if (timerState.timeLeft <= 0) {
            clearInterval(timerState.timerId);
            timerState.isRunning = false;
            startBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Iniciar';
            releaseWakeLock(); // Liberar wake lock quando o timer terminar
            
            // Iniciar alarme e mostrar notificação
            startAlarm();
            showTimerCompleteNotification();
        }
    }, 1000);
}

// Funções do alarme
function startAlarm() {
    // Criar áudio do alarme
    timerState.alarmAudio = new Audio('data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=');
    timerState.alarmAudio.loop = true;
    timerState.isAlarmPlaying = true;
    
    // Update page title for alarm
    const modeNames = {
        pomodoro: 'Pomodoro',
        shortBreak: 'Pausa Curta',
        longBreak: 'Pausa Longa'
    };
    const modeName = modeNames[timerState.mode] || 'Pomodoro';
    document.title = `🔔 ${modeName} Concluído! - Parar Alarme`;
    
    // Reproduzir o alarme
    timerState.alarmAudio.play();
    
    // Mostrar modal do alarme
    showAlarmModal();
}

function stopAlarm() {
    if (timerState.alarmAudio) {
        timerState.alarmAudio.pause();
        timerState.alarmAudio.currentTime = 0;
        timerState.alarmAudio = null;
    }
    timerState.isAlarmPlaying = false;
    
    // Hide alarm modal
    hideAlarmModal();
    
    // Avançar para o próximo step do ciclo automaticamente
    nextCycleStep();
    
    // Reset page title
    resetPageTitle();
}

function showAlarmModal() {
    const modal = document.getElementById('alarmModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function hideAlarmModal() {
    const modal = document.getElementById('alarmModal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
}

function resetTimerAfterAlarm() {
    timerState.timeLeft = timerState.initialTime;
    updateTimerDisplay();
}

function showTimerCompleteNotification() {
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
}

// Funções de gerenciamento de modais
function showEditTaskModal(taskId, task) {
    currentEditingTaskId = taskId;
    
    editTaskInput.value = task.text;
    
    // Preencher data e hora se existirem
    const editTaskDate = document.getElementById('editTaskDate');
    const editTimeContainer = document.getElementById('editTimeContainer');
    
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        editTaskDate.value = dueDate.toISOString().split('T')[0];
        
        // Se tem data, sempre mostra o campo de hora
        editTimeContainer.classList.remove('hidden');
        setTimeout(() => {
            editTimeContainer.classList.remove('opacity-0', 'max-h-0');
            editTimeContainer.classList.add('opacity-100', 'max-h-24');
        }, 10);

        // Preenche a hora apenas se a tarefa tiver hora definida
        if (task.hasTime) {
            document.getElementById('editTaskTime').value = dueDate.toTimeString().slice(0, 5);
        } else {
            document.getElementById('editTaskTime').value = '';
        }
    } else {
        editTaskDate.value = '';
        editTimeContainer.classList.remove('opacity-100', 'max-h-24');
        editTimeContainer.classList.add('opacity-0', 'max-h-0', 'hidden');
        document.getElementById('editTaskTime').value = '';
    }
    
    // Preencher progresso se existir
    const progress = task.progress || 0;
    document.getElementById('editTaskProgress').value = progress;
    document.getElementById('editTaskProgressValue').textContent = `${progress}%`;
    
    editTaskModal.classList.remove('hidden');
    editTaskModal.classList.add('flex');
    editTaskInput.focus();
}

function hideEditTaskModal() {
    const editTaskModal = document.getElementById('editTaskModal');
    const editTaskInput = document.getElementById('editTaskInput');
    if (editTaskModal && editTaskInput) {
        editTaskModal.classList.remove('flex');
        editTaskModal.classList.add('hidden');
        editTaskInput.value = '';
        currentEditingTaskId = null;
    }
}

// Task Management Functions
function createTaskElement(task) {
    const li = document.createElement('li');
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
    
    li.className = `flex items-center justify-between p-3 rounded-lg card-3d ${
        task.completed ? 'opacity-75' : ''
    } ${isOverdue && !task.completed ? 'bg-red-50 dark:bg-red-900/20' : ''}`;
    
    // Preparar informações adicionais se existirem
    let additionalInfo = '';
    
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const remainingTime = getRemainingTime(dueDate);
        const hasTime = task.hasTime; // Nova propriedade para verificar se tem hora

        additionalInfo += `
            <span class="flex items-center gap-1">
                <i class="fas fa-clock"></i>
                ${dueDate.toLocaleDateString()}
                ${hasTime ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                ${remainingTime ? `(${remainingTime})` : ''}
            </span>
        `;
    }
    
    // Mostrar progresso apenas se for maior que 0
    if (task.progress > 0) {
        additionalInfo += `
            <div class="flex items-center gap-1">
                <i class="fas fa-tasks"></i>
                <div class="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-everforest-button-green" style="width: ${task.progress}%"></div>
                </div>
                ${task.progress}%
            </div>
        `;
    }
    
    // Adicionar div de informações adicionais apenas se houver informações
    const additionalInfoHtml = additionalInfo ? `
        <div class="mt-2 flex items-center gap-4 text-xs text-everforest-text-secondary dark:text-everforest-text-secondary-dark">
            ${additionalInfo}
        </div>
    ` : '';
    
    li.innerHTML = `
        <div class="flex-1">
            <div class="flex items-center gap-3">
                <input type="checkbox" class="everforest-checkbox"
                       ${task.completed ? 'checked' : ''}>
                <span class="${task.completed ? 'line-through opacity-50' : ''}">${task.text}</span>
            </div>
            ${additionalInfoHtml}
        </div>
        <div class="flex gap-2">
            <button class="edit-task btn btn-secondary text-sm">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-task btn btn-danger text-sm">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Event listeners
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => toggleTask(task.id));
    
    const editBtn = li.querySelector('.edit-task');
    editBtn.addEventListener('click', () => {
        showEditTaskModal(task.id, task);
    });
    
    const deleteBtn = li.querySelector('.delete-task');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    return li;
}

function renderTasks() {
    taskList.innerHTML = '';
    const filteredTasks = tasks.items.filter(task => 
        tasks.showCompleted ? true : !task.completed
    );
    
    // Ordenar tarefas: primeiro as que têm data de vencimento, depois as sem data
    filteredTasks.sort((a, b) => {
        // Se ambas têm data, ordenar por data
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        // Se apenas uma tem data, ela vem primeiro
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        // Se nenhuma tem data, manter a ordem original
        return 0;
    });
    
    filteredTasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });
    
    const remainingTasks = tasks.items.filter(task => !task.completed).length;
    taskCount.textContent = `${remainingTasks} tarefa${remainingTasks === 1 ? '' : 's'} restante${remainingTasks === 1 ? '' : 's'}`;
    
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks.items));
}

function addTask(text, date, time, progress) {
    const task = {
        id: Date.now(),
        text,
        completed: false
    };

    // Validar data e hora
    if (time && !date) {
        // Se tem hora mas não tem data, não salva nenhum dos dois
        console.warn('Hora informada sem data. A hora será ignorada.');
    } else if (date) {
        // Se tem data, salva com ou sem hora
        task.dueDate = formatDateTime(date, time).toISOString();
        task.hasTime = !!time; // Marca se tem hora ou não
    }

    // Adicionar progresso mesmo se for 0
    task.progress = parseInt(progress) || 0;

    tasks.items.push(task);
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.items.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
    }
}

function deleteTask(id) {
    tasks.items = tasks.items.filter(t => t.id !== id);
    renderTasks();
}

// Funções do ciclo Pomodoro
function updateCycleIndicator() {
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
}

function nextCycleStep() {
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
}

function saveCycleState() {
    localStorage.setItem('pomodoroCycleState', JSON.stringify(cycleState));
}

function loadCycleState() {
    const saved = localStorage.getItem('pomodoroCycleState');
    if (saved) {
        cycleState = { ...cycleState, ...JSON.parse(saved) };
    }
    updateCycleIndicator();
}

function resetCycle() {
    cycleState.currentStep = 0;
    cycleState.completedCycles = 0;
    updateTimerMode('pomodoro');
    updateCycleIndicator();
    saveCycleState();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    loadCycleState();
    
    // Request notification permission
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Set initial page title
    resetPageTitle();

    // Initialize modal elements
    const newTaskModal = document.getElementById('newTaskModal');
    const openNewTaskBtn = document.getElementById('openNewTaskBtn');
    const closeNewTask = document.getElementById('closeNewTask');
    const newTaskForm = document.getElementById('newTaskForm');
    const newTaskInput = document.getElementById('newTaskInput');

    const closeEditTask = document.getElementById('closeEditTask');
    const editTaskForm = document.getElementById('editTaskForm');

    // Modal management functions
    function showNewTaskModal() {
        newTaskModal.classList.remove('hidden');
        newTaskModal.classList.add('flex');
        newTaskInput.focus();
    }

    function hideNewTaskModal() {
        newTaskModal.classList.remove('flex');
        newTaskModal.classList.add('hidden');
        newTaskInput.value = '';
    }

    // Event listeners for modals
    openNewTaskBtn.addEventListener('click', showNewTaskModal);
    closeNewTask.addEventListener('click', hideNewTaskModal);
    closeEditTask.addEventListener('click', hideEditTaskModal);

    // Close modals when clicking outside
    newTaskModal.addEventListener('click', (e) => {
        if (e.target === newTaskModal) {
            hideNewTaskModal();
        }
    });

    editTaskModal.addEventListener('click', (e) => {
        if (e.target === editTaskModal) {
            hideEditTaskModal();
        }
    });

    // Progress range input handlers
    const newTaskProgress = document.getElementById('newTaskProgress');
    const newTaskProgressValue = document.getElementById('newTaskProgressValue');
    const editTaskProgress = document.getElementById('editTaskProgress');
    const editTaskProgressValue = document.getElementById('editTaskProgressValue');

    newTaskProgress.addEventListener('input', (e) => {
        newTaskProgressValue.textContent = `${e.target.value}%`;
    });

    editTaskProgress.addEventListener('input', (e) => {
        editTaskProgressValue.textContent = `${e.target.value}%`;
    });

    // Validação dos campos de data e hora
    const newTaskTime = document.getElementById('newTaskTime');
    const newTaskDate = document.getElementById('newTaskDate');
    const editTaskTime = document.getElementById('editTaskTime');
    const editTaskDate = document.getElementById('editTaskDate');

    // Função auxiliar para validação
    function validateDateTime(timeInput, dateInput) {
        timeInput.addEventListener('change', () => {
            if (timeInput.value && !dateInput.value) {
                alert('Para informar a hora, é necessário informar a data.');
                timeInput.value = '';
            }
        });
    }

    // Aplicar validação nos formulários
    validateDateTime(newTaskTime, newTaskDate);
    validateDateTime(editTaskTime, editTaskDate);

    // Função para controlar visibilidade do campo de hora
    function toggleTimeFieldVisibility(dateInput, timeContainer) {
        if (dateInput.value) {
            // Primeiro remove hidden para iniciar a animação
            timeContainer.classList.remove('hidden');
            // Pequeno delay para garantir que a transição seja suave
            setTimeout(() => {
                timeContainer.classList.remove('opacity-0', 'max-h-0');
                timeContainer.classList.add('opacity-100', 'max-h-24');
            }, 10);
        } else {
            // Primeiro anima a opacidade e altura
            timeContainer.classList.remove('opacity-100', 'max-h-24');
            timeContainer.classList.add('opacity-0', 'max-h-0');
            // Após a animação, esconde completamente
            setTimeout(() => {
                timeContainer.classList.add('hidden');
                timeContainer.querySelector('input[type="time"]').value = '';
            }, 300); // Mesmo tempo da duração da transição
        }
    }

    // Controlar visibilidade dos campos de hora
    const newTimeContainer = document.getElementById('newTimeContainer');
    const editTimeContainer = document.getElementById('editTimeContainer');

    // Inicializar estado dos campos de hora
    toggleTimeFieldVisibility(newTaskDate, newTimeContainer);
    toggleTimeFieldVisibility(editTaskDate, editTimeContainer);

    // Adicionar listeners para mudanças nos campos de data
    newTaskDate.addEventListener('input', () => toggleTimeFieldVisibility(newTaskDate, newTimeContainer));
    editTaskDate.addEventListener('input', () => toggleTimeFieldVisibility(editTaskDate, editTimeContainer));

    // Adicionar event listeners para os botões de limpar
    document.querySelectorAll('.clear-date').forEach(button => {
        button.addEventListener('click', (e) => {
            const dateInput = e.target.closest('div').querySelector('input[type="date"]');
            const timeContainer = dateInput.id === 'newTaskDate' ? newTimeContainer : editTimeContainer;
            dateInput.value = '';
            toggleTimeFieldVisibility(dateInput, timeContainer);
        });
    });

    document.querySelectorAll('.clear-time').forEach(button => {
        button.addEventListener('click', (e) => {
            const timeInput = e.target.closest('div').querySelector('input[type="time"]');
            timeInput.value = '';
        });
    });

    // Handle new task submission
    newTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = newTaskInput.value.trim();
        const date = newTaskDate.value;
        const time = newTaskTime.value;
        const progress = document.getElementById('newTaskProgress').value;
        
        if (text) {
            if (time && !date) {
                alert('Para informar a hora, é necessário informar a data.');
                return;
            }
            addTask(text, date, time, progress);
            hideNewTaskModal();
        }
    });

    // Handle edit task submission
    editTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = editTaskInput.value.trim();
        const date = editTaskDate.value;
        const time = editTaskTime.value;
        const progress = document.getElementById('editTaskProgress').value;
        
        if (text && currentEditingTaskId) {
            if (time && !date) {
                alert('Para informar a hora, é necessário informar a data.');
                return;
            }
            editTask(currentEditingTaskId, text, date, time, progress);
            hideEditTaskModal();
        }
    });
});

startBtn.addEventListener('click', startTimer);

resetBtn.addEventListener('click', () => {
    clearInterval(timerState.timerId);
    timerState.isRunning = false;
    timerState.timeLeft = timerState.initialTime;
    updateTimerDisplay();
    startBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Iniciar';
    releaseWakeLock(); // Liberar wake lock quando resetar
    resetPageTitle();
    
    // Resetar ciclo para o início
    resetCycle();
});

modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (timerState.isRunning) {
            clearInterval(timerState.timerId);
            timerState.isRunning = false;
            startBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Iniciar';
            releaseWakeLock(); // Liberar wake lock quando mudar modo
        }
        updateTimerMode(button.dataset.mode);
        resetPageTitle();
    });
});

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

settingsForm.addEventListener('submit', (e) => {
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

themeToggle.addEventListener('click', () => {
    settings.darkMode = !settings.darkMode;
    document.documentElement.classList.toggle('dark', settings.darkMode);
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    themeToggle.innerHTML = settings.darkMode ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (text) {
        addTask(text);
        taskInput.value = '';
    }
});

// Remove old task form event listener
toggleCompleted.addEventListener('click', () => {
    tasks.showCompleted = !tasks.showCompleted;
    toggleCompleted.textContent = tasks.showCompleted ? 'Ocultar Concluídas' : 'Mostrar Concluídas';
    renderTasks();
});

// Stop alarm button event listener
const stopAlarmBtn = document.getElementById('stopAlarmBtn');
if (stopAlarmBtn) {
    stopAlarmBtn.addEventListener('click', stopAlarm);
}

// Request notification permission on page load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Event listener para reativar wake lock quando a página volta ao foco
document.addEventListener('visibilitychange', handleVisibilityChange);

// Liberar wake lock quando a página for fechada
window.addEventListener('beforeunload', () => {
    releaseWakeLock();
});

// Função para obter Wake Lock
async function getWakeLock() {
    try {
        // Liberar Wake Lock anterior, se existir
        if (timerState.wakeLock) {
            await timerState.wakeLock.release();
            timerState.wakeLock = null;
        }
        
        // Solicitar novo Wake Lock
        timerState.wakeLock = await navigator.wakeLock.request('screen');
        
        // Atualizar o estado do Wake Lock
        timerState.wakeLock.addEventListener('release', () => {
            timerState.wakeLock = null;
        });
    } catch (err) {
        console.error(`Erro ao obter Wake Lock: ${err}`);
    }
}

function editTask(id, text, date, time, progress) {
    const task = tasks.items.find(t => t.id === id);
    if (task) {
        task.text = text;
        
        // Validar data e hora
        if (time && !date) {
            // Se tem hora mas não tem data, não salva nenhum dos dois
            console.warn('Hora informada sem data. A hora será ignorada.');
            delete task.dueDate;
            delete task.hasTime;
        } else if (date) {
            // Se tem data, salva com ou sem hora
            task.dueDate = formatDateTime(date, time).toISOString();
            task.hasTime = !!time; // Marca se tem hora ou não
        } else {
            // Se não tem data, remove a data existente
            delete task.dueDate;
            delete task.hasTime;
        }
        
        // Atualizar progresso mesmo se for 0
        task.progress = parseInt(progress) || 0;
        
        renderTasks();
    }
}