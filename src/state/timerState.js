// Estado do cronômetro
export const timerState = {
    mode: 'pomodoro',
    timeLeft: 5, // em segundos
    initialTime: 5,
    isRunning: false,
    timerId: null,
    alarmAudio: null,
    isAlarmPlaying: false,
    wakeLock: null // Wake Lock para manter a tela ativa
};

export const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const resetPageTitle = () => {
    document.title = 'Pomodoro';
}; 