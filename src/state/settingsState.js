// Estado das configurações com valores padrão
export const settings = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    darkMode: false
};

export const loadSettings = () => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        Object.assign(settings, JSON.parse(savedSettings));
    }
    return settings;
};

export const saveSettings = () => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}; 