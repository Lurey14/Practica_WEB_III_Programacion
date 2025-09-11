// Tic Tac Toe Game with Battery Monitoring, Sound, and Volume Control

class TicTacToeGame {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.level = 1;
        this.scores = { X: 0, O: 0, draw: 0 };
        
        // Audio context for sound effects
        this.audioContext = null;
        this.masterVolume = 0.5;
        this.gainNode = null;
        
        // Battery monitoring
        this.battery = null;
        this.batteryCheckInterval = null;
        
        // Initialize the game
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.initAudio();
        await this.initBatteryMonitoring();
        this.updateDisplay();
        this.checkBatteryLevel();
    }
    
    setupEventListeners() {
        // Game board clicks
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
        
        // Control buttons
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        document.getElementById('levelUp').addEventListener('click', () => this.levelUp());
        
        // Volume control
        const volumeControl = document.getElementById('volumeControl');
        volumeControl.addEventListener('input', (e) => this.updateVolume(e.target.value));
        volumeControl.addEventListener('change', () => this.playSound('volumeChange'));
    }
    
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.masterVolume;
            
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Audio not supported:', error);
        }
    }
    
    async initBatteryMonitoring() {
        try {
            if ('getBattery' in navigator) {
                this.battery = await navigator.getBattery();
                this.updateBatteryDisplay();
                
                // Listen for battery events
                this.battery.addEventListener('chargingchange', () => this.updateBatteryDisplay());
                this.battery.addEventListener('levelchange', () => this.updateBatteryDisplay());
                
                // Check battery level periodically
                this.batteryCheckInterval = setInterval(() => this.checkBatteryLevel(), 30000);
            } else {
                document.getElementById('batteryLevel').textContent = 'Not supported';
            }
        } catch (error) {
            console.warn('Battery API not supported:', error);
            document.getElementById('batteryLevel').textContent = 'Not available';
        }
    }
    
    updateBatteryDisplay() {
        if (!this.battery) return;
        
        const level = Math.round(this.battery.level * 100);
        const charging = this.battery.charging;
        
        document.getElementById('batteryLevel').textContent = `${level}%`;
        document.getElementById('chargingStatus').textContent = charging ? '🔌 Charging' : '🔋 Not charging';
        
        // Update battery level color based on level
        const batteryElement = document.getElementById('batteryLevel');
        if (level < 20) {
            batteryElement.style.background = '#f8d7da';
            batteryElement.style.color = '#721c24';
        } else if (level < 50) {
            batteryElement.style.background = '#fff3cd';
            batteryElement.style.color = '#856404';
        } else {
            batteryElement.style.background = '#d1ecf1';
            batteryElement.style.color = '#0c5460';
        }
        
        // Show charging status message
        this.showChargingMessage(charging);
    }
    
    showChargingMessage(isCharging) {
        const message = isCharging ? 
            '🔌 Charger connected - Game performance optimized!' : 
            '🔋 Running on battery power';
            
        // Create or update charging message
        let chargingMsg = document.getElementById('chargingMessage');
        if (!chargingMsg) {
            chargingMsg = document.createElement('div');
            chargingMsg.id = 'chargingMessage';
            chargingMsg.className = 'charging-message';
            chargingMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${isCharging ? '#d4edda' : '#fff3cd'};
                color: ${isCharging ? '#155724' : '#856404'};
                padding: 10px 15px;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(chargingMsg);
        }
        
        chargingMsg.textContent = message;
        chargingMsg.style.background = isCharging ? '#d4edda' : '#fff3cd';
        chargingMsg.style.color = isCharging ? '#155724' : '#856404';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (chargingMsg) {
                chargingMsg.style.opacity = '0';
                setTimeout(() => {
                    if (chargingMsg.parentNode) {
                        chargingMsg.parentNode.removeChild(chargingMsg);
                    }
                }, 300);
            }
        }, 3000);
    }
    
    checkBatteryLevel() {
        if (!this.battery) return;
        
        const level = this.battery.level * 100;
        const warningElement = document.getElementById('batteryWarning');
        
        if (level < 15 && !this.battery.charging) {
            warningElement.style.display = 'block';
            this.playSound('batteryLow');
        } else {
            warningElement.style.display = 'none';
        }
    }
    
    updateVolume(value) {
        this.masterVolume = value / 100;
        if (this.gainNode) {
            this.gainNode.gain.value = this.masterVolume;
        }
        document.getElementById('volumeLevel').textContent = `${value}%`;
    }
    
    playSound(type) {
        if (!this.audioContext) return;
        
        // Resume audio context if suspended (required by browser policies)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        let frequency, duration;
        
        switch (type) {
            case 'move':
                frequency = 800 + (this.level * 100); // Different frequency per level
                duration = 0.1;
                break;
            case 'win':
                this.playWinSound();
                return;
            case 'draw':
                frequency = 300;
                duration = 0.5;
                break;
            case 'batteryLow':
                frequency = 200;
                duration = 1.0;
                this.playWarningSequence();
                return;
            case 'levelUp':
                this.playLevelUpSound();
                return;
            case 'volumeChange':
                frequency = 1000;
                duration = 0.05;
                break;
            default:
                frequency = 500;
                duration = 0.1;
        }
        
        this.playTone(frequency, duration);
    }
    
    playTone(frequency, duration) {
        const oscillator = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();
        
        oscillator.connect(envelope);
        envelope.connect(this.gainNode);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        envelope.gain.setValueAtTime(0, this.audioContext.currentTime);
        envelope.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        envelope.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playWinSound() {
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        notes.forEach((freq, index) => {
            setTimeout(() => this.playTone(freq, 0.3), index * 150);
        });
    }
    
    playLevelUpSound() {
        const notes = [440, 554, 659, 880]; // A, C#, E, A
        notes.forEach((freq, index) => {
            setTimeout(() => this.playTone(freq, 0.2), index * 100);
        });
    }
    
    playWarningSequence() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.playTone(300, 0.2);
                setTimeout(() => this.playTone(200, 0.2), 250);
            }, i * 500);
        }
    }
    
    handleCellClick(e) {
        const cell = e.target;
        const index = parseInt(cell.dataset.index);
        
        if (this.board[index] !== '' || !this.gameActive) {
            return;
        }
        
        // Make move
        this.board[index] = this.currentPlayer;
        cell.textContent = this.currentPlayer;
        cell.classList.add('taken', this.currentPlayer.toLowerCase());
        
        // Play move sound
        this.playSound('move');
        
        // Check for win or draw
        if (this.checkWin()) {
            this.handleWin();
        } else if (this.board.every(cell => cell !== '')) {
            this.handleDraw();
        } else {
            this.switchPlayer();
        }
    }
    
    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        
        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.highlightWinningCells(pattern);
                return true;
            }
        }
        return false;
    }
    
    highlightWinningCells(pattern) {
        pattern.forEach(index => {
            document.querySelector(`[data-index="${index}"]`).classList.add('winning');
        });
    }
    
    handleWin() {
        this.gameActive = false;
        this.scores[this.currentPlayer]++;
        document.getElementById('gameMessage').textContent = `Player ${this.currentPlayer} wins!`;
        document.getElementById('gameMessage').classList.add('winner');
        this.updateScoreBoard();
        this.playSound('win');
    }
    
    handleDraw() {
        this.gameActive = false;
        this.scores.draw++;
        document.getElementById('gameMessage').textContent = "It's a draw!";
        document.getElementById('gameMessage').classList.add('draw');
        this.updateScoreBoard();
        this.playSound('draw');
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('currentPlayer').textContent = `Player ${this.currentPlayer}`;
    }
    
    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        
        // Reset UI
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        
        document.getElementById('gameMessage').textContent = 'Make your move!';
        document.getElementById('gameMessage').className = 'game-message';
        document.getElementById('currentPlayer').textContent = 'Player X';
        
        this.playSound('move');
    }
    
    levelUp() {
        this.level++;
        document.getElementById('gameLevel').textContent = this.level;
        this.playSound('levelUp');
        
        // Show level up message
        const levelMsg = document.createElement('div');
        levelMsg.textContent = `Level ${this.level} unlocked!`;
        levelMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 1.5rem;
            font-weight: bold;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 1001;
            animation: celebration 0.6s ease;
        `;
        
        document.body.appendChild(levelMsg);
        setTimeout(() => {
            if (levelMsg.parentNode) {
                levelMsg.parentNode.removeChild(levelMsg);
            }
        }, 2000);
    }
    
    updateScoreBoard() {
        document.getElementById('scoreX').textContent = this.scores.X;
        document.getElementById('scoreO').textContent = this.scores.O;
        document.getElementById('scoreDraw').textContent = this.scores.draw;
    }
    
    updateDisplay() {
        this.updateScoreBoard();
        document.getElementById('gameLevel').textContent = this.level;
        document.getElementById('volumeLevel').textContent = `${this.masterVolume * 100}%`;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.ticTacToeGame = new TicTacToeGame();
});

// Handle audio context resume on first user interaction
document.addEventListener('click', () => {
    if (window.ticTacToeGame && window.ticTacToeGame.audioContext && window.ticTacToeGame.audioContext.state === 'suspended') {
        window.ticTacToeGame.audioContext.resume();
    }
}, { once: true });