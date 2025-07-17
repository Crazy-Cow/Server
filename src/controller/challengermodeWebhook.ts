import { Request, Response } from 'express'
import crypto from 'crypto'
import userService from '../service/users'
import roomService, { Room, Player } from '../service/rooms'
import gameSummaryService from '../service/game-summary'
import pendingSessionService from '../service/pending-sessions'

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

const getWaitingRoom = (challengermodeGameSessionId: string) => {
    let waitingRoom = roomService.findWaitingRoomByGameSessionId(
        challengermodeGameSessionId
    )

    // NOTE: 이 로직의 필요성에 대해 나중에 다시 생각해봐야함
    if (!waitingRoom) {
        // 2. gameSessionId가 없는 기존 대기실이 있는지 확인
        const existingWaitingRoom = roomService.roomPool.waitingRoom
        if (existingWaitingRoom.players.length > 0) {
            // 기존 대기실에 플레이어들이 있으면 그 대기실 사용
            waitingRoom = existingWaitingRoom
            waitingRoom.gameSessionId = challengermodeGameSessionId
            waitingRoom.isChallengermodeGame = true // KEM 게임 표시
            console.log(
                `기존 대기실을 KEM 게임으로 설정: gameSessionId=${challengermodeGameSessionId}, 기존 플레이어 수=${waitingRoom.players.length}`
            )
        } else {
            // 대기실이 없으면 새로 생성
            waitingRoom = new Room({})
            waitingRoom.gameSessionId = challengermodeGameSessionId
            waitingRoom.isChallengermodeGame = true // KEM 게임 표시
            roomService.roomPool.waitingRoom = waitingRoom
            console.log(
                `새로운 KEM 대기실 생성: gameSessionId=${challengermodeGameSessionId}`
            )
        }
    }
    return waitingRoom
}

// Challengermode create-game-session webhook 핸들러
export async function challengermodeCreateGameSessionWebhook(
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
        console.log('=== Challengermode Create Game Session Webhook 요청 ===')

        const { data } = req.body

        const { challengermodeGameSessionId, competitors } = data

        // 게임 세션 생성 로직
        // 1. gameSessionId로 대기실 찾기
        const waitingRoom = getWaitingRoom(challengermodeGameSessionId)

        // 3. 기존 플레이어들과 Challengermode 정보 매핑
        console.log(
            '기존 대기실 플레이어들:',
            waitingRoom.players.map((p) => ({
                userId: p.userId,
                nickName: p.nickName,
                teamNumber: p.teamNumber,
            }))
        )

        if (competitors && competitors.length > 0) {
            // 기존 플레이어가 있으면 매핑, 없으면 새로 생성
            if (waitingRoom.players.length > 0) {
                // 기존 플레이어들에게 Challengermode 정보 매핑
                const challengermodePlayerMap = new Map()
                competitors.forEach((competitor, index) => {
                    const accountId = competitor.gameAccountReference?.accountId
                    const teamNumber = competitor.teamNumber

                    if (accountId) {
                        challengermodePlayerMap.set(accountId, {
                            accountId,
                            teamNumber:
                                typeof teamNumber === 'string'
                                    ? parseInt(teamNumber, 10)
                                    : teamNumber !== undefined
                                      ? teamNumber
                                      : index,
                        })
                    }
                })

                const existingPlayers = waitingRoom.players
                existingPlayers.forEach((existingPlayer, index) => {
                    let challengermodeInfo = null

                    // 1. accountId로 직접 매칭
                    if (existingPlayer.accountId) {
                        challengermodeInfo = challengermodePlayerMap.get(
                            existingPlayer.accountId
                        )
                    }

                    // 2. userId로 매칭
                    if (
                        !challengermodeInfo &&
                        challengermodePlayerMap.has(existingPlayer.userId)
                    ) {
                        challengermodeInfo = challengermodePlayerMap.get(
                            existingPlayer.userId
                        )
                    }

                    if (challengermodeInfo) {
                        existingPlayer.teamNumber =
                            challengermodeInfo.teamNumber
                        existingPlayer.accountId = challengermodeInfo.accountId
                        console.log(
                            `✅ 기존 플레이어 ${existingPlayer.nickName}에게 매핑: teamNumber=${challengermodeInfo.teamNumber}, accountId=${challengermodeInfo.accountId}`
                        )
                    } else {
                        existingPlayer.teamNumber = index
                        console.log(
                            `⚠️ 기존 플레이어 ${existingPlayer.nickName}에게 기본값 할당: teamNumber=${index}`
                        )
                    }
                })
            } else {
                // 기존 플레이어가 없으면 competitors 정보로 새로 생성
                console.log(
                    '기존 플레이어가 없어서 competitors 정보로 새로 생성'
                )

                competitors.forEach((competitor, index) => {
                    const accountId = competitor.gameAccountReference?.accountId
                    const teamNumber = competitor.teamNumber

                    if (accountId) {
                        // 임시 플레이어 생성 (나중에 클라이언트 연결 시 실제 플레이어로 교체)
                        const tempPlayer = new Player({
                            userId: `Player_${index + 1}`, // nickName과 같게 설정 (웹훅용)
                            nickName: `Player_${index + 1}`, // 임시 닉네임
                            isGuest: false,
                            teamNumber:
                                typeof teamNumber === 'string'
                                    ? parseInt(teamNumber, 10)
                                    : teamNumber !== undefined
                                      ? teamNumber
                                      : index,
                            accountId: accountId,
                        })

                        // 기본 캐릭터 타입 설정 (Unknown character type 에러 방지)
                        tempPlayer.updateCharType(1) // RABBIT

                        waitingRoom.addPlayer(tempPlayer)
                        console.log(
                            `✅ 임시 플레이어 생성: accountId=${accountId}, teamNumber=${tempPlayer.teamNumber}, nickName=${tempPlayer.nickName}`
                        )
                    }
                })
            }

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

        // 4. sessionId를 대기 목록에 추가 (클라이언트 연결 대기)
        pendingSessionService.addPendingSession(
            challengermodeGameSessionId,
            challengermodeGameSessionId,
            waitingRoom.roomId
        )

        // 5. 기존 startGame 로직과 동일하게 게임 시작
        await roomService.startGame(waitingRoom)

        // 6. 응답 생성 (GameSession 형태)
        const response = {
            state: 2, // Created (게임 세션 생성 완료)
            gameTag: {
                gameSessionId: challengermodeGameSessionId,
            },
            competitors: waitingRoom.players.map((player) => ({
                gameAccountReference: {
                    accountId: player.accountId || player.userId, // accountId가 있으면 사용, 없으면 userId 사용
                },
                teamNumber: player.teamNumber, // 할당된 teamNumber 사용
            })),
            dateStarted: new Date().toISOString(),
        }

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
