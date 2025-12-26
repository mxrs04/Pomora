let timeLeft = 25 * 60;
let timerId = null;
let isRunning = false;
let isFocusMode = true;
let currentAudioId = null; 

const elements = {
    timer: document.getElementById('timer'),
    startBtn: document.getElementById('startBtn'),
    status: document.getElementById('status-text'),
    themeToggle: document.getElementById('theme-toggle'),
    focusSelect: document.getElementById('focusTimeSelect'),
    breakSelect: document.getElementById('breakTimeSelect'),
    soundSelect: document.getElementById('soundSelect'),
    sessionCount: document.getElementById('session-count'),
    notepad: document.getElementById('notepad'),
    mainTask: document.getElementById('main-task-input'),
    shortcutBtn: document.getElementById('pomodoroShortcut'),
    resetBtn: document.getElementById('resetBtn'),
    audioClick: document.getElementById('audio-click'),
    audioGong: document.getElementById('audio-gong')
};

function init() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        elements.themeToggle.checked = true;
    }
    
    // START-KONFIGURATION
    // Klick & Gong laut
    if(elements.audioClick) elements.audioClick.volume = 1.0;
    if(elements.audioGong) elements.audioGong.volume = 1.0;

    loadStats();
    elements.notepad.value = localStorage.getItem('notepadContent') || '';
    elements.mainTask.value = localStorage.getItem('mainTaskContent') || '';
}

function playSelectedAmbience() {
    const selection = elements.soundSelect.value;
    stopAmbience(); // Erstmal alles andere aus

    if (selection === 'none') return;

    let targetId = '';
    // HIER SETZEN WIR DIE LAUTSTÄRKE JETZT DIREKT BEIM ABSPIELEN
    // Damit wird sichergestellt, dass sie angewendet wird
    let volumeLevel = 0.5; // Standard

    if (selection === 'rain') {
        targetId = 'audio-rain';
        volumeLevel = 0.3; // Regen Lautstärke (30%)
    }
    if (selection === 'white') {
        targetId = 'audio-white';
        volumeLevel = 0.05; // White/Brown Noise SEHR LEISE (5%)
    }
    if (selection === 'cafe') {
        targetId = 'audio-cafe';
        volumeLevel = 0.4; // Cafe Lautstärke (40%)
    }

    if (targetId) {
        const player = document.getElementById(targetId);
        if(player) {
            player.volume = volumeLevel; // Hier wird die Lautstärke erzwungen!
            player.play().catch(e => console.log("Abspielen blockiert:", e));
            currentAudioId = targetId;
        }
    }
}

function stopAmbience() {
    if (currentAudioId) {
        const player = document.getElementById(currentAudioId);
        if(player) {
            player.pause();
            player.currentTime = 0; // Zurückspulen
        }
        currentAudioId = null;
    }
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.title = `(${minutes}:${seconds.toString().padStart(2, '0')}) GlassFocus`;
}

function startTimer() {
    isRunning = true;
    if(elements.audioClick) elements.audioClick.play();
    playSelectedAmbience();

    elements.startBtn.textContent = 'Pause';
    elements.status.textContent = isFocusMode ? 'FOKUS MODE' : 'PAUSENZEIT';
    elements.status.style.opacity = '1';

    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft === 0) {
            completeSession();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerId);
    elements.startBtn.textContent = 'Weiter';
    elements.status.textContent = 'PAUSIERT';
    elements.status.style.opacity = '0.5';
    stopAmbience();
}

function resetTimer() {
    pauseTimer();
    isFocusMode = true;
    timeLeft = parseInt(elements.focusSelect.value) * 60;
    updateDisplay();
    elements.startBtn.textContent = 'Start';
    elements.status.textContent = 'BEREIT';
    elements.status.style.opacity = '1';
}

function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function completeSession() {
    pauseTimer();
    if(elements.audioGong) elements.audioGong.play();
    
    if (isFocusMode) {
        incrementStats();
        isFocusMode = false;
        timeLeft = parseInt(elements.breakSelect.value) * 60;
        elements.status.textContent = 'ZEIT FÜR PAUSE';
        elements.startBtn.textContent = 'Pause starten';
        flashScreen('#30d158');
    } else {
        isFocusMode = true;
        timeLeft = parseInt(elements.focusSelect.value) * 60;
        elements.status.textContent = 'FOKUS BEENDET';
        elements.startBtn.textContent = 'Fokus starten';
        flashScreen('#0a84ff');
    }
    updateDisplay();
}

function quickStartPomodoro() {
    elements.focusSelect.value = "25";
    elements.breakSelect.value = "5";
    resetTimer();
    startTimer();
}

// EVENTS
elements.soundSelect.addEventListener('change', function() {
    if (isRunning) {
        playSelectedAmbience();
    }
});

elements.startBtn.addEventListener('click', toggleTimer);
elements.resetBtn.addEventListener('click', resetTimer);
elements.shortcutBtn.addEventListener('click', quickStartPomodoro);
elements.focusSelect.addEventListener('change', function() { if (!isRunning && isFocusMode) { timeLeft = parseInt(this.value) * 60; updateDisplay(); }});
elements.breakSelect.addEventListener('change', function() { if (!isRunning && !isFocusMode) { timeLeft = parseInt(this.value) * 60; updateDisplay(); }});
elements.themeToggle.addEventListener('change', function(e) {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});
elements.notepad.addEventListener('input', (e) => localStorage.setItem('notepadContent', e.target.value));
elements.mainTask.addEventListener('input', (e) => localStorage.setItem('mainTaskContent', e.target.value));

function loadStats() {
    const today = new Date().toLocaleDateString();
    const stats = JSON.parse(localStorage.getItem('glassFocusStats')) || { date: today, count: 0 };
    if (stats.date !== today) { stats.date = today; stats.count = 0; }
    elements.sessionCount.textContent = stats.count;
    localStorage.setItem('glassFocusStats', JSON.stringify(stats));
}
function incrementStats() {
    const stats = JSON.parse(localStorage.getItem('glassFocusStats'));
    stats.count++;
    localStorage.setItem('glassFocusStats', JSON.stringify(stats));
    elements.sessionCount.textContent = stats.count;
}
function flashScreen(color) {
    const originalBg = getComputedStyle(document.body).backgroundColor;
    document.body.style.backgroundColor = color;
    setTimeout(() => { document.body.style.backgroundColor = ""; }, 300);
}

init();