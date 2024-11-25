import userRepository from '../db/mongoose/repository/user'
import guestRepository from '../db/redis/respository/guest'

class UserService2 {
    private static instance: UserService2

    public static getInstance(): UserService2 {
        if (!this.instance) {
            this.instance = new UserService2()
        }
        return this.instance
    }

    async checkDupNick(nickName: string) {
        const duplicatedInGuest = await guestRepository.checkDupNick(nickName)
        if (duplicatedInGuest) return true

        const duplicatedInUser = await userRepository.checkDupNick({ nickName })
        if (duplicatedInUser) return true

        return false
    }
}

const userService2 = UserService2.getInstance()

export default userService2
