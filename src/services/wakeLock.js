let wakeLock = null;

export const requestWakeLock = async () => {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock ativado - tela permanecerá ligada');
            
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock liberado');
                wakeLock = null;
            });
            
            return wakeLock;
        } else {
            console.log('Wake Lock API não suportada neste navegador');
        }
    } catch (err) {
        console.error('Erro ao solicitar Wake Lock:', err);
    }
};

export const releaseWakeLock = async () => {
    if (wakeLock) {
        try {
            await wakeLock.release();
            wakeLock = null;
            console.log('Wake Lock liberado manualmente');
        } catch (err) {
            console.error('Erro ao liberar Wake Lock:', err);
        }
    }
};

export const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && !wakeLock) {
        await requestWakeLock();
    }
}; 