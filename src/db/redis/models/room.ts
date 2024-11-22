export class RedisGameRoom {
    roomId: string
    playerIds: string[]

    constructor(roomId: string, playerIds: string[]) {
        this.roomId = roomId
        this.playerIds = playerIds
    }
}
