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
        
        this.initializeBoard();
        this.setupEventListeners();
        this.updateValidMoves();
        this.updateDisplay();
        this.addChatMessage('system', '오셀로 게임을 시작합니다! 흑돌부터 시작합니다.');
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