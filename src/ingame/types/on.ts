import { Position } from '../game/objects/player'

export type OnEventName =
    | 'reconnect'
    | 'connection' // 연결
    | 'disconnect' // 끊김
    | 'move'

type OnEventDataMap = {
    reconnect: undefined
    connection: undefined
    disconnect: string // reason
    move: {
        // TODO: 시간정보 delta, datetime 정보 발생 시점
        shift: boolean
        character: {
            id: string
            position: Position
            velocity: Position
            isOnGround: boolean
        }
    }
}

export type OnEventData = {
    [K in OnEventName]: OnEventDataMap[K]
}
