// 대기 중인 세션을 관리하는 서비스
class PendingSessionService {
    private pendingSessions: Map<
        string,
        {
            gameSessionId: string
            createdAt: Date
            roomId?: string
        }
    > = new Map()

    // 세션을 대기 목록에 추가
    addPendingSession(sessionId: string, roomId?: string) {
        this.pendingSessions.set(sessionId, {
            gameSessionId: sessionId,
            createdAt: new Date(),
            roomId,
        })
        console.log(`대기 세션 추가: sessionId=${sessionId}`)
    }

    // 세션을 대기 목록에서 제거
    removePendingSession(sessionId: string) {
        const removed = this.pendingSessions.delete(sessionId)
        if (removed) {
            console.log(`대기 세션 제거: sessionId=${sessionId}`)
        }
        return removed
    }

    // 대기 세션 조회
    getPendingSession(sessionId: string) {
        return this.pendingSessions.get(sessionId)
    }

    // gameSessionId로 대기 세션 조회
    getPendingSessionByGameSessionId(gameSessionId: string) {
        for (const [sessionId, session] of this.pendingSessions.entries()) {
            if (session.gameSessionId === gameSessionId) {
                return { sessionId, ...session }
            }
        }
        return null
    }

    // 오래된 세션 정리 (30분 이상 된 세션)
    cleanupOldSessions() {
        const now = new Date()
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

        for (const [sessionId, session] of this.pendingSessions.entries()) {
            if (session.createdAt < thirtyMinutesAgo) {
                this.pendingSessions.delete(sessionId)
                console.log(`오래된 대기 세션 정리: sessionId=${sessionId}`)
            }
        }
    }
}

// 싱글톤 인스턴스
const pendingSessionService = new PendingSessionService()

// 30분마다 오래된 세션 정리
setInterval(
    () => {
        pendingSessionService.cleanupOldSessions()
    },
    30 * 60 * 1000
)

export default pendingSessionService
