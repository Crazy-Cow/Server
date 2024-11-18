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
import { generateAccessToken } from 'utils/jwt'

export const getRandomNicknameController = (
    _,
    res: Response<GetRandomNickNameResponse | ErrorResponse>
) => {
    const nickname = userService.createTempNickname()
    res.status(StatusCode.OK).json({
        nickName: nickname,
    })
}

export const createUserController = (
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
        if (userService.checkDuplicatedNickName(nickName)) {
            res.status(StatusCode.Conflict).json(
                createErrorRes({ msg: '중복된 닉네임입니다' })
            )
            return
        }

        const accessToken = generateAccessToken({ nickName })
        const user = userService.createUser(accessToken, nickName)
        if (user) {
            res.status(StatusCode.Created).json({ accessToken })
        } else {
            throw new Error('유저 생성 실패')
        }
    } catch (err) {
        handleToCatchInternalServerError(res, err as ErrorResponse)
    }
}
