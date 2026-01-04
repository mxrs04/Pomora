// --- STATE ---
let timeLeft = 25 * 60;
let totalTime = 25 * 60;
let timerId = null;
let isRunning = false;
let isFocusMode = true;
let currentAudioId = null; 

// --- DOM ELEMENTS ---
const elements = {
    timer: document.getElementById('timer'),
    startBtn: document.getElementById('startBtn'),
    startText: document.getElementById('start-text'),
    startIcon: document.getElementById('start-icon'),
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
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    audioClick: document.getElementById('audio-click'),
    audioGong: document.getElementById('audio-gong')
};

function init() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        elements.themeToggle.checked = true;
    }
    
    // Audio Settings
    const rain = document.getElementById('audio-rain');
    const white = document.getElementById('audio-white');
    const cafe = document.getElementById('audio-cafe');
    if(rain) rain.volume = 0.3;
    if(white) white.volume = 0.05; 
    if(cafe) cafe.volume = 0.4;
    if(elements.audioClick) elements.audioClick.volume = 1.0;
    if(elements.audioGong) elements.audioGong.volume = 1.0;

    loadStats();
    elements.notepad.value = localStorage.getItem('notepadContent') || '';
    elements.mainTask.value = localStorage.getItem('mainTaskContent') || '';
    
    updateColors();
}

// --- SOUND ---
function playSelectedAmbience() {
    const selection = elements.soundSelect.value;
    stopAmbience(); 
    if (selection === 'none') return;
    let targetId = ''; let volumeLevel = 0.5;
    if (selection === 'rain') { targetId = 'audio-rain'; volumeLevel = 0.3; }
    if (selection === 'white') { targetId = 'audio-white'; volumeLevel = 0.05; }
    if (selection === 'cafe') { targetId = 'audio-cafe'; volumeLevel = 0.4; }

    if (targetId) {
        const player = document.getElementById(targetId);
        if(player) {
            player.volume = volumeLevel; 
            player.play().catch(e => console.log("Blocked:", e));
            currentAudioId = targetId;
        }
    }
}

function stopAmbience() {
    if (currentAudioId) {
        const player = document.getElementById(currentAudioId);
        if(player) { player.pause(); player.currentTime = 0; }
        currentAudioId = null;
    }
}

// --- VISUALS ---
function updateColors() {
    const colorVar = isFocusMode ? 'var(--accent-color)' : 'var(--pause-color)';
    
    if(isRunning) {
        elements.timer.style.color = colorVar;
        elements.status.style.color = colorVar;
    } else {
        elements.timer.style.color = 'var(--text-color)';
        elements.status.style.color = 'var(--text-color)';
    }
    
    if(elements.progressBar) {
        elements.progressBar.style.backgroundColor = colorVar;
        elements.progressBar.style.boxShadow = `0 0 15px ${colorVar}`;
    }
    if(elements.progressText) {
        elements.progressText.style.color = colorVar;
    }
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const modeName = isFocusMode ? 'Fokus' : 'Pause';
    document.title = `(${minutes}:${seconds.toString().padStart(2, '0')}) ${modeName} - Pomora`;

    // Progress Update
    if (elements.progressBar) {
        let percent = 0;
        if(totalTime > 0) {
            percent = ((totalTime - timeLeft) / totalTime) * 100;
        }
        percent = Math.min(100, Math.max(0, percent)); 

        elements.progressBar.style.width = `${percent}%`;
        
        if(elements.progressText) {
            elements.progressText.textContent = `${Math.round(percent)}%`;
        }
    }
}

// --- TIMER CONTROL ---
function startTimer() {
    isRunning = true;
    if(elements.audioClick) elements.audioClick.play();
    playSelectedAmbience();

    // Button Icon Update
    elements.startText.textContent = 'Pause';
    elements.startIcon.textContent = '⏸'; 
    
    elements.status.textContent = isFocusMode ? 'FOKUS MODE' : 'PAUSENZEIT';
    elements.status.style.opacity = '1';
    
    updateColors();

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
    
    elements.startText.textContent = 'Weiter';
    elements.startIcon.textContent = '▶'; 

    elements.status.textContent = 'PAUSIERT';
    elements.status.style.opacity = '0.5';
    stopAmbience();
    updateColors();
}

function resetTimer() {
    pauseTimer();
    isFocusMode = true;
    const select = isFocusMode ? elements.focusSelect : elements.breakSelect;
    timeLeft = parseInt(select.value) * 60;
    totalTime = timeLeft; 

    updateDisplay();
    elements.startText.textContent = 'Start';
    elements.startIcon.textContent = '▶';

    elements.status.textContent = 'BEREIT';
    elements.status.style.opacity = '1';
    
    if(elements.progressBar) elements.progressBar.style.width = '0%';
    if(elements.progressText) elements.progressText.textContent = '0%';
    updateColors();
}

function toggleTimer() {
    if (isRunning) pauseTimer();
    else startTimer();
}

function completeSession() {
    pauseTimer();
    if(elements.audioGong) elements.audioGong.play();
    
    if (isFocusMode) {
        incrementStats();
        isFocusMode = false;
        timeLeft = parseInt(elements.breakSelect.value) * 60;
        totalTime = timeLeft;
        elements.status.textContent = 'ZEIT FÜR PAUSE';
        elements.startText.textContent = 'Pause starten';
        elements.startIcon.textContent = '▶';
        flashScreen('#ff9f0a');
    } else {
        isFocusMode = true;
        timeLeft = parseInt(elements.focusSelect.value) * 60;
        totalTime = timeLeft;
        elements.status.textContent = 'FOKUS BEENDET';
        elements.startText.textContent = 'Fokus starten';
        elements.startIcon.textContent = '▶';
        flashScreen('#007aff');
    }
    updateDisplay();
    updateColors();
}

function quickStartPomodoro() {
    elements.focusSelect.value = "25";
    elements.breakSelect.value = "5";
    resetTimer();
    startTimer();
}

// --- EVENTS ---
elements.soundSelect.addEventListener('change', function() { if (isRunning) playSelectedAmbience(); });
elements.startBtn.addEventListener('click', toggleTimer);
elements.resetBtn.addEventListener('click', resetTimer);
elements.shortcutBtn.addEventListener('click', quickStartPomodoro);

elements.focusSelect.addEventListener('change', function() { 
    if (!isRunning && isFocusMode) { 
        timeLeft = parseInt(this.value) * 60; totalTime = timeLeft; updateDisplay(); 
    }
});
elements.breakSelect.addEventListener('change', function() { 
    if (!isRunning && !isFocusMode) { 
        timeLeft = parseInt(this.value) * 60; totalTime = timeLeft; updateDisplay(); 
    }
});
elements.themeToggle.addEventListener('change', function(e) {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});
elements.notepad.addEventListener('input', (e) => localStorage.setItem('notepadContent', e.target.value));
elements.mainTask.addEventListener('input', (e) => localStorage.setItem('mainTaskContent', e.target.value));

// --- HELPER ---
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