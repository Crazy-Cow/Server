import { Position } from '../../game/objects/player'

export type OnEventName =
    | 'reconnect'
    | 'connection' // 연결
    | 'disconnect' // 끊김
    | 'room.enter' // 빠른 시작
    | 'room.leave' // 대기실 나가기
    | 'move'
// | 'steal'
// | 'skill'

type OnEventDataMap = {
    reconnect: undefined
    connection: undefined
    disconnect: string // reason
    'room.enter': undefined
    'room.leave': undefined
    move: {
        steal: boolean
        skill: boolean
        character: {
            id: string
            position: Position
            velocity: Position
        }
    }
    // steal: { character: { steal: boolean } }
    // skill: { character: { skill: boolean } }
}

export type OnEventData = {
    [K in OnEventName]: OnEventDataMap[K]
}
