import { getBotAccessToken } from '../utils/challengermodeBotToken'

export type GameState = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface GameAccountReference {
    accountId: string
}

export interface GameTag {
    gameSessionId: string
    lobbyName?: string
    lobbyPassword?: string
}

export interface Competitor {
    gameAccountReference: GameAccountReference
    teamNumber?: number
    onlineStatus?: string
}

export interface CompetitorResult {
    gameAccountReference: GameAccountReference
    result: object
}

export interface LineupResult {
    teamNumber: number
    result: object
}

export interface GameResult {
    competitorResults?: CompetitorResult[]
    lineupResults?: LineupResult[]
    generalResults?: object
    isOvertime?: string
}

export interface GameSessionData {
    state: GameState
    gameTag: GameTag
    competitors: Competitor[]
    result?: GameResult
    dateStarted?: string
    dateEnded?: string
}

class ChallengermodeService {
    private gameIntegrationId: string
    private gameSessionId: string | null = null

    constructor() {
        this.gameIntegrationId =
            process.env.CHALLENGERMODE_GAME_INTEGRATION_ID || ''
        if (!this.gameIntegrationId) {
            throw new Error(
                'CHALLENGERMODE_GAME_INTEGRATION_ID 환경변수가 필요합니다'
            )
        }
    }

    setGameSessionId(sessionId: string) {
        this.gameSessionId = sessionId
    }

    private async callChallengermodeAPI(data: GameSessionData): Promise<void> {
        if (!this.gameSessionId) {
            console.warn('Game session ID가 설정되지 않았습니다')
            return
        }

        try {
            const accessToken = await getBotAccessToken()
            const url = `https://cm-stage-g.challengermode.com:2083/mk1/v1/game_integrations/${this.gameIntegrationId}/game_sessions/${this.gameSessionId}`

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(
                    `Challengermode API 호출 실패: ${response.status} - ${errorText}`
                )
            }

            console.log(`Challengermode API 호출 성공 - State: ${data.state}`)
            console.log(`GameSessionId: ${this.gameSessionId}`)
            console.log(`Request Payload:`, JSON.stringify(data, null, 2))
        } catch (error) {
            console.error('Challengermode API 호출 중 오류:', error)
        }
    }

    // 1 = Creating - 게임 세션 생성 시작
    async reportCreating(
        roomId: string,
        competitors: Competitor[]
    ): Promise<void> {
        const data: GameSessionData = {
            state: 1,
            gameTag: {
                gameSessionId: this.gameSessionId || roomId,
            },
            competitors,
        }
        await this.callChallengermodeAPI(data)
    }

    // 2 = Created - 게임 세션 생성 완료
    async reportCreated(
        roomId: string,
        competitors: Competitor[]
    ): Promise<void> {
        const data: GameSessionData = {
            state: 2,
            gameTag: {
                gameSessionId: this.gameSessionId || roomId,
            },
            competitors,
        }
        await this.callChallengermodeAPI(data)
    }

    // 3 = Starting - 게임 시작 준비
    async reportStarting(
        roomId: string,
        competitors: Competitor[]
    ): Promise<void> {
        const data: GameSessionData = {
            state: 3,
            gameTag: {
                gameSessionId: this.gameSessionId || roomId,
            },
            competitors,
        }
        await this.callChallengermodeAPI(data)
    }

    // 4 = Started - 게임 시작
    async reportStarted(
        roomId: string,
        competitors: Competitor[],
        dateStarted: string
    ): Promise<void> {
        const data: GameSessionData = {
            state: 4,
            gameTag: {
                gameSessionId: this.gameSessionId || roomId,
            },
            competitors,
            dateStarted,
        }
        await this.callChallengermodeAPI(data)
    }

    // 5 = Finished - 게임 종료
    async reportFinished(
        roomId: string,
        competitors: Competitor[],
        dateStarted: string,
        dateEnded: string,
        result?: GameResult
    ): Promise<void> {
        const data: GameSessionData = {
            state: 5,
            gameTag: {
                gameSessionId: this.gameSessionId || roomId,
            },
            competitors,
            result,
            dateStarted,
            dateEnded,
        }
        await this.callChallengermodeAPI(data)
    }

    // 6 = Cancelled - 게임 취소
    async reportCancelled(
        roomId: string,
        competitors: Competitor[]
    ): Promise<void> {
        const data: GameSessionData = {
            state: 6,
            gameTag: {
                gameSessionId: this.gameSessionId || roomId,
            },
            competitors,
        }
        await this.callChallengermodeAPI(data)
    }

    // 7 = Cancelling - 게임 취소 중
    async reportCancelling(
        roomId: string,
        competitors: Competitor[]
    ): Promise<void> {
        const data: GameSessionData = {
            state: 7,
            gameTag: {
                gameSessionId: this.gameSessionId || roomId,
            },
            competitors,
        }
        await this.callChallengermodeAPI(data)
    }
}

const challengermodeService = new ChallengermodeService()

export default challengermodeService
