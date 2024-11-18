import { Socket } from 'socket.io'
import { BaseController } from './base'
import { OnEventData, OnEventName } from '../types/on'
import { Room } from '../../service/rooms'
import { CommonMap } from '../../game/maps'
import { Character } from '../../game/objects/player'

function handleMove(character: Character, data: OnEventData['move']) {
    character.shift = data.shift
    character.position = data.character.position
    character.velocity = data.character.velocity
    character.isOnGround = data.character.isOnGround
}

class IngameController extends BaseController {
    socket: Socket
    gameMap: CommonMap

    register() {
        this.socket.on<OnEventName>('move', this.handleMove)
    }

    disconnect() {
        this.gameMap?.removeCharacter(this.socket.id)
    }

    private handleMove = (data: OnEventData['move']) => {
        const character = this.gameMap.findCharacter(this.socket.id)
        handleMove(character, data)
    }

    handleStartGame = (room: Room) => {
        this.gameMap = room.gameMap
        this.broadcast(room.roomId, 'game.start', { players: room.players })

        room.loadGame()

        room.startGameLoop({
            handleGameState: (data) => {
                this.broadcast(room.roomId, 'game.state', data)
            },
            handleGameOver: () => {
                this.broadcast(room.roomId, 'game.over', undefined)
            },
        })
    }
}

export default IngameController
