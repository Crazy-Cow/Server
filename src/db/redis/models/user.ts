export class RedisUser {
    userId: string
    nickName: string

    constructor(userId: string, nickName: string) {
        this.userId = userId
        this.nickName = nickName
    }
}
