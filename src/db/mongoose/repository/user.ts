import UserModel from '../schemas/user'
import { comparePassword, encryptPassword } from '../../../utils/encrypt'

const create = async (props: { nickName: string; password: string }) => {
    const encrypted = await encryptPassword(props.password)
    const user = new UserModel({
        nickName: props.nickName,
        hashedPassword: encrypted,
    })

    await user.save()
}

const checkDupNick = async (props: { nickName: string }) => {
    const user = await UserModel.findOne({ nickName: props.nickName })
    return Boolean(user)
}

const findOne = async (props: { nickName: string; password: string }) => {
    const user = await UserModel.findOne({ nickName: props.nickName })
    const valid = await comparePassword(props.password, user.hashedPassword)

    if (valid) return user
    else return null
}

export type UserRepository = {
    create: typeof create
    findOne: typeof findOne
    checkDupNick: typeof checkDupNick
}

const userRepository: UserRepository = {
    create,
    findOne,
    checkDupNick,
}

export default userRepository
