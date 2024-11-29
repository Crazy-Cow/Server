import { GetGamePersonalSummaryResponse } from 'controller/games.type'
import logRepository from '../db/redis/respository/log'
import roomService from './rooms'

class GameSummaryService {
    private static instance: GameSummaryService

    public static getInstance(): GameSummaryService {
        if (!this.instance) {
            this.instance = new GameSummaryService()
        }
        return this.instance
    }

    private convertPersonalSummary(props: {
        gifts: number
        accSteals: number
        doubleCombos: number
        tripleCombos: number
    }): GetGamePersonalSummaryResponse['summary'] {
        return [
            { label: '선물 보유 수', value: props.gifts },
            { label: '스틸 누적 수', value: props.accSteals },
            { label: '더블 콤보 수', value: props.doubleCombos },
            { label: '트리플 콤보 수', value: props.tripleCombos },
        ]
    }
    getPlayerInfo(roomId: string, userId: string) {
        const room = roomService.findGameRoomById(roomId)
        if (!room || !room.gameMap) return null
        const player = room.gameMap.findCharacter(userId)
        return player
    }

    async getPersonalSummary(roomId: string, userId: string) {
        // TODO: 예외처리) game.state = 'game.over' 확인 필요
        const player = this.getPlayerInfo(roomId, userId)
        if (!player) return null

        const gifts = player.giftCnt
        const accSteals = await logRepository.getLogAccSteal(roomId, userId)
        const doubleCombos = await logRepository.getDoubleCombos(roomId, userId)
        const tripleCombos = await logRepository.getTripleCombos(roomId, userId)

        const data = { gifts, accSteals, doubleCombos, tripleCombos }

        return this.convertPersonalSummary(data)
    }

    async getPersonalBadges(
        roomId: string,
        userId: string
    ): Promise<GetGamePersonalSummaryResponse['badges']> {
        console.log('TODO: getPersonalBadges', roomId, userId)
        return [
            {
                label: '높이 날기 선수',
                img: 'https://github.com/user-attachments/assets/e4f79980-2203-40f1-a898-3f3fa498abd2',
            },
        ]
    }
}

const gameSummaryService = GameSummaryService.getInstance()

export default gameSummaryService
