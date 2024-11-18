import { Position } from '../../game/objects/player'

export type OnEventName =
    | 'connection' // 연결
    | 'disconnect' // 끊김
    | 'room.enter' // 빠른 시작
    | 'room.leave' // 대기실 나가기
    | 'move'

type OnEventDataMap = {
    connection: undefined
    disconnect: undefined
    'room.enter': undefined
    'room.leave': undefined
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
