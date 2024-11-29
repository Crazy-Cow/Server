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
            { label: '선물 보유 수', value: props.gifts, img: 'TODO' },
            { label: '스틸 누적 수', value: props.accSteals, img: 'TODO' },
            { label: '더블 콤보 수', value: props.doubleCombos, img: 'TODO' },
            { label: '트리플 콤보 수', value: props.tripleCombos, img: 'TODO' },
        ]
    }

    async getPersonalSummary(roomId: string, userId: string) {
        // TODO: 예외처리) game.state = 'game.over' 확인 필요
        const room = roomService.findGameRoomById(roomId)
        if (!room || !room.gameMap) return null

        const player = room.gameMap.findCharacter(userId)
        if (!player) return null

        const gifts = player.giftCnt
        const accSteals = await logRepository.getLogAccSteal(roomId, userId)
        const doubleCombos = await logRepository.getDoubleCombos(roomId, userId)
        const tripleCombos = await logRepository.getTripleCombos(roomId, userId)

        const data = { gifts, accSteals, doubleCombos, tripleCombos }

        return this.convertPersonalSummary(data)
    }

    async getPersonalBadges(roomId: string, userId: string) {
        console.log('TODO: getPersonalBadges', roomId, userId)
        return []
    }
}

const gameSummaryService = GameSummaryService.getInstance()

export default gameSummaryService
