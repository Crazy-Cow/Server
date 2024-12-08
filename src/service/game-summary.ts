import {
    BadgeItem,
    GetGameTotalRankSummaryResponse,
    RankColumnItem,
    RankRowItem,
} from 'controller/games.type'
import logRepository from '../db/redis/respository/log'
import roomService from './rooms'
import { Character } from '../game/objects/player'
import { CHARACTER_COLOR_PINK } from '../game/objects/player.constant'
import { BADGES } from './game-summary.util'
import { ItemType } from '../game/objects/item'
import { CommonMap } from '../game/maps'

class GameSummaryService {
    private static instance: GameSummaryService

    public static getInstance(): GameSummaryService {
        if (!this.instance) {
            this.instance = new GameSummaryService()
        }
        return this.instance
    }

    private getRankColumns() {
        const columns: RankColumnItem[] = [
            { field: 'rank', headerName: '순위', textAlign: 'center' },
            {
                field: 'charcterType',
                headerName: '캐릭터',
                textAlign: 'center',
            },
            { field: 'nickName', headerName: '닉네임', textAlign: 'left' },
            { field: 'badges', headerName: '뱃지', textAlign: 'left' },
            { field: 'gifts', headerName: '선물', textAlign: 'center' },
            {
                field: 'multipleCombos',
                headerName: '멀티플 콤보',
                textAlign: 'center',
            },
            {
                field: 'tripleCombos',
                headerName: '트리플',
                textAlign: 'center',
            },
            {
                field: 'doubleCombos',
                headerName: '더블',
                textAlign: 'center',
            },
            {
                field: 'accSteals',
                headerName: '누적 스틸',
                textAlign: 'center',
            },
        ]

        return columns
    }

    getMostUsedSkillUser(characters: Character[]) {
        let character = characters[0]
        let maxSkillCount = character.log.usedSkill

        for (const other of characters) {
            if (other.log.usedSkill > maxSkillCount) {
                character = other
                maxSkillCount = other.log.usedSkill
            }
        }

        return character
    }

    getMostUsedItems(characters: Character[]) {
        const mostUsedItemUsers: Record<
            ItemType,
            { userId: string; count: number }
        > = {
            [ItemType.BOOST]: { userId: '', count: 0 },
            [ItemType.SHIELD]: { userId: '', count: 0 },
            [ItemType.THUNDER]: { userId: '', count: 0 },
            [ItemType.GIFT]: { userId: '', count: 0 },
        }

        characters.forEach((character) => {
            Object.keys(character.log.usedItems).forEach((item) => {
                const itemType = Number(item) as ItemType
                const count = character.log.usedItems[itemType]
                if (count > mostUsedItemUsers[itemType].count) {
                    mostUsedItemUsers[itemType] = {
                        userId: character.id,
                        count,
                    }
                }
            })
        })

        return mostUsedItemUsers
    }

    private getBadges(character: Character, gameMap: CommonMap) {
        const characters = gameMap.characters

        const badges: BadgeItem[] = []
        if (character.charColor == CHARACTER_COLOR_PINK) {
            badges.push(BADGES['pink-princess'])
        }

        const mostUsedItemUsers = this.getMostUsedItems(characters)
        const mostUsedSkillUser = this.getMostUsedSkillUser(characters)

        if (mostUsedItemUsers[ItemType.BOOST].userId === character.id) {
            badges.push(BADGES['item-boost'])
        }
        if (mostUsedItemUsers[ItemType.SHIELD].userId === character.id) {
            badges.push(BADGES['item-shield'])
        }
        if (mostUsedItemUsers[ItemType.THUNDER].userId === character.id) {
            badges.push(BADGES['item-thunder'])
        }
        if (mostUsedItemUsers[ItemType.GIFT].userId === character.id) {
            badges.push(BADGES['item-gift'])
        }
        if (mostUsedSkillUser.id === character.id) {
            badges.push(BADGES['skill-lover'])
        }
        if (gameMap.getLogHighestCharacter().id === character.id) {
            badges.push(BADGES['the-highest'])
        }

        return badges
    }

    private get노력ChracterByRecords(
        gameRecords: {
            character: Character
            gifts: number
            accSteals: number
            doubleCombos: number
            tripleCombos: number
            multipleCombos: number
        }[]
    ) {
        const filtered = gameRecords.filter((record) => record.gifts === 0)

        if (filtered.length === 0) {
            return null
        }

        let maxAccStealsUser = filtered[0]
        for (const record of filtered) {
            if (record.accSteals > maxAccStealsUser.accSteals) {
                maxAccStealsUser = record
            }
        }

        return maxAccStealsUser.character
    }

    private async getRankGameRecord(
        roomId: string,
        gameMap: CommonMap
    ): Promise<GetGameTotalRankSummaryResponse> {
        const characters = gameMap.characters

        const promises = characters.map(async (character) => {
            const gifts = character.giftCnt
            const accSteals = await logRepository.getLogAccSteal(
                roomId,
                character.id
            )
            const doubleCombos = await logRepository.getDoubleCombos(
                roomId,
                character.id
            )
            const tripleCombos = await logRepository.getTripleCombos(
                roomId,
                character.id
            )
            const multipleCombos = await logRepository.getMultipleCombos(
                roomId,
                character.id
            )

            return {
                character,
                gifts,
                accSteals,
                doubleCombos,
                tripleCombos,
                multipleCombos,
            }
        })

        // Step 5: 각 후보들의 비교를 비동기적으로 처리
        const gameRecords = await Promise.all(promises)

        // Step 6: 순위 매기기
        const compareFields: (keyof RankRowItem)[] = [
            'gifts',
            'multipleCombos',
            'tripleCombos',
            'doubleCombos',
            'accSteals',
        ]

        gameRecords.sort((a, b) => {
            for (const field of compareFields) {
                if (b[field] !== a[field]) {
                    return b[field] - a[field]
                }
            }

            return 0
        })

        const 노력Character = this.get노력ChracterByRecords(gameRecords)

        const rows: RankRowItem[] = gameRecords.map((record, index) => {
            const {
                character,
                gifts,
                accSteals,
                doubleCombos,
                tripleCombos,
                multipleCombos,
            } = record

            const badges = this.getBadges(character, gameMap)

            if (노력Character && 노력Character.id === character.id) {
                badges.push(BADGES.fighting)
            }

            return {
                rank: index + 1,
                userId: character.id,
                badges,
                charcterType: character.charType,
                charcterColor: character.charColor,
                nickName: character.nickName,
                gifts,
                multipleCombos,
                tripleCombos,
                doubleCombos,
                accSteals,
            }
        })

        return {
            columns: this.getRankColumns(),
            rows,
        }
    }

    async getTotalRankSummary(
        roomId: string
    ): Promise<GetGameTotalRankSummaryResponse> {
        const room = roomService.findGameRoomById(roomId)
        if (!room || !room.gameMap) return null

        const result = await this.getRankGameRecord(room.roomId, room.gameMap)

        return result
    }
}

const gameSummaryService = GameSummaryService.getInstance()

export default gameSummaryService
