import { Server, Socket } from 'socket.io'
import { Directions } from '../objects/player'
import { SocketOnEvtData } from '../../socket/type'
import { SOCKET_ON_EVT_TYPE } from '../../socket/constant'
import { TailTagMap, CommonMap } from '../maps'
import socketHandler from './index.util'

const gameWorld: CommonMap = new TailTagMap() // TODO: 라운드 신규 생성 시 주입 필요

class SocketImplement {
    socket: Socket

    constructor(socket: Socket) {
        this.socket = socket
        this.register()
        this.handleConnect()
    }

    private register = () => {
        this.socket.on('move', this.handleMove)
        this.socket.on('jump', this.handleJump)
        this.socket.on('shift', this.handleSift)
        this.socket.on('disconnect', this.handleDisconnect)
        this.logger('[ingame server] register complete!')
    }

    handleConnect() {
        gameWorld.addCharacter(this.socket.id)
        this.socket.emit('characters', gameWorld.convertGameState())
    }

    handleMove = (directions: Directions) => {
        const character = gameWorld.findCharacter(this.socket.id)
        socketHandler.handleMove(character, directions)
    }

    handleJump = (jump: boolean) => {
        const character = gameWorld.findCharacter(this.socket.id)
        socketHandler.handleJump(character, jump)
    }

    handleAngle = (angleRad: number) => {
        const character = gameWorld.findCharacter(this.socket.id)
        socketHandler.handleAngle(character, angleRad)
    }

    handleSift = (shift: boolean) => {
        const character = gameWorld.findCharacter(this.socket.id)
        socketHandler.handleSift(character, shift)
    }

    handleDisconnect = () => {
        gameWorld.removeCharacter(this.socket.id)
        this.socket.emit('characters', gameWorld.convertGameState())
    }

    public logger = (msg: string, args?: SocketOnEvtData) => {
        console.log(
            `[${this.socket.id}] ${msg} ${args ? JSON.stringify(args) : ''}`
        )
    }
}

export function initInGmaeSocket(io: Server): void {
    const root = io.of('/')

    // 게임 서버 interval ON
    gameWorld.startGameLoop((gameState) => {
        root.emit('characters', gameState) // TODO: broadcast only room
    })

    // TODO: OFF

    root.on(SOCKET_ON_EVT_TYPE.CONNECT, (socket: Socket) => {
        const instance = new SocketImplement(socket)
        instance.logger('complete connection')
    })
}
