import { RoomState } from 'service/rooms'
import { SOCKET_ON_EVT_TYPE, SOCKET_EMIT_EVT_TYPE } from './constant'

export type SocketOnEvtType = keyof typeof SOCKET_ON_EVT_TYPE
export type SocketOnEvtData = {
    [SOCKET_ON_EVT_TYPE.DISCONNECT]: undefined
    [SOCKET_ON_EVT_TYPE.ROOM_ENTER]: undefined
    [SOCKET_ON_EVT_TYPE.ROOM_LEAVE]: undefined
}

export type SocketEmitEvtType = keyof typeof SOCKET_EMIT_EVT_TYPE
export type SocketEmitEvtData = {
    [SOCKET_EMIT_EVT_TYPE.ROOM_CHANGE_STATE]: {
        playerCnt: number
        state: RoomState
        remainTime: number
    }
    [SOCKET_EMIT_EVT_TYPE.GAME_START]: undefined
}
