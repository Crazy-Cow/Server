import { Position } from 'game/objects/player'

type ClientCharacter = {
    id: string
    position: Position
    velocity: Position
    isOnGround: boolean
}

export type SocketMoveData = {
    // TODO: 시간정보 delta, datetime 정보 발생 시점
    shift: boolean
    character: ClientCharacter
}
