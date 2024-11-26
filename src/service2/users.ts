import userRepository from '../db/mongoose/repository/user'
import guestRepository from '../db/redis/respository/guest'

type PlayerProps = {
    userId: string
    nickName: string
    isGuest: boolean
}

export class Player {
    userId: string
    nickName: string
    isGuest: boolean

    constructor({ userId, nickName, isGuest }: PlayerProps) {
        this.userId = userId
        this.nickName = nickName
        this.isGuest = isGuest
    }
}

class UserService2 {
    private static instance: UserService2

    public static getInstance(): UserService2 {
        if (!this.instance) {
            this.instance = new UserService2()
        }
        return this.instance
    }

    findUser(nickName: string, password: string) {
        return userRepository.findOne({ nickName, password })
    }

    createPlayer(props: PlayerProps) {
        return new Player(props)
    }

    addUser(nickName: string, password: string) {
        return userRepository.create({ nickName, password })
    }

    addGuestNick(token: string) {
        return guestRepository.addNick(token)
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
