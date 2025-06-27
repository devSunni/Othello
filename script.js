class OthelloGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'black';
        this.gameHistory = [];
        this.validMoves = [];
        this.boardSize = 8;
        this.directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        // 사용자 관리
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('othello_users')) || {};
        this.gameStats = JSON.parse(localStorage.getItem('othello_stats')) || {};
        
        this.initializeBoard();
        this.setupEventListeners();
        this.updateValidMoves();
        this.updateDisplay();
        this.updateUserDisplay();
        this.addChatMessage('system', '준우와 함께하는 오셀로 게임을 시작합니다! 흑돌부터 시작합니다.');
    }

    initializeBoard() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        
        // 초기 배치
        const center = this.boardSize / 2;
        this.board[center - 1][center - 1] = 'white';
        this.board[center - 1][center] = 'black';
        this.board[center][center - 1] = 'black';
        this.board[center][center] = 'white';
    }

    setupEventListeners() {
        const boardElement = document.getElementById('board');
        boardElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.makeMove(row, col);
            }
        });

        document.getElementById('new-game').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('hint').addEventListener('click', () => {
            this.showHint();
        });

        document.getElementById('undo').addEventListener('click', () => {
            this.undoMove();
        });

        document.getElementById('stats').addEventListener('click', () => {
            this.showStats();
        });

        document.getElementById('send-message').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        document.getElementById('play-again').addEventListener('click', () => {
            this.newGame();
            this.hideGameOverModal();
        });

        // 사용자 관리 이벤트
        document.getElementById('login-btn').addEventListener('click', () => {
            this.showLoginModal();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('register-btn').addEventListener('click', () => {
            this.register();
        });

        document.getElementById('login-submit-btn').addEventListener('click', () => {
            this.login();
        });

        document.getElementById('close-login').addEventListener('click', () => {
            this.hideLoginModal();
        });

        document.getElementById('close-stats').addEventListener('click', () => {
            this.hideStatsModal();
        });

        // 모달 외부 클릭 시 닫기
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // 사용자 관리 함수들
    showLoginModal() {
        document.getElementById('login-modal').style.display = 'block';
        document.getElementById('username').focus();
    }

    hideLoginModal() {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    register() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            this.addChatMessage('system', '사용자명과 비밀번호를 입력해주세요.');
            return;
        }

        if (username.length < 3) {
            this.addChatMessage('system', '사용자명은 3자 이상이어야 합니다.');
            return;
        }

        if (this.users[username]) {
            this.addChatMessage('system', '이미 존재하는 사용자명입니다.');
            return;
        }

        // 사용자 등록
        this.users[username] = {
            password: password,
            createdAt: new Date().toISOString()
        };

        // 전적 초기화
        this.gameStats[username] = {
            totalGames: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            gameHistory: []
        };

        this.saveData();
        this.currentUser = username;
        this.updateUserDisplay();
        this.hideLoginModal();
        this.addChatMessage('system', `${username}님, 환영합니다! 회원가입이 완료되었습니다.`);
    }

    login() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            this.addChatMessage('system', '사용자명과 비밀번호를 입력해주세요.');
            return;
        }

        if (!this.users[username]) {
            this.addChatMessage('system', '존재하지 않는 사용자명입니다.');
            return;
        }

        if (this.users[username].password !== password) {
            this.addChatMessage('system', '비밀번호가 일치하지 않습니다.');
            return;
        }

        this.currentUser = username;
        this.updateUserDisplay();
        this.hideLoginModal();
        this.addChatMessage('system', `${username}님, 환영합니다!`);
    }

    logout() {
        this.currentUser = null;
        this.updateUserDisplay();
        this.addChatMessage('system', '로그아웃되었습니다.');
    }

    updateUserDisplay() {
        const currentUserElement = document.getElementById('current-user');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (this.currentUser) {
            currentUserElement.textContent = this.currentUser;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
        } else {
            currentUserElement.textContent = '게스트';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
    }

    saveData() {
        localStorage.setItem('othello_users', JSON.stringify(this.users));
        localStorage.setItem('othello_stats', JSON.stringify(this.gameStats));
    }

    // 전적 관리 함수들
    showStats() {
        if (!this.currentUser) {
            this.addChatMessage('system', '전적을 보려면 로그인해주세요.');
            return;
        }

        const stats = this.gameStats[this.currentUser];
        document.getElementById('total-games').textContent = stats.totalGames;
        document.getElementById('wins').textContent = stats.wins;
        document.getElementById('losses').textContent = stats.losses;
        
        const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
        document.getElementById('win-rate').textContent = `${winRate}%`;

        this.updateGameHistory();
        document.getElementById('stats-modal').style.display = 'block';
    }

    hideStatsModal() {
        document.getElementById('stats-modal').style.display = 'none';
    }

    updateGameHistory() {
        const historyContainer = document.getElementById('game-history');
        const stats = this.gameStats[this.currentUser];
        
        historyContainer.innerHTML = '';
        
        if (stats.gameHistory.length === 0) {
            historyContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">아직 게임 기록이 없습니다.</p>';
            return;
        }

        // 최근 10개 게임만 표시
        const recentGames = stats.gameHistory.slice(-10).reverse();
        
        recentGames.forEach(game => {
            const gameRecord = document.createElement('div');
            gameRecord.className = `game-record ${game.result}`;
            
            const date = new Date(game.date).toLocaleDateString('ko-KR');
            const time = new Date(game.date).toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            gameRecord.innerHTML = `
                <span>${date} ${time}</span>
                <span>${game.blackScore}:${game.whiteScore} (${this.getResultText(game.result)})</span>
            `;
            
            historyContainer.appendChild(gameRecord);
        });
    }

    getResultText(result) {
        switch(result) {
            case 'win': return '승리';
            case 'loss': return '패배';
            case 'draw': return '무승부';
            default: return '알 수 없음';
        }
    }

    saveGameResult(blackScore, whiteScore) {
        if (!this.currentUser) return;

        const stats = this.gameStats[this.currentUser];
        stats.totalGames++;
        
        let result;
        if (blackScore > whiteScore) {
            stats.wins++;
            result = 'win';
        } else if (whiteScore > blackScore) {
            stats.losses++;
            result = 'loss';
        } else {
            stats.draws++;
            result = 'draw';
        }

        stats.gameHistory.push({
            date: new Date().toISOString(),
            blackScore: blackScore,
            whiteScore: whiteScore,
            result: result
        });

        this.saveData();
    }

    isValidMove(row, col, player) {
        if (this.board[row][col] !== null) return false;

        for (const [dr, dc] of this.directions) {
            if (this.wouldFlip(row, col, dr, dc, player).length > 0) {
                return true;
            }
        }
        return false;
    }

    wouldFlip(row, col, dr, dc, player) {
        const flips = [];
        let r = row + dr;
        let c = col + dc;
        const opponent = player === 'black' ? 'white' : 'black';

        while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
            if (this.board[r][c] === opponent) {
                flips.push([r, c]);
            } else if (this.board[r][c] === player) {
                return flips;
            } else {
                break;
            }
            r += dr;
            c += dc;
        }
        return [];
    }

    makeMove(row, col) {
        if (!this.isValidMove(row, col, this.currentPlayer)) {
            return false;
        }

        // 게임 히스토리 저장
        this.gameHistory.push({
            board: JSON.parse(JSON.stringify(this.board)),
            currentPlayer: this.currentPlayer
        });

        // 돌 배치
        this.board[row][col] = this.currentPlayer;

        // 돌 뒤집기
        for (const [dr, dc] of this.directions) {
            const flips = this.wouldFlip(row, col, dr, dc, this.currentPlayer);
            for (const [fr, fc] of flips) {
                this.board[fr][fc] = this.currentPlayer;
            }
        }

        // 플레이어 변경
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';

        // 유효한 수가 없으면 패스
        if (!this.hasValidMoves()) {
            this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
            if (!this.hasValidMoves()) {
                this.endGame();
                return true;
            }
            this.addChatMessage('system', `${this.currentPlayer === 'black' ? '흑' : '백'}이 패스합니다.`);
        }

        this.updateValidMoves();
        this.updateDisplay();
        this.addChatMessage('system', `${this.currentPlayer === 'black' ? '흑' : '백'}의 차례입니다.`);

        return true;
    }

    hasValidMoves() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col, this.currentPlayer)) {
                    return true;
                }
            }
        }
        return false;
    }

    updateValidMoves() {
        this.validMoves = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col, this.currentPlayer)) {
                    this.validMoves.push([row, col]);
                }
            }
        }
    }

    updateDisplay() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (this.board[row][col] === 'black') {
                    cell.classList.add('black');
                    cell.textContent = '⚫';
                } else if (this.board[row][col] === 'white') {
                    cell.classList.add('white');
                    cell.textContent = '⚪';
                }

                // 유효한 수 표시
                if (this.isValidMove(row, col, this.currentPlayer)) {
                    cell.classList.add('valid-move');
                }

                boardElement.appendChild(cell);
            }
        }

        // 점수 업데이트
        this.updateScore();
        
        // 현재 플레이어 표시
        document.getElementById('current-player').textContent = 
            this.currentPlayer === 'black' ? '흑' : '백';
    }

    updateScore() {
        let blackCount = 0;
        let whiteCount = 0;

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 'black') blackCount++;
                else if (this.board[row][col] === 'white') whiteCount++;
            }
        }

        document.getElementById('black-score').textContent = blackCount;
        document.getElementById('white-score').textContent = whiteCount;
    }

    showHint() {
        if (this.validMoves.length === 0) {
            this.addChatMessage('system', '놓을 수 있는 수가 없습니다.');
            return;
        }

        const hint = this.validMoves[Math.floor(Math.random() * this.validMoves.length)];
        const row = hint[0] + 1;
        const col = String.fromCharCode(65 + hint[1]); // A, B, C, ...
        
        this.addChatMessage('ai', `힌트: ${col}${row} 위치에 놓아보세요!`);
        
        // 힌트 위치 하이라이트
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => cell.classList.remove('hint'));
        
        const hintCell = document.querySelector(`[data-row="${hint[0]}"][data-col="${hint[1]}"]`);
        if (hintCell) {
            hintCell.style.background = '#e74c3c';
            hintCell.style.animation = 'pulse 1s infinite';
            
            setTimeout(() => {
                hintCell.style.background = '';
                hintCell.style.animation = '';
            }, 3000);
        }
    }

    undoMove() {
        if (this.gameHistory.length === 0) {
            this.addChatMessage('system', '되돌릴 수 있는 수가 없습니다.');
            return;
        }

        const lastState = this.gameHistory.pop();
        this.board = lastState.board;
        this.currentPlayer = lastState.currentPlayer;
        
        this.updateValidMoves();
        this.updateDisplay();
        this.addChatMessage('system', '한 수 되돌렸습니다.');
    }

    endGame() {
        const blackCount = parseInt(document.getElementById('black-score').textContent);
        const whiteCount = parseInt(document.getElementById('white-score').textContent);
        
        let winnerText = '';
        if (blackCount > whiteCount) {
            winnerText = `게임 종료! 흑이 ${blackCount}:${whiteCount}로 승리했습니다!`;
        } else if (whiteCount > blackCount) {
            winnerText = `게임 종료! 백이 ${whiteCount}:${blackCount}로 승리했습니다!`;
        } else {
            winnerText = `게임 종료! ${blackCount}:${whiteCount}로 무승부입니다!`;
        }
        
        // 전적 저장
        this.saveGameResult(blackCount, whiteCount);
        
        this.addChatMessage('system', winnerText);
        this.showGameOverModal(winnerText);
    }

    showGameOverModal(winnerText) {
        document.getElementById('winner-text').textContent = winnerText;
        document.getElementById('game-over-modal').style.display = 'block';
    }

    hideGameOverModal() {
        document.getElementById('game-over-modal').style.display = 'none';
    }

    newGame() {
        this.board = [];
        this.currentPlayer = 'black';
        this.gameHistory = [];
        this.validMoves = [];
        
        this.initializeBoard();
        this.updateValidMoves();
        this.updateDisplay();
        
        // 채팅 메시지 초기화
        document.getElementById('chat-messages').innerHTML = '';
        this.addChatMessage('system', '새로운 게임을 시작합니다! 흑돌부터 시작합니다.');
    }

    addChatMessage(type, message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message === '') return;
        
        this.addChatMessage('user', message);
        input.value = '';
        
        // AI 응답 생성
        setTimeout(() => {
            this.generateAIResponse(message);
        }, 500);
    }

    generateAIResponse(userMessage) {
        const responses = [
            '좋은 수를 두고 계시네요!',
            '흥미로운 전략입니다.',
            '조심하세요, 그 위치는 위험할 수 있어요.',
            '오셀로는 끝까지 집중해야 하는 게임이에요.',
            '모서리와 변을 차지하는 것이 중요합니다.',
            '현재 상황을 잘 파악하고 계시네요!',
            '인내심을 가지고 플레이하세요.',
            '좋은 게임이 되고 있습니다!',
            '전략적으로 생각해보세요.',
            '기회를 놓치지 마세요!'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.addChatMessage('ai', randomResponse);
    }
}

// PWA 서비스 워커 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    new OthelloGame();
}); 