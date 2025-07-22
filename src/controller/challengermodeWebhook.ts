import { Request, Response } from 'express'
import crypto from 'crypto'
import userService from '../service/users'
import roomService, { Room, Player } from '../service/rooms'
import gameSummaryService from '../service/game-summary'
import pendingSessionService from '../service/pending-sessions'

type Competitor = {
    gameAccountReference?: {
        accountId: string
    }
    teamNumber?: number | string
}

type ChallengermodeInfo = {
    accountId: string
    teamNumber: number
}

// HMAC 인증 함수
function verifyHMAC(req: Request): boolean {
    try {
        const psk = process.env.CHALLENGERMODE_HMAC
        if (!psk) {
            console.error('CHALLENGERMODE_HMAC 환경변수가 설정되지 않았습니다')
            return false
        }

        // 1. Content hash 계산
        const body = JSON.stringify(req.body)
        const computedChecksum = crypto
            .createHash('sha256')
            .update(body)
            .digest('base64')

        // 2. Timestamp 가져오기 (대소문자 구분 없이)
        const timestamp = (req.headers['cm-date'] ||
            req.headers['Cm-Date']) as string
        if (!timestamp) {
            console.error('Cm-Date 헤더가 없습니다')
            return false
        }

        // 3. Authority (host) 가져오기
        const authority = req.headers.host || 'localhost:8000'

        // 4. String to sign 생성
        const stringToSign = `${req.method}\n${req.path}\n${timestamp};${authority};${computedChecksum}`

        // 5. HMAC 서명 계산
        const computedSignature = crypto
            .createHmac('sha256', psk)
            .update(stringToSign)
            .digest('base64')

        // 6. Authorization 헤더에서 서명 추출
        const authHeader = req.headers.authorization
        if (!authHeader) {
            console.error('Authorization 헤더가 없습니다')
            return false
        }

        // HMAC-SHA256 KeyId=...;Signature= 형식 파싱
        const signatureMatch = authHeader.match(/Signature=([^;]+)/)
        if (!signatureMatch) {
            console.error('Authorization 헤더에서 Signature를 찾을 수 없습니다')
            return false
        }

        const claimedSignature = signatureMatch[1]

        // 7. 서명 비교
        if (claimedSignature !== computedSignature) {
            console.error('HMAC 서명이 일치하지 않습니다')
            return false
        }

        // Timestamp 유효성 검사 (5분 이내)
        const requestTime = new Date(timestamp)
        const now = new Date()
        const timeDiff = Math.abs(now.getTime() - requestTime.getTime())
        const maxAge = 5 * 60 * 1000 // 5분

        if (timeDiff > maxAge) {
            console.error('Timestamp가 너무 오래되었습니다')
            return false
        }

        // Content-SHA256 헤더 검증 (대소문자 구분 없이)
        const claimedChecksum = (req.headers['content-sha256'] ||
            req.headers['Content-SHA256']) as string
        if (claimedChecksum && claimedChecksum !== computedChecksum) {
            console.error('Content-SHA256이 일치하지 않습니다')
            return false
        }

        return true
    } catch (error) {
        console.error('HMAC 검증 중 오류:', error)
        return false
    }
}

// 실제 DB에서 계정 정보를 조회하는 함수
async function getGameAccountInfo(accountId: string) {
    try {
        // MongoDB에서 challengermodeId로 사용자 정보 조회
        const user = await userService.getUserByChallengermodeId(accountId)

        if (!user) {
            return null // 사용자를 찾을 수 없는 경우
        }

        return {
            gameAccountReference: { accountId },
            displayName: user.nickName,
            profileImageUrl: user.pictureUrl, // 저장된 이미지 URL 또는 기본 이미지
        }
    } catch (error) {
        console.error('사용자 정보 조회 실패:', error)
        return null
    }
}

// Challengermode API에서 사용자 정보 조회 (Bot access token 사용)
async function getChallengermodeUserInfo(accountId: string) {
    try {
        // Bot access token으로는 특정 사용자 정보를 조회할 수 없으므로
        // accountId를 nickname으로 사용하고, 나중에 OAuth 로그인 시 실제 정보로 업데이트
        return {
            accountId: accountId,
            nickname: `User_${accountId.slice(-8)}`, // accountId의 마지막 8자리 사용
            profileImageUrl: null,
        }
    } catch (error) {
        console.error('Challengermode 사용자 정보 조회 실패:', error)
        return null
    }
}

// Challengermode get-game-account webhook 핸들러
export async function challengermodeGameAccountWebhook(
    req: Request,
    res: Response
) {
    try {
        // HMAC 인증 확인
        if (!verifyHMAC(req)) {
            console.log('HMAC 인증 실패')
            res.status(401).json({
                title: 'Unauthorized',
                status: 401,
                detail: 'Invalid HMAC signature',
            })
            return
        }
        console.log('=== Challengermode Get Game Account Webhook 요청 ===')

        const { data } = req.body
        const accountId = data?.gameAccountReference?.accountId

        if (!accountId) {
            console.log('accountId가 없음')
            res.status(400).json({ error: 'Missing accountId' })
            return
        }

        const gameAccount = await getGameAccountInfo(accountId)

        if (!gameAccount) {
            console.log('사용자를 찾을 수 없음')
            res.status(404).json({ error: 'User not found' })
            return
        }

        res.json(gameAccount)
    } catch (error) {
        console.error('Webhook 에러:', error)
        res.status(500).json({ error: 'Internal server error' })
        return
    }
}

// Helper functions for challengermodeCreateGameSessionWebhook
function getWaitingRoom(challengermodeGameSessionId: string) {
    return roomService.findWaitingRoomByGameSessionId(
        challengermodeGameSessionId
    )
}

function parseTeamNumber(
    teamNumber: number | string | undefined,
    index: number
): number {
    if (typeof teamNumber === 'string') {
        return parseInt(teamNumber, 10)
    }
    return teamNumber !== undefined ? teamNumber : index
}

function createChallengermodePlayerMap(
    competitors: Competitor[]
): Map<string, ChallengermodeInfo> {
    const challengermodePlayerMap = new Map()

    competitors.forEach((competitor, index) => {
        const accountId = competitor.gameAccountReference?.accountId
        const teamNumber = competitor.teamNumber

        if (accountId) {
            challengermodePlayerMap.set(accountId, {
                accountId,
                teamNumber: parseTeamNumber(teamNumber, index),
            })
        }
    })

    return challengermodePlayerMap
}

function findChallengermodeInfo(
    existingPlayer: Player,
    challengermodePlayerMap: Map<string, ChallengermodeInfo>
): ChallengermodeInfo | null {
    // 1. accountId로 직접 매칭
    if (existingPlayer.accountId) {
        const info = challengermodePlayerMap.get(existingPlayer.accountId)
        if (info) return info
    }

    // 2. userId로 매칭
    return challengermodePlayerMap.get(existingPlayer.userId) || null
}

function assignChallengermodeInfo(
    existingPlayer: Player,
    challengermodeInfo: ChallengermodeInfo
) {
    existingPlayer.teamNumber = challengermodeInfo.teamNumber
    existingPlayer.accountId = challengermodeInfo.accountId
    console.log(
        `✅ 기존 플레이어 ${existingPlayer.nickName}에게 매핑: teamNumber=${challengermodeInfo.teamNumber}, accountId=${challengermodeInfo.accountId}`
    )
}

function assignDefaultTeamNumber(existingPlayer: Player, index: number) {
    existingPlayer.teamNumber = index
    console.log(
        `⚠️ 기존 플레이어 ${existingPlayer.nickName}에게 기본값 할당: teamNumber=${index}`
    )
}

async function createTempPlayer(
    accountId: string,
    teamNumber: number | string | undefined,
    index: number
): Promise<Player> {
    const userInfo = await getChallengermodeUserInfo(accountId)
    const tempPlayer = new Player({
        userId: userInfo?.nickname || `Player_${index + 1}`,
        nickName: userInfo?.nickname || `Player_${index + 1}`,
        isGuest: false,
        teamNumber: parseTeamNumber(teamNumber, index),
        accountId: accountId,
    })
    // NOTE: 임시로 RABBIT 캐릭터로 설정
    tempPlayer.updateCharType(1) // RABBIT
    return tempPlayer
}

function logExistingPlayers(waitingRoom: Room) {
    console.log(
        '기존 대기실 플레이어들:',
        waitingRoom.players.map((p) => ({
            userId: p.userId,
            nickName: p.nickName,
            teamNumber: p.teamNumber,
        }))
    )
}

function logMappedPlayers(waitingRoom: Room) {
    console.log(
        '매핑 후 플레이어들:',
        waitingRoom.players.map((p) => ({
            userId: p.userId,
            nickName: p.nickName,
            teamNumber: p.teamNumber,
            accountId: p.accountId,
        }))
    )
}

async function createNewPlayersFromCompetitors(
    waitingRoom: Room,
    competitors: Competitor[]
) {
    for (const [index, competitor] of competitors.entries()) {
        const accountId = competitor.gameAccountReference?.accountId
        const teamNumber = competitor.teamNumber

        if (accountId) {
            const tempPlayer = await createTempPlayer(
                accountId,
                teamNumber,
                index
            )
            waitingRoom.addPlayer(tempPlayer)
        }
    }
}

async function mapExistingPlayers(
    waitingRoom: Room,
    competitors: Competitor[]
) {
    const challengermodePlayerMap = createChallengermodePlayerMap(competitors)
    const existingPlayers = waitingRoom.players

    existingPlayers.forEach((existingPlayer, index) => {
        const challengermodeInfo = findChallengermodeInfo(
            existingPlayer,
            challengermodePlayerMap
        )

        if (challengermodeInfo) {
            assignChallengermodeInfo(existingPlayer, challengermodeInfo)
        } else {
            assignDefaultTeamNumber(existingPlayer, index)
        }
    })
}

async function handleCompetitorsMapping(
    waitingRoom: Room,
    competitors: Competitor[]
) {
    if (!competitors || competitors.length === 0) return

    logExistingPlayers(waitingRoom)

    if (waitingRoom.players.length > 0) {
        // 대기실에 기존 플레이어가 있는 경우 - KEM 버튼으로 들어갔을 시
        await mapExistingPlayers(waitingRoom, competitors)
    } else {
        // LaunchGame으로 호출 시 - 대기실에 기존 플레이어가 없음
        await createNewPlayersFromCompetitors(waitingRoom, competitors)
    }

    logMappedPlayers(waitingRoom)
}

async function setupPendingSession(
    challengermodeGameSessionId: string,
    waitingRoom: Room
) {
    pendingSessionService.addPendingSession(
        challengermodeGameSessionId,
        waitingRoom.roomId
    )
}

function createGameSessionResponse(
    waitingRoom: Room,
    challengermodeGameSessionId: string
) {
    return {
        state: 2, // Created (게임 세션 생성 완료)
        gameTag: {
            gameSessionId: challengermodeGameSessionId,
        },
        competitors: waitingRoom.players.map((player) => ({
            gameAccountReference: {
                accountId: player.accountId || player.userId,
            },
            teamNumber: player.teamNumber,
        })),
        dateStarted: new Date().toISOString(),
    }
}

export async function challengermodeCreateGameSessionWebhook(
    req: Request,
    res: Response
) {
    try {
        if (!verifyHMAC(req)) {
            console.log('HMAC 인증 실패')
            return res.status(401).json({
                title: 'Unauthorized',
                status: 401,
                detail: 'Invalid HMAC signature',
            })
        }

        console.log('=== Challengermode Create Game Session Webhook 요청 ===')

        const { data } = req.body
        const { challengermodeGameSessionId, competitors } = data

        let waitingRoom = getWaitingRoom(challengermodeGameSessionId)

        // waitingRoom이 null이면 새로운 대기실 생성
        if (!waitingRoom) {
            console.log(
                `새로운 대기실 생성: gameSessionId=${challengermodeGameSessionId}`
            )
            waitingRoom = new Room({})
            waitingRoom.gameSessionId = challengermodeGameSessionId
            waitingRoom.isChallengermodeGame = true
            roomService.roomPool.waitingRoom = waitingRoom
        } else {
            // 기존 대기실이 있으면 플레이어 목록 초기화 (중복 방지)
            console.log(
                `기존 대기실 사용: gameSessionId=${challengermodeGameSessionId}, 기존 플레이어 수=${waitingRoom.players.length}`
            )
            waitingRoom.players = [] // 플레이어 목록 초기화
        }

        await handleCompetitorsMapping(waitingRoom, competitors)
        await setupPendingSession(challengermodeGameSessionId, waitingRoom)
        await roomService.startGame(waitingRoom)

        const response = createGameSessionResponse(
            waitingRoom,
            challengermodeGameSessionId
        )
        console.log('게임 세션 생성 응답:', response)
        res.json(response)
    } catch (error) {
        console.error('Create game session webhook 에러:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

// Challengermode get-game-session webhook 핸들러
export async function challengermodeGetGameSessionWebhook(
    req: Request,
    res: Response
) {
    try {
        // HMAC 인증 확인
        if (!verifyHMAC(req)) {
            console.log('HMAC 인증 실패')
            res.status(401).json({
                type: 'https://www.challengermode.com/developers/docs/error-codes#401',
                title: 'Unauthorized',
                status: 401,
                detail: 'Invalid HMAC signature',
            })
            return
        }

        console.log('=== Challengermode Get Game Session Webhook 요청 ===')
        console.log('전체 요청 body:', JSON.stringify(req.body, null, 2))
        console.log('요청 headers:', JSON.stringify(req.headers, null, 2))
        console.log('요청 method:', req.method)
        console.log('요청 path:', req.path)

        const { action, data } = req.body

        // action이 GetGameSession(4)인지 확인
        if (action !== 4) {
            console.log('잘못된 action:', action)
            res.status(400).json({
                type: 'https://www.challengermode.com/developers/docs/error-codes#10012',
                title: 'ValidationError',
                status: 400,
                detail: 'Invalid action value',
            })
            return
        }

        const { gameSessionId } = data

        console.log('=== 파싱된 데이터 ===')
        console.log('action:', action)
        console.log('gameSessionId:', gameSessionId)

        // 게임 세션 조회 로직
        // 1. gameSessionId로 게임 세션 찾기 (게임 중인 방 + 대기실)
        let gameRoom = roomService.roomPool.gameRooms.find(
            (room) => room.gameSessionId === gameSessionId
        )

        // 게임 중인 방에서 찾지 못하면 대기실에서 찾기
        if (!gameRoom) {
            gameRoom = roomService.findWaitingRoomByGameSessionId(gameSessionId)
        }

        if (!gameRoom) {
            console.log('게임 세션을 찾을 수 없음:', gameSessionId)
            res.status(404).json({
                type: 'https://www.challengermode.com/developers/docs/error-codes#404',
                title: 'NotFound',
                status: 404,
                detail: 'Game session not found',
            })
            return
        }

        // 2. 게임 상태에 따른 응답 생성
        let state: number
        let result = undefined
        let dateEnded = undefined

        switch (gameRoom.state) {
            case 'initial':
                state = 1 // Creating
                break
            case 'waiting':
                state = 2 // Created
                break
            case 'playing':
                state = 4 // Started
                break
            case 'gameOver':
                state = 5 // Finished
                // 게임 결과 생성
                result = await gameSummaryService.getChallengermodeGameResult(
                    gameRoom.roomId
                )
                dateEnded = new Date().toISOString()
                break
            default:
                state = 2 // Created
        }

        const response = {
            state,
            gameTag: {
                gameSessionId: gameRoom.gameSessionId || gameRoom.roomId,
            },
            competitors: gameRoom.players.map((player) => ({
                gameAccountReference: {
                    accountId: player.accountId || player.userId, // accountId가 있으면 사용, 없으면 userId 사용
                },
                teamNumber: player.teamNumber, // 할당된 teamNumber 사용
            })),
            result,
            dateStarted: gameRoom.dateStarted || new Date().toISOString(),
            dateEnded,
        }

        console.log('게임 세션 조회 응답:', response)
        res.json(response)
    } catch (error) {
        console.error('Get game session webhook 에러:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}
