import { Request, Response } from 'express'
import { CreateUserRequest, CreateUserResponse } from './users.type'
import userService from 'service/users'
import StatusCode from 'constants/statusCode'
import {
    createError as createErrorRes,
    ErrorResponse,
    handleToCatchInternalServerError,
} from 'utils/error'

export const createUserController = (
    req: Request<object, object, CreateUserRequest>,
    res: Response<CreateUserResponse | ErrorResponse>
) => {
    const { userId, nickName } = req.body
    try {
        if (userService.checkDuplicatedNickName(nickName)) {
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
