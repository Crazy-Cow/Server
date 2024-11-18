export const SOCKET_ON_EVT_TYPE = {
    CONNECT: 'connection',
    ROOM_ENTER: 'room.enter', // 빠른 시작
    ROOM_LEAVE: 'room.leave', // 대기실 나가기
    DISCONNECT: 'disconnect',
    MOVE: 'move',
} as const

export const SOCKET_NAME_SPACE = {
    HOME: 'outgame.home', // 홈화면
    READY: 'outgame.ready', // 대기실
}
