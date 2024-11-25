import { Request, Response } from 'express'
import {
    CreateUserRequest,
    CreateUserResponse,
    GetRandomNickNameResponse,
    SignInRequest,
    SignInResponse,
    SignUpRequest,
} from './users.type'
import userService from '../service/users'
import StatusCode from '../constants/statusCode'
import {
    createError as createErrorRes,
    ErrorResponse,
    handleToCatchInternalServerError,
} from '../utils/error'
import util from '../service/users.util'
import userRepository from '../db/mongoose/repository/user'
import { generateAccessToken } from '../utils/jwt'

export const getRandomNicknameController = (
    _,
    res: Response<GetRandomNickNameResponse | ErrorResponse>
) => {
    const nickname = util.generateGuestNickName()
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

        const user = userService.createUser(nickName)
        if (user) {
            res.status(StatusCode.Created).json({ userId: user.userId })
        } else {
            throw new Error('유저 생성 실패')
        }
    } catch (err) {
        handleToCatchInternalServerError(res, err as ErrorResponse)
    }
}

export const guestInUserController = () => {}

export const signInUserController = async (
    req: Request<object, object, SignInRequest>,
    res: Response<SignInResponse | ErrorResponse>
) => {
    const { nickName, password } = req.body

    if (!nickName || !password) {
        res.status(400).json(
            createErrorRes({ msg: '[nickName|password] 필드 확인' })
        )
        return
    }

    const user = await userRepository.findOne({ nickName, password })
    if (!user) {
        res.status(400).json(createErrorRes({ msg: '존재하지 않는 유저' }))
        return
    }

    const accessToken = generateAccessToken({
        id: user.id,
        nickName: user.nickName,
    })

    res.status(200).json({
        accessToken,
    })
}

export const signUpUserController = async (
    req: Request<object, object, SignUpRequest>,
    res: Response<ErrorResponse>
) => {
    const { nickName, password, passwordConfirm } = req.body

    if (password != passwordConfirm) {
        res.status(400).json(createErrorRes({ msg: '비밀번호/확인 불일치' }))
        return
    }
    const duplicated = await userRepository.checkDupNick(nickName)
    if (duplicated) {
        res.status(400).json(createErrorRes({ msg: '중복된 닉네임' }))
        return
    }

    await userRepository.create({ nickName, password })
    res.status(201).end()
}

export const signOutUserController = () => {}
