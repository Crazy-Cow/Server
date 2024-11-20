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

let gameMap: CommonMap

class IngameController extends BaseController {
    // gameMap: CommonMap

    register() {
        // TODO this.gameMap이랑 연관
        this.socket.on<OnEventName>('move', this.handleMove)
    }

    // disconnect() {
    //     this.gameMap?.removeCharacter(this.socket.id)
    // }

    private handleMove = (data: OnEventData['move']) => {
        const userId = this.getUserId()
        const character = gameMap.findCharacter(userId)
        handleMove(character, data)
    }

    handleStartGame = (room: Room) => {
        gameMap = room.gameMap

        room.loadGame()
        room.startGameLoop({
            handleGameState: (data) => {
                this.broadcast(room.roomId, 'game.state', data)
            },
            handleGameOver: () => {
                console.log('게임 끝!')
                this.broadcast(room.roomId, 'game.over', undefined)
            },
        })
    }
}

export default IngameController
