// Estado do ciclo Pomodoro
export const cycleState = {
    currentStep: 0, // 0: pomodoro, 1: shortBreak, 2: pomodoro, 3: longBreak
    sequence: ['pomodoro', 'shortBreak', 'pomodoro', 'longBreak'],
    completedCycles: 0
};

export const saveCycleState = () => {
    localStorage.setItem('pomodoroCycleState', JSON.stringify(cycleState));
};

export const loadCycleState = () => {
    const saved = localStorage.getItem('pomodoroCycleState');
    if (saved) {
        Object.assign(cycleState, JSON.parse(saved));
    }
    return cycleState;
};

export const resetCycle = () => {
    cycleState.currentStep = 0;
    cycleState.completedCycles = 0;
    saveCycleState();
    return cycleState;
}; 