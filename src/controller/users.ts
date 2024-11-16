import { Request, Response } from 'express'
import {
    CreateUserRequest,
    CreateUserResponse,
    GetRandomNickNameRequest,
    GetRandomNickNameResponse,
} from './users.type'
import userService from '../service/users'
import StatusCode from '../constants/statusCode'
import {
    createError as createErrorRes,
    ErrorResponse,
    handleToCatchInternalServerError,
} from '../utils/error'

export const getRandomNicknameController = (
    req: Request<object, object, GetRandomNickNameRequest>,
    res: Response<GetRandomNickNameResponse | ErrorResponse>
) => {
    const { userId } = req.body

    if (!userId) {
        res.status(StatusCode.BadRequest).json(
            createErrorRes({ msg: '[userId] is required' })
        )
        return
    }

    const nickname = userService.createTempNickname(userId)
    res.status(StatusCode.OK).json({
        nickName: nickname,
    })
}

export const createUserController = (
    req: Request<object, object, CreateUserRequest>,
    res: Response<CreateUserResponse | ErrorResponse>
) => {
    const { userId, nickName } = req.body

    if (!userId) {
        res.status(StatusCode.BadRequest).json(
            createErrorRes({ msg: '[userId] is required' })
        )
        return
    }

    if (!nickName) {
        res.status(StatusCode.BadRequest).json(
            createErrorRes({ msg: '[nickName] is required' })
        )
        return
    }

    try {
        if (userService.checkDuplicatedNickName(userId, nickName)) {
            res.status(StatusCode.Conflict).json(
                createErrorRes({ msg: '중복된 닉네임입니다' })
            )
            return
        }

        const user = userService.createUser(userId, nickName)
        if (user) {
            res.status(StatusCode.Created).json({ nickName: user.nickName })
        } else {
            throw new Error('유저 생성 실패')
        }
    } catch (err) {
        handleToCatchInternalServerError(res, err as ErrorResponse)
    }
}
