import userRepository from '../db/mongoose/repository/user'
import guestRepository from '../db/redis/respository/guest'

class UserService {
    private static instance: UserService

    public static getInstance(): UserService {
        if (!this.instance) {
            this.instance = new UserService()
        }
        return this.instance
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

    addTournamentUser(
        token: string,
        challengermodeId: string,
        nickName: string,
        pictureUrl?: string
    ) {
        return userRepository.createTournamentUser({
            token,
            challengermodeId,
            isTournament: true,
            nickName,
            pictureUrl,
        })
    }

    async getUserByChallengermodeId(challengermodeId: string) {
        return userRepository.getUserByChallengermodeId({ challengermodeId })
    }

    async getUserByNickName(nickName: string) {
        return userRepository.getUserByNickName({ nickName })
    }
}

const userService = UserService.getInstance()

export default userService
