class OthelloGame {
    constructor() {
        this.currentPlayer = 1; // 1: 흑, 2: 백
        this.gameMode = 'ai'; // 기본값을 'ai'로 변경
        this.difficulty = 'medium'; // 'easy', 'medium', 'hard'
        this.moveHistory = [];
        this.audioContext = null;
        this.audioInitialized = false; // 오디오 초기화 플래그
        this.isFullscreen = false; // 전체 화면 모드 상태
        
        this.initializeGame();
        this.setupEventListeners();
        this.updateDisplay();
    }

    initializeBoard() {
        this.board = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = 0;
            }
        }
        
        // 초기 돌 배치
        const center = this.boardSize / 2;
        this.board[center - 1][center - 1] = 2; // 백
        this.board[center - 1][center] = 1;     // 흑
        this.board[center][center - 1] = 1;     // 흑
        this.board[center][center] = 2;         // 백
    }

    setupEventListeners() {
        // 보드 클릭 이벤트
        document.getElementById('board').addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.makeMove(row, col);
            }
        });

        // 게임 모드 선택
        document.getElementById('pvp-mode').addEventListener('click', () => {
            this.setGameMode('pvp');
        });

        document.getElementById('ai-mode').addEventListener('click', () => {
            this.setGameMode('ai');
        });

        // 난이도 선택
        document.getElementById('easy-difficulty').addEventListener('click', () => {
            this.setDifficulty('easy');
        });

        document.getElementById('medium-difficulty').addEventListener('click', () => {
            this.setDifficulty('medium');
        });

        document.getElementById('hard-difficulty').addEventListener('click', () => {
            this.setDifficulty('hard');
        });

        // 게임 컨트롤
        document.getElementById('new-game').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('undo').addEventListener('click', () => {
            this.undoMove();
        });

        // 사용자 관리
        document.getElementById('login-btn').addEventListener('click', () => {
            this.showLoginModal();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // 모달 닫기
        document.getElementById('close-login').addEventListener('click', () => {
            this.hideLoginModal();
        });

        document.getElementById('close-stats').addEventListener('click', () => {
            this.hideStatsModal();
        });

        // 로그인/회원가입
        document.getElementById('register-btn').addEventListener('click', () => {
            this.register();
        });

        document.getElementById('login-submit-btn').addEventListener('click', () => {
            this.login();
        });

        // 전적 보기
        document.getElementById('stats').addEventListener('click', () => {
            this.showStats();
        });

        document.getElementById('play-again').addEventListener('click', () => {
            this.newGame();
            this.hideGameOverModal();
        });

        // 전체 화면 모드 토글
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // 전체 화면 모드에서 ESC 키로 나가기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.exitFullscreenMode();
            }
        });

        // 오디오 초기화를 위한 첫 번째 상호작용 감지
        this.setupAudioInitialization();
    }

    // 오디오 초기화 설정
    setupAudioInitialization() {
        const initAudio = () => {
            if (!this.audioInitialized) {
                this.audioInitialized = true;
                this.initAudio();
                console.log('오디오 초기화됨 (첫 번째 상호작용)');
                
                // 초기화 후 테스트 사운드 재생
                setTimeout(() => {
                    this.playSound('place');
                }, 100);
            }
        };

        // 다양한 상호작용 이벤트에서 오디오 초기화
        const events = ['click', 'touchstart', 'keydown', 'mousedown'];
        events.forEach(event => {
            document.addEventListener(event, initAudio, { once: true });
        });
        
        // 모바일에서 더 확실하게 작동하도록 추가 이벤트
        if ('ontouchstart' in window) {
            // 터치 디바이스인 경우
            document.addEventListener('touchstart', initAudio, { once: true });
            document.addEventListener('touchend', initAudio, { once: true });
        }
    }

    // 게임 모드 설정
    setGameMode(mode) {
        this.gameMode = mode;
        
        // 버튼 상태 업데이트
        document.getElementById('pvp-mode').classList.remove('active');
        document.getElementById('ai-mode').classList.remove('active');
        document.getElementById(mode + '-mode').classList.add('active');
        
        // 난이도 선택기 표시/숨김
        const difficultySelector = document.getElementById('difficulty-selector');
        if (mode === 'ai') {
            difficultySelector.style.display = 'block';
        } else {
            difficultySelector.style.display = 'none';
        }
        
        this.addStatusMessage('system', `게임 모드가 ${mode === 'pvp' ? '2인 플레이' : 'AI 대전'}로 변경되었습니다.`);
        
        // 새 게임 시작
        this.newGame();
    }

    // 난이도 설정
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        
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
        switch(this.difficulty) {
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

        // 첫 번째 수에서 오디오 초기화
        if (this.moveHistory.length === 0) {
            this.initAudio();
        }

        // 게임 히스토리 저장
        this.moveHistory.push({
            board: JSON.parse(JSON.stringify(this.board)),
            currentPlayer: this.currentPlayer
        });

        // 돌 배치
        this.board[row][col] = this.currentPlayer;

        // 돌 뒤집기
        let flippedCount = 0;
        for (const [dr, dc] of this.directions) {
            const flips = this.wouldFlip(row, col, dr, dc, this.currentPlayer);
            for (const [fr, fc] of flips) {
                this.board[fr][fc] = this.currentPlayer;
                flippedCount++;
            }
        }

        // 뒤집힌 돌이 있으면 효과음 재생
        if (flippedCount > 0) {
            this.playSound('flip');
        }

        // 플레이어 변경
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

        // 유효한 수가 없으면 패스
        if (!this.hasValidMoves()) {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            if (!this.hasValidMoves()) {
                this.endGame();
                return true;
            }
            this.addStatusMessage('system', `${this.currentPlayer === 1 ? '흑' : '백'}이 패스합니다.`);
        }

        this.updateDisplay();
        this.addStatusMessage('system', `${this.currentPlayer === 1 ? '흑' : '백'}의 차례입니다.`);

        // AI 모드에서 AI 차례인 경우
        if (this.gameMode === 'ai' && this.currentPlayer === 2 && !this.aiThinking) {
            await this.makeAIMove();
        }

        // 효과음 재생
        this.playSound('place');

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

        // 효과음 재생
        this.playSound('ai');
    }

    executeAIMove(row, col) {
        // 게임 히스토리 저장
        this.moveHistory.push({
            board: JSON.parse(JSON.stringify(this.board)),
            currentPlayer: this.currentPlayer
        });

        // 돌 배치
        this.board[row][col] = this.currentPlayer;

        // 돌 뒤집기
        let flippedCount = 0;
        for (const [dr, dc] of this.directions) {
            const flips = this.wouldFlip(row, col, dr, dc, this.currentPlayer);
            for (const [fr, fc] of flips) {
                this.board[fr][fc] = this.currentPlayer;
                flippedCount++;
            }
        }

        // 뒤집힌 돌이 있으면 효과음 재생
        if (flippedCount > 0) {
            this.playSound('flip');
        }

        // 플레이어 변경
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

        // 유효한 수가 없으면 패스
        if (!this.hasValidMoves()) {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            if (!this.hasValidMoves()) {
                this.endGame();
                this.aiThinking = false;
                this.hideAIThinking();
                return;
            }
            this.addStatusMessage('system', `${this.currentPlayer === 1 ? '흑' : '백'}이 패스합니다.`);
        }

        this.updateDisplay();
        this.addStatusMessage('system', `${this.currentPlayer === 1 ? '흑' : '백'}의 차례입니다.`);

        this.aiThinking = false;
        this.hideAIThinking();

        // 효과음 재생
        this.playSound('place');
    }

    calculateAIMove() {
        const validMoves = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col, 2)) {
                    validMoves.push([row, col]);
                }
            }
        }
        
        if (validMoves.length === 0) return null;
        
        // 난이도별 AI 전략
        switch(this.difficulty) {
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
            const flips = this.countFlips(move[0], move[1], 2);
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
            tempBoard[row][col] = 2;
            
            // 돌 뒤집기
            let flippedCount = 0;
            for (const [dr, dc] of this.directions) {
                const flips = this.wouldFlip(row, col, dr, dc, 2);
                for (const [fr, fc] of flips) {
                    tempBoard[fr][fc] = 2;
                    flippedCount++;
                }
            }
            
            // 보드 평가
            const score = this.evaluateBoard(tempBoard, 2);
            
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
        const opponent = player === 1 ? 2 : 1;
        
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
        this.aiThinking = true;
        
        // 기존 상태 메시지에 AI 생각 중 표시
        this.addStatusMessage('ai', 'AI가 생각 중입니다...');
        
        // 보드에 AI 생각 중 애니메이션 추가
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.add('ai-thinking');
        });
        
        // 전체 화면 모드에서 AI 생각 중 오버레이 표시
        if (this.isFullscreen) {
            const aiThinkingOverlay = document.getElementById('fullscreen-ai-thinking');
            if (aiThinkingOverlay) {
                aiThinkingOverlay.style.display = 'block';
            }
        }
    }

    hideAIThinking() {
        this.aiThinking = false;
        
        // AI 생각 중 애니메이션 제거
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('ai-thinking');
        });
        
        // 전체 화면 모드에서 AI 생각 중 오버레이 숨김
        if (this.isFullscreen) {
            const aiThinkingOverlay = document.getElementById('fullscreen-ai-thinking');
            if (aiThinkingOverlay) {
                aiThinkingOverlay.style.display = 'none';
            }
        }
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
        if (this.board[row][col] !== 0) return false;

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
        const opponent = player === 1 ? 2 : 1;

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
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.isValidMove(i, j, this.currentPlayer)) {
                    return true;
                }
            }
        }
        return false;
    }

    updateValidMoves() {
        this.validMoves = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.isValidMove(i, j, this.currentPlayer)) {
                    this.validMoves.push([i, j]);
                }
            }
        }
    }

    updateDisplay() {
        const board = document.getElementById('board');
        board.innerHTML = '';
        
        // 유효한 수 업데이트 (표시는 하지 않지만 게임 로직을 위해 필요)
        this.updateValidMoves();
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                if (this.board[i][j] === 1) {
                    cell.classList.add('black');
                } else if (this.board[i][j] === 2) {
                    cell.classList.add('white');
                }
                
                board.appendChild(cell);
            }
        }
        
        this.updateScore();
        
        // 전체 화면 모드에서도 점수 업데이트
        if (this.isFullscreen) {
            const blackScoreElement = document.getElementById('fullscreen-black-score');
            const whiteScoreElement = document.getElementById('fullscreen-white-score');
            const currentPlayerElement = document.getElementById('fullscreen-current-player');
            
            if (blackScoreElement) blackScoreElement.textContent = this.getScore(1);
            if (whiteScoreElement) whiteScoreElement.textContent = this.getScore(2);
            if (currentPlayerElement) currentPlayerElement.textContent = this.currentPlayer === 1 ? '흑' : '백';
        }
    }

    updateScore() {
        let blackCount = 0;
        let whiteCount = 0;
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === 1) {
                    blackCount++;
                } else if (this.board[i][j] === 2) {
                    whiteCount++;
                }
            }
        }
        
        document.getElementById('black-score').textContent = blackCount;
        document.getElementById('white-score').textContent = whiteCount;
        
        // 현재 플레이어 표시
        const currentPlayerText = this.currentPlayer === 1 ? '흑' : '백';
        const modeText = this.gameMode === 'ai' && this.currentPlayer === 2 ? ' (AI)' : '';
        document.getElementById('current-player').textContent = currentPlayerText + modeText;
    }

    undoMove() {
        if (this.moveHistory.length === 0) {
            this.addStatusMessage('system', '되돌릴 수 있는 수가 없습니다.');
            return;
        }

        const lastState = this.moveHistory.pop();
        this.board = lastState.board;
        this.currentPlayer = lastState.currentPlayer;
        
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
        
        // 승리 효과음 재생
        this.playSound('win');
        
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
        this.currentPlayer = 1;
        this.moveHistory = [];
        
        this.initializeBoard();
        this.updateDisplay();
        
        // 채팅 메시지 초기화
        const statusMessages = document.getElementById('status-messages');
        if (statusMessages) {
            statusMessages.innerHTML = '';
        }
        
        this.addStatusMessage('system', '새 게임이 시작되었습니다!');
        
        if (this.gameMode === 'ai') {
            this.addStatusMessage('system', 'AI 대전 모드로 새 게임을 시작합니다! 난이도: ' + this.getDifficultyText());
        } else {
            this.addStatusMessage('system', '새로운 게임을 시작합니다! 흑돌부터 시작합니다.');
        }
    }

    addStatusMessage(type, message) {
        const statusContainer = document.getElementById('status-messages');
        const statusMessage = document.createElement('div');
        statusMessage.className = `status-message ${type}`;
        statusMessage.textContent = message;
        
        statusContainer.appendChild(statusMessage);
        statusContainer.scrollTop = statusContainer.scrollHeight;
        
        // 전체 화면 모드에서도 상태 메시지 표시
        if (this.isFullscreen) {
            const fullscreenStatus = document.getElementById('fullscreen-status');
            if (fullscreenStatus) {
                const fullscreenMessage = document.createElement('div');
                fullscreenMessage.className = `status-message ${type}`;
                fullscreenMessage.textContent = message;
                fullscreenStatus.appendChild(fullscreenMessage);
                
                // 3초 후 자동으로 사라지게 하기
                setTimeout(() => {
                    if (fullscreenMessage.parentNode) {
                        fullscreenMessage.remove();
                    }
                }, 3000);
            }
        }
        
        // 5초 후 자동으로 사라지게 하기
        setTimeout(() => {
            if (statusMessage.parentNode) {
                statusMessage.remove();
            }
        }, 5000);
    }

    // 효과음 재생 함수
    playSound(soundType) {
        try {
            // 모바일에서 더 간단하고 확실한 방법
            if (!this.audioInitialized) {
                console.log('오디오가 아직 초기화되지 않음');
                return;
            }
            
            // 가장 간단하고 안정적인 방법: Web Audio API 직접 사용
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 오디오 컨텍스트가 일시정지 상태라면 재개
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 효과음 타입별 설정
            let frequency = 400;
            let duration = 0.1;
            
            switch(soundType) {
                case 'place':
                    frequency = 500;
                    duration = 0.08;
                    break;
                case 'flip':
                    frequency = 300;
                    duration = 0.12;
                    break;
                case 'win':
                    frequency = 800;
                    duration = 0.3;
                    break;
                case 'ai':
                    frequency = 200;
                    duration = 0.15;
                    break;
            }
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
            
        } catch (e) {
            console.log('효과음 재생 오류:', e);
            // 대체 방법: 더 간단한 비프음
            this.playSimpleBeep();
        }
    }
    
    // 대체 효과음 (매우 간단한 비프음)
    playSimpleBeep() {
        try {
            // 가장 간단한 방법: 빈 오디오 컨텍스트로 비프음 생성
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 400;
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            
        } catch (e) {
            console.log('대체 효과음도 실패:', e);
        }
    }

    // 오디오 초기화
    initAudio() {
        try {
            // 이미 초기화되어 있으면 리턴
            if (this.audioContext) {
                return;
            }
            
            // 모바일에서 더 안정적인 방법으로 오디오 컨텍스트 생성
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // 오디오 컨텍스트가 일시정지 상태라면 재개
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            console.log('오디오 컨텍스트 초기화됨');
            
            // 테스트 사운드 재생 (매우 짧고 조용하게)
            this.playTestSound();
            
        } catch (e) {
            console.log('오디오 초기화 실패:', e);
            this.audioContext = null;
        }
    }
    
    // 테스트 사운드 (매우 짧고 조용하게)
    playTestSound() {
        try {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.01, this.audioContext.currentTime); // 매우 조용하게
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
            
        } catch (e) {
            console.log('테스트 사운드 실패:', e);
        }
    }

    // 화면 방향 변화 감지 설정
    setupOrientationListener() {
        // 화면 방향 변화 이벤트
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // 화면 크기 변화 이벤트
        window.addEventListener('resize', () => {
            this.handleOrientationChange();
        });
        
        // 초기 방향 설정
        this.handleOrientationChange();
    }
    
    // 화면 방향 변화 처리
    handleOrientationChange() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const container = document.querySelector('.container');
        
        if (isLandscape) {
            container.classList.add('landscape-mode');
            console.log('가로 모드로 변경됨');
        } else {
            container.classList.remove('landscape-mode');
            console.log('세로 모드로 변경됨');
        }
    }

    // 게임 초기화
    initializeGame() {
        // 사용자 관리
        this.currentUser = localStorage.getItem('othello_current_user') || null;
        this.users = JSON.parse(localStorage.getItem('othello_users')) || {};
        this.gameStats = JSON.parse(localStorage.getItem('othello_stats')) || {};
        
        // AI 관련 변수
        this.aiThinking = false;
        
        // 보드 초기화
        this.boardSize = 8;
        this.directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        this.initializeBoard();
        this.updateDisplay();
        
        // AI 모드가 기본이므로 난이도 선택기 표시
        const difficultySelector = document.getElementById('difficulty-selector');
        difficultySelector.style.display = 'block';
        
        this.addStatusMessage('system', '준우와 함께하는 오셀로 게임을 시작합니다! AI 대전 모드로 시작합니다.');
        
        // 화면 방향 변화 감지
        this.setupOrientationListener();
    }

    // 전체 화면 모드 토글
    toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    // 전체 화면 모드 진입
    enterFullscreen() {
        if (this.isFullscreen) return;
        
        this.isFullscreen = true;
        document.body.classList.add('fullscreen-mode');
        
        // 전체 화면 모드 UI 생성
        this.createFullscreenUI();
        
        // 전체 화면 아이콘 변경
        const fullscreenIcon = document.querySelector('.fullscreen-icon');
        if (fullscreenIcon) {
            fullscreenIcon.textContent = '⛶';
        }
        
        this.addStatusMessage('system', '전체 화면 모드로 전환되었습니다. ESC 키로 나갈 수 있습니다.');
        
        // 화면 방향 고정 (모바일에서)
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {
                // 방향 고정이 실패해도 계속 진행
            });
        }
    }

    // 전체 화면 모드에서 ESC 키로 나가기
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        this.exitFullscreenMode();
    }

    // 전체 화면 모드 종료 (내부 메서드)
    exitFullscreenMode() {
        if (!this.isFullscreen) return;
        
        this.isFullscreen = false;
        document.body.classList.remove('fullscreen-mode');
        
        // 전체 화면 모드 UI 제거
        this.removeFullscreenUI();
        
        // 전체 화면 아이콘 변경
        const fullscreenIcon = document.querySelector('.fullscreen-icon');
        if (fullscreenIcon) {
            fullscreenIcon.textContent = '⛶';
        }
        
        this.addStatusMessage('system', '전체 화면 모드가 종료되었습니다.');
        
        // 화면 방향 고정 해제
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }

    // 전체 화면 모드 UI 생성
    createFullscreenUI() {
        // 게임 정보 오버레이
        const gameInfoOverlay = document.createElement('div');
        gameInfoOverlay.className = 'game-info-overlay';
        gameInfoOverlay.innerHTML = `
            <div class="score">
                <span class="player">흑: <span id="fullscreen-black-score">${this.getScore(1)}</span></span>
                <span class="player">백: <span id="fullscreen-white-score">${this.getScore(2)}</span></span>
            </div>
            <div class="current-player">
                현재 차례: <span id="fullscreen-current-player">${this.currentPlayer === 1 ? '흑' : '백'}</span>
            </div>
        `;
        document.body.appendChild(gameInfoOverlay);
        
        // 컨트롤 버튼들
        const fullscreenControls = document.createElement('div');
        fullscreenControls.className = 'fullscreen-controls';
        fullscreenControls.innerHTML = `
            <button id="fullscreen-new-game" class="btn">새 게임</button>
            <button id="fullscreen-undo" class="btn">되돌리기</button>
        `;
        document.body.appendChild(fullscreenControls);
        
        // 상태 메시지 영역
        const fullscreenStatus = document.createElement('div');
        fullscreenStatus.className = 'fullscreen-status';
        fullscreenStatus.id = 'fullscreen-status';
        document.body.appendChild(fullscreenStatus);
        
        // AI 생각 중 오버레이
        const aiThinkingOverlay = document.createElement('div');
        aiThinkingOverlay.className = 'ai-thinking-overlay';
        aiThinkingOverlay.id = 'fullscreen-ai-thinking';
        aiThinkingOverlay.style.display = 'none';
        aiThinkingOverlay.textContent = 'AI가 생각 중입니다...';
        document.body.appendChild(aiThinkingOverlay);
        
        // 전체 화면 모드 이벤트 리스너 설정
        this.setupFullscreenEventListeners();
    }

    // 전체 화면 모드 UI 제거
    removeFullscreenUI() {
        const elementsToRemove = [
            '.game-info-overlay',
            '.fullscreen-controls',
            '.fullscreen-status',
            '.ai-thinking-overlay'
        ];
        
        elementsToRemove.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.remove();
            }
        });
    }

    // 전체 화면 모드 이벤트 리스너 설정
    setupFullscreenEventListeners() {
        // 새 게임 버튼
        const newGameBtn = document.getElementById('fullscreen-new-game');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.newGame();
            });
        }
        
        // 되돌리기 버튼
        const undoBtn = document.getElementById('fullscreen-undo');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undoMove();
            });
        }
    }

    // 점수 가져오기
    getScore(player) {
        let count = 0;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === player) {
                    count++;
                }
            }
        }
        return count;
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