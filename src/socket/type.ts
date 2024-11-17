import { RoomState } from 'service/rooms'
import { SOCKET_ON_EVT_TYPE, SOCKET_EMIT_EVT_TYPE } from './constant'
import { Character } from 'game/objects/player'

export type SocketOnEvtData = {
    [SOCKET_ON_EVT_TYPE.DISCONNECT]: undefined
    [SOCKET_ON_EVT_TYPE.ROOM_ENTER]: undefined
    [SOCKET_ON_EVT_TYPE.ROOM_LEAVE]: undefined
}

// will be deprecated
export type SocketEmitEvtDataGameStateV1Item = {
    id: Character['id']
    position: Character['position']
    bodyColor: Character['bodyColor']
    hairColor: Character['hairColor']
    bellyColor: Character['bellyColor']
    velocity: Character['velocity']
    hasTail: Character['hasTail']
}

export type SocketEmitEvtDataGameStateV2 = {
    remainRunningTime: number
    characters: SocketEmitEvtDataGameStateV1Item[]
}

export type SocketEmitEvtData = {
    [SOCKET_EMIT_EVT_TYPE.ROOM_CHANGE_STATE]: {
        state: RoomState
        playerCnt: number
        maxPlayerCnt: number
    }
    [SOCKET_EMIT_EVT_TYPE.GAME_STATE]: SocketEmitEvtDataGameStateV2
    [SOCKET_EMIT_EVT_TYPE.GAME_START]: undefined
    [SOCKET_EMIT_EVT_TYPE.GAME_OVER]: undefined
}
