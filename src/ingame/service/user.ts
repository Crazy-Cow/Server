import userRepository, { UserRepository } from '../../db/redis/repository/users'

class UserService {
    private repository: UserRepository

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

    async findUserById(userId: string) {
        return this.repository.findById(userId)
    }
}

const userService = UserService.getInstance()

export default userService
