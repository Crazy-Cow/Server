let canvas
const canvasSize = 400
const gridSize = 20
let gameState
let socket

document.addEventListener('DOMContentLoaded', () => {
    socket = io() // 서버 주소 명시적으로 설정
    document.getElementById('startGame').addEventListener('click', () => {
        const roomCode = document
            .getElementById('roomCodeDisplay')
            .innerText.replace('Room Code: ', '')
            .trim()
        if (roomCode) {
            console.log(`Starting game for room: ${roomCode}`) // 디버깅 로그
            socket.emit('startGame', roomCode)
        } else {
            console.error('Room code is missing.')
        }
    })
    // Create Room 버튼 클릭 시
    document.getElementById('createRoom').addEventListener('click', () => {
        console.log('Create Room button clicked') // 디버깅 로그
        socket.emit('createRoom') // 서버로 createRoom 이벤트 전송
    })

    // Join Room 버튼 클릭 시
    document.getElementById('joinRoom').addEventListener('click', () => {
        const roomCode = document.getElementById('roomCodeInput').value
        if (roomCode) {
            console.log(`Join Room button clicked. Room code: ${roomCode}`) // 디버깅 로그
            socket.emit('joinRoom', roomCode) // 서버로 joinRoom 이벤트 전송
        }
    })

    // 서버로부터 방 생성 완료 이벤트 수신
    socket.on('roomCreated', (roomCode) => {
        console.log(`Room created with code: ${roomCode}`)
        document.getElementById('roomCodeDisplay').innerText =
            `Room Code: ${roomCode}`
        const startGameButton = document.getElementById('startGame')
        if (startGameButton) {
            startGameButton.style.display = 'block'
        } else {
            console.error('Start Game button element not found.')
        }
    })

    // 서버로부터 방 참가 완료 이벤트 수신
    socket.on('joinedRoom', (roomCode) => {
        console.log(`Joined room: ${roomCode}`)
        document.getElementById('roomCodeDisplay').innerText =
            `Joined Room: ${roomCode}`
    })

    // 서버로부터 방을 찾을 수 없다는 알림 수신
    socket.on('roomNotFound', () => {
        console.error('Room not found')
        alert('The room code you entered does not exist. Please try again.')
    })

    // 방향키 입력 이벤트 처리
    document.addEventListener('keydown', (event) => {
        if (
            ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
                event.key
            )
        ) {
            const roomCode = document
                .getElementById('roomCodeDisplay')
                .innerText.replace('Room Code: ', '')
                .trim()
            if (roomCode) {
                socket.emit('changeDirection', {
                    roomCode,
                    direction: event.key.replace('Arrow', '').toUpperCase(),
                })
            }
        }
    })

    // 서버로부터 업데이트된 방향키 횟수 수신
    socket.on('updateCounts', (counts) => {
        document.getElementById('upCount').innerText = counts.ArrowUp
        document.getElementById('downCount').innerText = counts.ArrowDown
        document.getElementById('leftCount').innerText = counts.ArrowLeft
        document.getElementById('rightCount').innerText = counts.ArrowRight
    })
    // 서버로부터 게임 시작 이벤트 수신
    socket.on('gameStarted', (newGameState) => {
        console.log('Game started event received:', newGameState)
        gameState = newGameState
        updatePlayerInfo()
        // 게임 시작 시 필요한 UI 변경 등 추가 작업
    })

    // 게임 상태 수신
    socket.on('gameState', (newGameState) => {
        console.log('Game state received:', newGameState)
        gameState = newGameState

        if (gameState) {
            updatePlayerInfo()
            redrawCanvas() // 화면 갱신을 위한 함수 호출
        }
    })

    // 게임 오버 처리
    socket.on('gameOver', (winners) => {
        showGameOver(winners)
    })
})

function setup() {
    canvas = createCanvas(canvasSize, canvasSize)
    canvas.parent('gameCanvas')
    frameRate(10)
    console.log('Canvas setup completed')
}

function redrawCanvas() {
    console.log('Redrawing canvas with updated game state')
    clear() // 캔버스를 초기화하고
    draw() // 새로 그립니다.
}

function draw() {
    background(51)
    if (gameState) {
        drawFood()
        drawPlayers()
    }
}

function drawPlayers() {
    for (let player of gameState.players) {
        if (player.alive) {
            fill(player.color)
            console.log(`Drawing player with color: ${player.color}`)
            for (let segment of player.segments) {
                console.log(
                    `Drawing player segment at: x=${segment.x}, y=${segment.y}`
                )
                rect(
                    segment.x * gridSize,
                    segment.y * gridSize,
                    gridSize,
                    gridSize
                )
            }
        }
    }
}

function drawFood() {
    fill(255, 0, 0)
    for (let food of gameState.foods) {
        console.log(`Drawing food at: x=${food.x}, y=${food.y}`)
        rect(food.x * gridSize, food.y * gridSize, gridSize, gridSize)
    }
}

function updatePlayerInfo() {
    // const playerInfoDiv = document.getElementById('playerInfo')
    // playerInfoDiv.innerHTML = ''
    // if (gameState) {
    //     gameState.players.forEach((player, index) => {
    //         const playerDiv = document.createElement('div')
    //         playerDiv.textContent = `Player ${index + 1}: ${player.score}`
    //         playerDiv.style.color = player.color
    //         playerInfoDiv.appendChild(playerDiv)
    //     })
    // }
}

function showGameOver(winners) {
    const gameOverDiv = document.createElement('div')
    gameOverDiv.id = 'gameOver'
    gameOverDiv.innerHTML = `
      <h2>Game Over</h2>
      <p>Winner: Player ${winners[0].number}</p>
      <button onclick="restartGame()">Play Again</button>
    `
    document.body.appendChild(gameOverDiv)
}

function restartGame() {
    document.getElementById('gameOver').remove()
    const roomCode = document.getElementById('roomCodeInput').value // Room code를 input에서 가져옴
    socket.emit('restartGame', roomCode)
}
