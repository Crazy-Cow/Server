import { Request, Response } from 'express'
import {
    CreateUserRequest,
    CreateUserResponse,
    GetRandomNickNameResponse,
} from './users.type'
import userService from '../service/users'
import StatusCode from '../constants/statusCode'
import {
    createError as createErrorRes,
    ErrorResponse,
    handleToCatchInternalServerError,
} from '../utils/error'
import util from '../service/users.util'

export const getRandomNicknameController = (
    _,
    res: Response<GetRandomNickNameResponse | ErrorResponse>
) => {
    const nickname = util.generateGuestNickName()
    res.status(StatusCode.OK).json({
        nickName: nickname,
    })
}

export const createUserController = async (
    req: Request<object, object, CreateUserRequest>,
    res: Response<CreateUserResponse | ErrorResponse>
) => {
    const { nickName } = req.body

    if (!nickName) {
        res.status(StatusCode.BadRequest).json(
            createErrorRes({ msg: '[nickName] is required' })
        )
        return
    }

    try {
        const exists = await userService.checkDupNick(nickName)
        if (exists) {
            res.status(StatusCode.Conflict).json(
                createErrorRes({ msg: '중복된 닉네임입니다' })
            )
            return
        }

        const user = await userService.createUser(nickName)
        if (user) {
            res.status(StatusCode.Created).json({ userId: user.userId })
        } else {
            throw new Error('유저 생성 실패')
        }
    } catch (err) {
        handleToCatchInternalServerError(res, err as ErrorResponse)
    }
}
