import userRepository, { UserRepository } from '../../db/redis/repository/users'

export class User {
    userId: string
    nickName: string

    constructor(userId: string, nickName: string) {
        this.userId = userId
        this.nickName = nickName
    }
}

class UserService {
    private repository: UserRepository
    private idCounter: number = 1

    private constructor() {
        this.repository = userRepository
    }

    private static instance: UserService

    public static getInstance(): UserService {
        if (!this.instance) {
            this.instance = new UserService()
        }
        return this.instance
    }

    private generateUserId(): string {
        const userId = `user-${this.idCounter}`
        this.idCounter += 1
        return userId
    }

    async findUserById(userId: string) {
        const redisUser = await this.repository.findById(userId)
        const user = new User(redisUser.userId, redisUser.nickName)
        return user
    }

    async createUser(nickName: string) {
        const userId = this.generateUserId()
        const user = new User(userId, nickName)
        await this.repository.createAndSave(user)
        return user
    }

    async removeUser(userId: string) {
        await this.repository.remove(userId)
    }

    async checkDupNick(nickName: string) {
        return this.repository.isDupNick(nickName)
    }
}

const userService = UserService.getInstance()

export default userService
