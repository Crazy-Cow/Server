import { Request, Response } from 'express'
import {
    CreateUserRequest,
    CreateUserResponse,
    GetRandomNickNameResponse,
    GuestInRequest,
    GuestInResponse,
} from './users.type'
import StatusCode from '../constants/statusCode'
import { createError as createErrorRes, ErrorResponse } from '../utils/error'
import util from '../service/users.util'
import { generateAccessToken } from '../utils/jwt'
import userService from '../service/users'

export const getRandomNicknameController = (
    _,
    res: Response<GetRandomNickNameResponse | ErrorResponse>
) => {
    const nickname = util.generateGuestNickName()
    res.status(StatusCode.OK).json({
        nickName: nickname,
    })
}

// (시작) userId -> token 모드로 바뀌면 삭제 예정 ============
export const createUserController = async (
    req: Request<object, object, CreateUserRequest>,
    res: Response<CreateUserResponse | ErrorResponse>
) => {
    const { nickName } = req.body

    if (!nickName) {
        res.status(400).json(createErrorRes({ msg: '[nickName] 필드 확인' }))
        return
    }

    const duplicated = await userService.checkDupNick(nickName)
    if (duplicated) {
        res.status(400).json(createErrorRes({ msg: '중복된 닉네임' }))
        return
    }

    const accessToken = generateAccessToken({
        userId: nickName, // fyi. 게스트의 경우 unique id 관리가 애매함
        nickName: nickName,
        isGuest: true,
    })

    await userService.addGuestNick(accessToken)

    res.status(200).json({
        userId: nickName,
    })
}
// (끝) will be deprecated ============

export const guestInUserController = async (
    req: Request<object, object, GuestInRequest>,
    res: Response<GuestInResponse | ErrorResponse>
) => {
    const { nickName } = req.body

    if (!nickName) {
        res.status(400).json(createErrorRes({ msg: '[nickName] 필드 확인' }))
        return
    }

    const duplicated = await userService.checkDupNick(nickName)
    if (duplicated) {
        res.status(400).json(createErrorRes({ msg: '중복된 닉네임' }))
        return
    }

    const accessToken = generateAccessToken({
        userId: nickName, // fyi. 게스트의 경우 unique id 관리가 애매함
        nickName: nickName,
        isGuest: true,
    })

    await userService.addGuestNick(accessToken)

    res.status(200).json({
        accessToken,
    })
}

// users.controller.ts에 추가
// Challengermode OAuth 토큰 교환 함수
async function exchangeChallengermodeToken(
    code: string,
    codeVerifier: string,
    redirectUri: string
) {
    const CHALLENGERMODE_CLIENT_ID = process.env.CHALLENGERMODE_CLIENT_ID
    const CHALLENGERMODE_CLIENT_SECRET =
        process.env.CHALLENGERMODE_CLIENT_SECRET

    if (!CHALLENGERMODE_CLIENT_ID || !CHALLENGERMODE_CLIENT_SECRET) {
        throw new Error('Challengermode 환경변수가 설정되지 않았습니다')
    }

    const response = await fetch('https://challengermode.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code_verifier: codeVerifier,
            code: code,
            client_id: CHALLENGERMODE_CLIENT_ID,
            client_secret: CHALLENGERMODE_CLIENT_SECRET,
            redirect_uri: redirectUri,
        }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error(
            'Challengermode 토큰 교환 실패:',
            response.status,
            errorText
        )
        throw new Error(`토큰 교환 실패: ${response.status}`)
    }

    return response.json()
}

// Challengermode 사용자 정보 조회 함수
async function getChallengermodeUserInfo(accessToken: string) {
    // Public API 사용 - 올바른 엔드포인트
    const response = await fetch(
        'https://publicapi.challengermode.com/mk1/v1/me/userinfo',
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }
    )

    if (!response.ok) {
        const errorText = await response.text()
        console.error(
            'Challengermode 사용자 정보 조회 실패:',
            response.status,
            errorText
        )
        throw new Error(`사용자 정보 조회 실패: ${response.status}`)
    }

    return response.json()
}

export const tournamentInUserController = async (
    req: Request<
        object,
        object,
        {
            nickName: string
            authorizationCode: string
            codeVerifier: string
            redirectUri: string
        }
    >,
    res: Response<{ userId: string } | ErrorResponse>
) => {
    const { nickName, authorizationCode, codeVerifier, redirectUri } = req.body

    if (!nickName || !authorizationCode || !codeVerifier || !redirectUri) {
        res.status(400).json(
            createErrorRes({
                msg: '[nickName|authorizationCode|codeVerifier|redirectUri] 필드 확인',
            })
        )
        return
    }

    try {
        // 1. Challengermode OAuth 토큰 교환
        const tokenResponse = await exchangeChallengermodeToken(
            authorizationCode,
            codeVerifier,
            redirectUri
        )

        // 2. Challengermode 사용자 정보 조회
        const userInfo = await getChallengermodeUserInfo(
            tokenResponse.access_token
        )

        // 3. 닉네임 중복 체크
        const duplicated = await userService.checkDupNick(nickName)
        if (duplicated) {
            res.status(400).json(createErrorRes({ msg: '중복된 닉네임' }))
            return
        }

        // 4. 토너먼트 사용자 등록
        const accessToken = generateAccessToken({
            userId: userInfo.sub, // Challengermode 사용자 ID 사용
            nickName: userInfo.nickname,
            isGuest: false,
            isTournament: true,
            challengermodeId: userInfo.sub,
        })

        await userService.addTournamentUser(
            accessToken,
            userInfo.sub,
            userInfo.nickname,
            userInfo.picture
        )

        res.status(200).json({
            userId: userInfo.nickname,
        })
    } catch (error) {
        console.error('토너먼트 인증 에러:', error)
        res.status(400).json(createErrorRes({ msg: '토너먼트 인증 실패' }))
    }
}

export const signOutUserController = () => {}
