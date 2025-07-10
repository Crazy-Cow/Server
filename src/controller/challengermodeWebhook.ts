import { Request, Response } from 'express'
import userService from '../service/users'

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
        console.log(
            'Challengermode webhook 요청:',
            JSON.stringify(req.body, null, 2)
        )

        const { data } = req.body
        const accountId = data?.gameAccountReference?.accountId

        console.log('추출된 accountId:', accountId)

        if (!accountId) {
            console.log('accountId가 없음')
            res.status(400).json({ error: 'Missing accountId' })
            return
        }

        const gameAccount = await getGameAccountInfo(accountId)
        console.log('조회된 gameAccount:', gameAccount)

        if (!gameAccount) {
            console.log('사용자를 찾을 수 없음')
            res.status(404).json({ error: 'User not found' })
            return
        }

        console.log('응답 전송:', gameAccount)
        res.json(gameAccount)
    } catch (error) {
        console.error('Webhook 에러:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}
