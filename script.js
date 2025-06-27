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
        
        // AI 게임 모드
        this.gameMode = 'pvp'; // 'pvp' or 'ai'
        this.aiPlayer = 'white'; // AI는 백돌을 사용
        this.aiThinking = false;
        this.aiDifficulty = 'easy'; // 'easy', 'medium', 'hard'
        
        this.initializeBoard();
        this.setupEventListeners();
        this.updateValidMoves();
        this.updateDisplay();
        this.updateUserDisplay();
        this.addStatusMessage('system', '준우와 함께하는 오셀로 게임을 시작합니다! 흑돌부터 시작합니다.');
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

        document.getElementById('play-again').addEventListener('click', () => {
            this.newGame();
            this.hideGameOverModal();
        });

        // 게임 모드 선택 이벤트
        document.getElementById('pvp-mode').addEventListener('click', () => {
            this.setGameMode('pvp');
        });

        document.getElementById('ai-mode').addEventListener('click', () => {
            this.setGameMode('ai');
        });

        // 난이도 선택 이벤트
        document.getElementById('easy-difficulty').addEventListener('click', () => {
            this.setDifficulty('easy');
        });

        document.getElementById('medium-difficulty').addEventListener('click', () => {
            this.setDifficulty('medium');
        });

        document.getElementById('hard-difficulty').addEventListener('click', () => {
            this.setDifficulty('hard');
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

    // 게임 모드 설정
    setGameMode(mode) {
        this.gameMode = mode;
        
        // 버튼 상태 업데이트
        document.getElementById('pvp-mode').classList.toggle('active', mode === 'pvp');
        document.getElementById('ai-mode').classList.toggle('active', mode === 'ai');
        
        // 난이도 선택기 표시/숨김
        const difficultySelector = document.getElementById('difficulty-selector');
        difficultySelector.style.display = mode === 'ai' ? 'flex' : 'none';
        
        // 새 게임 시작
        this.newGame();
        
        if (mode === 'ai') {
            this.addStatusMessage('system', `AI 대전 모드로 시작합니다! 난이도: ${this.getDifficultyText()}`);
        } else {
            this.addStatusMessage('system', '2인 플레이 모드로 시작합니다!');
        }
    }

    // 난이도 설정
    setDifficulty(difficulty) {
        this.aiDifficulty = difficulty;
        
        // 버튼 상태 업데이트
        document.getElementById('easy-difficulty').classList.toggle('active', difficulty === 'easy');
        document.getElementById('medium-difficulty').classList.toggle('active', difficulty === 'medium');
        document.getElementById('hard-difficulty').classList.toggle('active', difficulty === 'hard');
        
        if (this.gameMode === 'ai') {
            this.addStatusMessage('system', `AI 난이도가 ${this.getDifficultyText()}로 변경되었습니다.`);
        }
    }

    // 난이도 텍스트 반환
    getDifficultyText() {
        switch(this.aiDifficulty) {
            case 'easy': return '하';
            case 'medium': return '중';
            case 'hard': return '상';
            default: return '하';
        }
    }

    // AI 관련 함수들
    async makeMove(row, col) {
        if (this.aiThinking) return false;
        
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
            this.addStatusMessage('system', `${this.currentPlayer === 'black' ? '흑' : '백'}이 패스합니다.`);
        }

        this.updateValidMoves();
        this.updateDisplay();
        this.addStatusMessage('system', `${this.currentPlayer === 'black' ? '흑' : '백'}의 차례입니다.`);

        // AI 모드에서 AI 차례인 경우
        if (this.gameMode === 'ai' && this.currentPlayer === this.aiPlayer && !this.aiThinking) {
            await this.makeAIMove();
        }

        return true;
    }

    async makeAIMove() {
        if (this.aiThinking) return;
        
        this.aiThinking = true;
        this.addStatusMessage('ai', '🤖 AI가 생각하고 있습니다...');
        
        // AI 생각하는 애니메이션
        this.showAIThinking();
        
        // AI가 생각하는 시간 (1-2초)
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        // AI 수 계산
        const aiMove = this.calculateAIMove();
        
        if (aiMove) {
            const [row, col] = aiMove;
            this.addStatusMessage('ai', `🤖 AI가 ${String.fromCharCode(65 + col)}${row + 1}에 돌을 놓았습니다!`);
            
            // AI 수 실행 (재귀 호출 방지를 위해 직접 처리)
            this.executeAIMove(row, col);
        } else {
            this.addStatusMessage('ai', '🤖 AI가 놓을 수 있는 수가 없어서 패스합니다.');
            this.aiThinking = false;
            this.hideAIThinking();
        }
    }

    executeAIMove(row, col) {
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
                this.aiThinking = false;
                this.hideAIThinking();
                return;
            }
            this.addStatusMessage('system', `${this.currentPlayer === 'black' ? '흑' : '백'}이 패스합니다.`);
        }

        this.updateValidMoves();
        this.updateDisplay();
        this.addStatusMessage('system', `${this.currentPlayer === 'black' ? '흑' : '백'}의 차례입니다.`);

        this.aiThinking = false;
        this.hideAIThinking();
    }

    calculateAIMove() {
        const validMoves = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col, this.aiPlayer)) {
                    validMoves.push([row, col]);
                }
            }
        }
        
        if (validMoves.length === 0) return null;
        
        // 난이도별 AI 전략
        switch(this.aiDifficulty) {
            case 'easy':
                return this.calculateEasyMove(validMoves);
            case 'medium':
                return this.calculateMediumMove(validMoves);
            case 'hard':
                return this.calculateHardMove(validMoves);
            default:
                return this.calculateEasyMove(validMoves);
        }
    }

    // 하 난이도: 랜덤 선택 (가끔 실수)
    calculateEasyMove(validMoves) {
        // 30% 확률로 랜덤 선택
        if (Math.random() < 0.3) {
            return validMoves[Math.floor(Math.random() * validMoves.length)];
        }
        
        // 나머지는 기본 전략 사용
        return this.calculateMediumMove(validMoves);
    }

    // 중 난이도: 기본 전략 (모서리 > 변 > 최대 뒤집기)
    calculateMediumMove(validMoves) {
        // AI 전략: 모서리 > 변 > 중앙 순으로 우선순위
        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        const edges = [];
        
        // 변 위치 찾기
        for (let i = 0; i < this.boardSize; i++) {
            if (this.board[0][i] === null) edges.push([0, i]);
            if (this.board[7][i] === null) edges.push([7, i]);
            if (this.board[i][0] === null) edges.push([i, 0]);
            if (this.board[i][7] === null) edges.push([i, 7]);
        }
        
        // 모서리 우선
        for (const corner of corners) {
            if (validMoves.some(move => move[0] === corner[0] && move[1] === corner[1])) {
                return corner;
            }
        }
        
        // 변 우선
        for (const edge of edges) {
            if (validMoves.some(move => move[0] === edge[0] && move[1] === edge[1])) {
                return edge;
            }
        }
        
        // 최대 뒤집기 선택
        let bestMove = validMoves[0];
        let maxFlips = 0;
        
        for (const move of validMoves) {
            const flips = this.countFlips(move[0], move[1], this.aiPlayer);
            if (flips > maxFlips) {
                maxFlips = flips;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    // 상 난이도: 고급 전략 (미니맥스 알고리즘 기반)
    calculateHardMove(validMoves) {
        // 고급 전략: 미니맥스 알고리즘 + 알파베타 가지치기 (간소화)
        let bestMove = validMoves[0];
        let bestScore = -Infinity;
        
        for (const move of validMoves) {
            // 임시로 수를 두고 평가
            const tempBoard = JSON.parse(JSON.stringify(this.board));
            const [row, col] = move;
            
            // 돌 배치
            tempBoard[row][col] = this.aiPlayer;
            
            // 돌 뒤집기
            for (const [dr, dc] of this.directions) {
                const flips = this.wouldFlip(row, col, dr, dc, this.aiPlayer);
                for (const [fr, fc] of flips) {
                    tempBoard[fr][fc] = this.aiPlayer;
                }
            }
            
            // 보드 평가
            const score = this.evaluateBoard(tempBoard, this.aiPlayer);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    // 보드 평가 함수 (고급 난이도용)
    evaluateBoard(board, player) {
        let score = 0;
        const opponent = player === 'black' ? 'white' : 'black';
        
        // 모서리 가중치 (가장 중요)
        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        for (const [row, col] of corners) {
            if (board[row][col] === player) {
                score += 25;
            } else if (board[row][col] === opponent) {
                score -= 25;
            }
        }
        
        // 변 가중치
        for (let i = 0; i < this.boardSize; i++) {
            if (board[0][i] === player) score += 5;
            if (board[7][i] === player) score += 5;
            if (board[i][0] === player) score += 5;
            if (board[i][7] === player) score += 5;
            
            if (board[0][i] === opponent) score -= 5;
            if (board[7][i] === opponent) score -= 5;
            if (board[i][0] === opponent) score -= 5;
            if (board[i][7] === opponent) score -= 5;
        }
        
        // 중앙 가중치
        for (let row = 2; row < 6; row++) {
            for (let col = 2; col < 6; col++) {
                if (board[row][col] === player) {
                    score += 1;
                } else if (board[row][col] === opponent) {
                    score -= 1;
                }
            }
        }
        
        // 전체 돌 개수 차이
        let playerCount = 0;
        let opponentCount = 0;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (board[row][col] === player) playerCount++;
                else if (board[row][col] === opponent) opponentCount++;
            }
        }
        
        score += (playerCount - opponentCount) * 2;
        
        return score;
    }

    countFlips(row, col, player) {
        let totalFlips = 0;
        for (const [dr, dc] of this.directions) {
            totalFlips += this.wouldFlip(row, col, dr, dc, player).length;
        }
        return totalFlips;
    }

    showAIThinking() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            if (cell.textContent === '') {
                cell.classList.add('ai-thinking');
            }
        });
    }

    hideAIThinking() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('ai-thinking');
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
            this.addStatusMessage('system', '사용자명과 비밀번호를 입력해주세요.');
            return;
        }

        if (username.length < 3) {
            this.addStatusMessage('system', '사용자명은 3자 이상이어야 합니다.');
            return;
        }

        if (this.users[username]) {
            this.addStatusMessage('system', '이미 존재하는 사용자명입니다.');
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
        this.addStatusMessage('system', `${username}님, 환영합니다! 회원가입이 완료되었습니다.`);
    }

    login() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            this.addStatusMessage('system', '사용자명과 비밀번호를 입력해주세요.');
            return;
        }

        if (!this.users[username]) {
            this.addStatusMessage('system', '존재하지 않는 사용자명입니다.');
            return;
        }

        if (this.users[username].password !== password) {
            this.addStatusMessage('system', '비밀번호가 일치하지 않습니다.');
            return;
        }

        this.currentUser = username;
        this.updateUserDisplay();
        this.hideLoginModal();
        this.addStatusMessage('system', `${username}님, 환영합니다!`);
    }

    logout() {
        this.currentUser = null;
        this.updateUserDisplay();
        this.addStatusMessage('system', '로그아웃되었습니다.');
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
            this.addStatusMessage('system', '전적을 보려면 로그인해주세요.');
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

                // 유효한 수 표시 (AI 모드에서는 AI 차례가 아닐 때만)
                if (this.gameMode === 'ai' && this.currentPlayer === this.aiPlayer) {
                    // AI 차례일 때는 유효한 수를 표시하지 않음
                } else if (this.isValidMove(row, col, this.currentPlayer)) {
                    cell.classList.add('valid-move');
                }

                boardElement.appendChild(cell);
            }
        }

        // 점수 업데이트
        this.updateScore();
        
        // 현재 플레이어 표시
        const currentPlayerText = this.currentPlayer === 'black' ? '흑' : '백';
        const modeText = this.gameMode === 'ai' && this.currentPlayer === this.aiPlayer ? ' (AI)' : '';
        document.getElementById('current-player').textContent = currentPlayerText + modeText;
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
            this.addStatusMessage('system', '놓을 수 있는 수가 없습니다.');
            return;
        }

        const hint = this.validMoves[Math.floor(Math.random() * this.validMoves.length)];
        const row = hint[0] + 1;
        const col = String.fromCharCode(65 + hint[1]); // A, B, C, ...
        
        this.addStatusMessage('ai', `힌트: ${col}${row} 위치에 놓아보세요!`);
        
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
            this.addStatusMessage('system', '되돌릴 수 있는 수가 없습니다.');
            return;
        }

        const lastState = this.gameHistory.pop();
        this.board = lastState.board;
        this.currentPlayer = lastState.currentPlayer;
        
        this.updateValidMoves();
        this.updateDisplay();
        this.addStatusMessage('system', '한 수 되돌렸습니다.');
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
        
        this.addStatusMessage('system', winnerText);
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
        this.aiThinking = false;
        
        this.initializeBoard();
        this.updateValidMoves();
        this.updateDisplay();
        
        // 채팅 메시지 초기화
        document.getElementById('chat-messages').innerHTML = '';
        
        if (this.gameMode === 'ai') {
            this.addStatusMessage('system', 'AI 대전 모드로 새 게임을 시작합니다! 난이도: ' + this.getDifficultyText());
        } else {
            this.addStatusMessage('system', '새로운 게임을 시작합니다! 흑돌부터 시작합니다.');
        }
    }

    addStatusMessage(type, message) {
        const statusMessages = document.getElementById('status-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `status-message ${type}`;
        messageElement.textContent = message;
        
        statusMessages.appendChild(messageElement);
        statusMessages.scrollTop = statusMessages.scrollHeight;
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
let game = null;

document.addEventListener('DOMContentLoaded', () => {
    // DOM이 완전히 로드된 후 게임 초기화
    setTimeout(() => {
        try {
            game = new OthelloGame();
            console.log('게임이 성공적으로 초기화되었습니다.');
        } catch (error) {
            console.error('게임 초기화 중 오류 발생:', error);
            // 오류 발생 시 다시 시도
            setTimeout(() => {
                game = new OthelloGame();
            }, 1000);
        }
    }, 100);
});

// 페이지 로드 완료 후에도 한 번 더 확인
window.addEventListener('load', () => {
    if (!game) {
        setTimeout(() => {
            try {
                game = new OthelloGame();
                console.log('게임이 성공적으로 초기화되었습니다.');
            } catch (error) {
                console.error('게임 초기화 중 오류 발생:', error);
            }
        }, 100);
    }
}); 