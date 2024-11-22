import { RedisUser } from '../../db/redis/models/user'
import userRepository, { UserRepository } from '../../db/redis/repository/users'

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
        return this.repository.findById(userId)
    }

    async createUser(nickName: string) {
        const userId = this.generateUserId()
        const user = new RedisUser({ userId, nickName, roomId: '' })
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
