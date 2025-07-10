import UserModel from '../schemas/user'

const checkDupNick = async (props: { nickName: string }) => {
    const user = await UserModel.findOne({ nickName: props.nickName })
    return Boolean(user)
}

const createTournamentUser = async (props: {
    token: string
    challengermodeId: string
    isTournament: boolean
    nickName: string
    pictureUrl?: string
}) => {
    const user = new UserModel({
        token: props.token,
        challengermodeId: props.challengermodeId,
        isTournament: props.isTournament,
        nickName: props.nickName,
        pictureUrl: props.pictureUrl,
    })

    await user.save()
}

const getUserByChallengermodeId = async (props: {
    challengermodeId: string
}) => {
    const user = await UserModel.findOne({
        challengermodeId: props.challengermodeId,
    })
    return user
}

export type UserRepository = {
    checkDupNick: typeof checkDupNick
    createTournamentUser: typeof createTournamentUser
    getUserByChallengermodeId: typeof getUserByChallengermodeId
}

const userRepository: UserRepository = {
    checkDupNick,
    createTournamentUser,
    getUserByChallengermodeId,
}

export default userRepository
