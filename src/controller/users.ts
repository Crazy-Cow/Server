import { Request, Response } from 'express'
import {
    CreateUserRequest,
    CreateUserResponse,
    GetRandomNickNameResponse,
    GuestInRequest,
    GuestInResponse,
    TournamentInResponse,
    VerifyGameAccountRequest,
    VerifyGameAccountResponse,
} from './users.type'
import StatusCode from '../constants/statusCode'
import { createError as createErrorRes, ErrorResponse } from '../utils/error'
import util from '../service/users.util'
import { generateAccessToken, verifyToken } from '../utils/jwt'
import userService from '../service/users'
import { getBotAccessToken } from '../utils/challengermodeBotToken'

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

    const response = await fetch(
        'https://dev-esports.krafton.com/oauth/token',
        {
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
        }
    )

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
        'https://cm-stage-g.challengermode.com:2083/mk1/v1/me/userinfo',
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
            sessionId?: string // 추가: 게임 세션 ID (선택적)
        }
    >,
    res: Response<TournamentInResponse | ErrorResponse>
) => {
    const {
        nickName,
        authorizationCode,
        codeVerifier,
        redirectUri,
        sessionId,
    } = req.body

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

        // sessionId가 있으면 기존 게임 세션에 참여하는 경우
        if (sessionId) {
            console.log(
                `기존 게임 세션 참여: sessionId=${sessionId}, accountId=${userInfo.sub}`
            )

            res.status(200).json({
                userId: userInfo.nickname,
                accountId: userInfo.sub,
                linked: true,
                sessionId: sessionId,
            })
            return
        }

        // sessionId가 없으면 새 토너먼트 사용자 등록
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

        // 5. Challengermode 계정 연동(verification) API 호출
        // 1) Verification Token 생성
        const verificationTokenRes = await fetch(
            `https://cm-stage-g.challengermode.com:2083/mk1/v1/game_integrations/${process.env.CHALLENGERMODE_GAME_INTEGRATION_ID}/link_account/generate_verification_token`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                    'Content-Type': 'application/json',
                },
            }
        )
        if (!verificationTokenRes.ok) {
            const errorText = await verificationTokenRes.text()
            console.error('Verification token 생성 실패:', errorText)
            res.status(500).json(
                createErrorRes({ msg: 'Verification token 생성 실패' })
            )
            return
        }
        const { oneTimeToken } = await verificationTokenRes.json()

        // 2) Verify Game Account
        const botAccessKey = await getBotAccessToken()
        const verifyRes = await fetch(
            `https://cm-stage-g.challengermode.com:2083/mk1/v1/game_integrations/${process.env.CHALLENGERMODE_GAME_INTEGRATION_ID}/link_account/verify`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${botAccessKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameAccountReference: { accountId: userInfo.sub },
                    accountLinkingToken: oneTimeToken,
                    overrideExisting: true,
                }),
            }
        )
        if (!verifyRes.ok) {
            const errorText = await verifyRes.text()
            console.error('계정 연동(verify) 실패:', errorText)
            res.status(500).json(
                createErrorRes({ msg: '계정 연동(verify) 실패' })
            )
            return
        }

        res.status(200).json({
            userId: userInfo.nickname,
            accountId: userInfo.sub, // Challengermode accountId 추가
            linked: true,
        })
    } catch (error) {
        console.error('토너먼트 인증 에러:', error)
        res.status(400).json(createErrorRes({ msg: '토너먼트 인증 실패' }))
    }
}

export const signOutUserController = () => {}

// Intent game account linking을 위한 컨트롤러
export const verifyGameAccountController = async (
    req: Request<object, object, VerifyGameAccountRequest>,
    res: Response<VerifyGameAccountResponse | ErrorResponse>
) => {
    const { accountLinkingToken } = req.body

    if (!accountLinkingToken) {
        res.status(400).json(
            createErrorRes({ msg: '[accountLinkingToken] 필드 확인' })
        )
        return
    }

    try {
        // 1. JWT 토큰에서 사용자 정보 추출
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json(
                createErrorRes({ msg: '인증 토큰이 필요합니다' })
            )
            return
        }

        const token = authHeader.split(' ')[1]
        const user = verifyToken(token)

        if (!user || !user.userId) {
            res.status(401).json(
                createErrorRes({ msg: '유효하지 않은 토큰입니다' })
            )
            return
        }

        // 2. Challengermode Bot Access Token 획득
        const botAccessToken = await getBotAccessToken()

        // 3. Challengermode verify-game-account 엔드포인트 호출
        const verifyResponse = await fetch(
            `https://cm-stage-g.challengermode.com:2083/mk1/v1/game_integrations/${process.env.CHALLENGERMODE_GAME_INTEGRATION_ID}/link_account/verify`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${botAccessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameAccountReference: { accountId: user.userId },
                    accountLinkingToken: accountLinkingToken,
                    overrideExisting: true,
                }),
            }
        )

        if (!verifyResponse.ok) {
            const errorText = await verifyResponse.text()
            console.error('Challengermode 계정 연동 실패:', errorText)
            res.status(500).json(
                createErrorRes({
                    msg: 'Challengermode 계정 연동에 실패했습니다',
                })
            )
            return
        }

        const verifyResult = await verifyResponse.json()
        console.log('Challengermode 계정 연동 성공:', verifyResult)

        // 사용자 정보 조회 (challengermodeId로)
        const userInfo = await userService.getUserByChallengermodeId(
            user.userId
        )

        res.status(200).json({
            success: true,
            userId: userInfo?.nickName || user.nickName,
            accountId: userInfo?.challengermodeId || user.userId,
        })
    } catch (error) {
        console.error('게임 계정 인증 에러:', error)
        res.status(500).json(
            createErrorRes({ msg: '게임 계정 인증에 실패했습니다' })
        )
    }
}
