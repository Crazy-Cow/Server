import { Server, Socket } from 'socket.io'
import { Directions } from './objects/player'
import * as CANNON from 'cannon-es'
import { SocketOnEvtData } from '../socket/type'
import { SOCKET_ON_EVT_TYPE } from '../socket/constant'
import { TailTagRound, CommonRound } from './rounds'

const gameWorld: CommonRound = new TailTagRound() // TODO: 라운드 신규 생성 시 주입 필요

const MAX_SPEED = 10

class SocketImplement {
    socket: Socket

    constructor(socket: Socket) {
        this.socket = socket
        this.register()
        this.handleConnect()
        this.updateGameState() // TODO: 게임방별로 돌아야함
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
        // this.socket.emit('characters', gameWorld.convertGametate()) // TODO: broadcast only room
    }

    handleMove = (directions: Directions) => {
        const character = gameWorld.characters.find(
            (char) => char.id === this.socket.id
        )
        if (character && character.cannonBody) {
            const angleRad = character.angleRad || 0

            // 카메라 각도에 따른 방향 벡터 계산
            const forwardX = -Math.sin(angleRad)
            const forwardZ = -Math.cos(angleRad)
            const rightX = Math.cos(angleRad)
            const rightZ = Math.sin(angleRad)

            let targetVelocityX = 0
            let targetVelocityZ = 0

            if (directions.up) {
                targetVelocityX += forwardX * MAX_SPEED
                targetVelocityZ += forwardZ * MAX_SPEED
            }
            if (directions.down) {
                targetVelocityX -= forwardX * MAX_SPEED
                targetVelocityZ -= forwardZ * MAX_SPEED
            }
            if (directions.left) {
                targetVelocityX -= rightX * MAX_SPEED
                targetVelocityZ -= rightZ * MAX_SPEED
            }
            if (directions.right) {
                targetVelocityX += rightX * MAX_SPEED
                targetVelocityZ += rightZ * MAX_SPEED
            }

            // 현재 속도와 목표 속도 간의 차이를 줄여 이동이 부드럽게 되도록 설정
            character.cannonBody.velocity.x = targetVelocityX
            character.cannonBody.velocity.z = targetVelocityZ

            // 키가 떼어진 상태라면 속도를 완전히 0으로 설정
            if (targetVelocityX === 0 && targetVelocityZ === 0) {
                character.cannonBody.velocity.x = 0
                character.cannonBody.velocity.z = 0
                character.cannonBody.angularVelocity.set(0, 0, 0) // 각속도도 0으로 설정
            }

            const facingAngleRad = Math.atan2(
                character.cannonBody.velocity.x,
                character.cannonBody.velocity.z
            )
            character.facingAngleRad = facingAngleRad
        }
    }

    handleJump = (jump: boolean) => {
        const character = gameWorld.characters.find(
            (char) => char.id === this.socket.id
        )
        if (character && jump && character.cannonBody && character.isOnGround) {
            character.cannonBody.applyImpulse(
                new CANNON.Vec3(0, 5, 0),
                character.cannonBody.position
            )
            character.isOnGround = false
        }
    }

    handleAngle = (angleRad: number) => {
        const character = gameWorld.characters.find(
            (char) => char.id === this.socket.id
        )
        if (character) {
            character.angleRad = angleRad
        }
    }

    handleSift = (shift: boolean) => {
        const character = gameWorld.characters.find(
            (char) => char.id === this.socket.id
        )
        if (character) {
            character.shift = shift
        }
    }

    handleDisconnect = () => {
        const characters = gameWorld.characters

        const index = characters.findIndex(
            (character) => character.id === this.socket.id
        )
        if (index !== -1) {
            const character = characters[index]
            if (character.cannonBody) {
                gameWorld.world.removeBody(character.cannonBody)
            }
            characters.splice(index, 1)
        }

        // this.socket.emit('characters', gameWorld.convertGametate()) // TODO: broadcast only room
    }

    updateGameState = () => {
        setInterval(() => {
            gameWorld.updateGameState()
            // Q. 업데이트 주기에만 쏘면되지 않나??
            this.socket.emit('characters', gameWorld.convertGametate()) // TODO: broadcast only room
        }, 1000 * gameWorld.updateInterval)
    }

    public logger = (msg: string, args?: SocketOnEvtData) => {
        console.log(
            `[${this.socket.id}] ${msg} ${args ? JSON.stringify(args) : ''}`
        )
    }
}

export function initInGmaeSocket(io: Server): void {
    const root = io.of('/')

    root.on(SOCKET_ON_EVT_TYPE.CONNECT, (socket: Socket) => {
        const instance = new SocketImplement(socket)
        instance.logger('complete connection')
    })
}
