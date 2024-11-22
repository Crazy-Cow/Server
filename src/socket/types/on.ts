export type OnEventName =
    | 'reconnect'
    | 'connection' // 연결
    | 'disconnect' // 끊김
    | 'room.enter' // 빠른 시작
    | 'room.leave' // 대기실 나가기

type OnEventDataMap = {
    reconnect: undefined
    connection: undefined
    disconnect: string // reason
    'room.enter': undefined
    'room.leave': undefined
}

export type OnEventData = {
    [K in OnEventName]: OnEventDataMap[K]
}
