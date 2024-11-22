import { RoomState } from '../../service/rooms'
export type EmitEventName =
    | 'room.changeState' // 대기실 상태 변경
    | 'game.ready' // 3초 후 시작
    | 'game.enter' // 인게임 진입

type EmitEventDataMap = {
    'room.changeState': {
        roomId: string
        state: RoomState
        playerCnt: number
        maxPlayerCnt: number
    }
    'game.ready': undefined
    'game.enter': undefined
}

export type EmitEventData = {
    [K in EmitEventName]: EmitEventDataMap[K]
}
