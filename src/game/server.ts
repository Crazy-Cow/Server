import { Server, Socket } from 'socket.io'
import { GameWorld } from './objects/world'
import { Character, Directions, Position } from './objects/player'
import * as CANNON from 'cannon-es'
import { SocketOnEvtData } from '../socket/type'
import { SOCKET_ON_EVT_TYPE } from '../socket/constant'
const MAX_SPEED = 10

class SocketImplement {
    socket: Socket
    gameWorld: GameWorld // TODO: 새로운 방 생성 시 분리 필요함

    constructor(socket: Socket) {
        this.socket = socket
        this.gameWorld = new GameWorld()
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
        const newPosition = this.generateRandomPosition()
        const newCharacter = new Character(
            this.socket.id,
            newPosition,
            this.gameWorld.characterMaterial
        )
        this.gameWorld.addCharacter(newCharacter)
        // TODO: broadcast only room

        this.socket.emit('characters', this.getSerializableCharacters())
    }

    private getSerializableCharacters = () => {
        return this.gameWorld.characters.map((char) => ({
            id: char.id,
            position: char.position,
            bodyColor: char.bodyColor,
            hairColor: char.hairColor,
            bellyColor: char.bellyColor,
            hasTail: char.hasTail,
            facingAngleRad: char.facingAngleRad,
        }))
    }

    private generateRandomPosition = (): Position => {
        return [Math.random() * 10, 2, Math.random() * 10]
    }

    handleMove = (directions: Directions) => {
        const character = this.gameWorld.characters.find(
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
        const character = this.gameWorld.characters.find(
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
        const character = this.gameWorld.characters.find(
            (char) => char.id === this.socket.id
        )
        if (character) {
            character.angleRad = angleRad
        }
    }

    handleSift = (shift: boolean) => {
        const character = this.gameWorld.characters.find(
            (char) => char.id === this.socket.id
        )
        if (character) {
            character.shift = shift
        }
    }

    handleDisconnect = () => {
        const characters = this.gameWorld.characters

        const index = characters.findIndex(
            (character) => character.id === this.socket.id
        )
        if (index !== -1) {
            const character = characters[index]
            if (character.cannonBody) {
                this.gameWorld.world.removeBody(character.cannonBody)
            }
            characters.splice(index, 1)
        }
        this.socket.emit('characters', this.getSerializableCharacters())
    }

    updateGameState = () => {
        setInterval(() => {
            this.gameWorld.update()
            this.socket.emit('characters', this.getSerializableCharacters())
        }, 1000 / 60)
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
