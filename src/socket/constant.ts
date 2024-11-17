export const SOCKET_ON_EVT_TYPE = {
    CONNECT: 'connection',
    ROOM_ENTER: 'room.enter', // 빠른 시작
    ROOM_LEAVE: 'room.leave', // 대기실 나가기
    DISCONNECT: 'disconnect',
    MOVE: 'move',
} as const

export type SocketEmitEvtTypeNew =
    | 'room.changeState' // 대기실 상태 변경
    | 'game.start' // 게임 시작
    | 'characters' // v1 게임 상태
    | 'game.state' // v2 게임 상태
    | 'game.over' // 게임 종료

export const SOCKET_EMIT_EVT_TYPE = {
    // deprecated
    ROOM_CHANGE_STATE: 'room.changeState', // 대기실 상태 변경
    GAME_START: 'game.start', // 게임 시작
    CHARACTERS: 'characters', // v1 게임 상태
    GAME_STATE: 'game.state', // v2 게임 상태
    GAME_OVER: 'game.over', // 게임 종료
} as const

export const SOCKET_NAME_SPACE = {
    HOME: 'outgame.home', // 홈화면
    READY: 'outgame.ready', // 대기실
}
