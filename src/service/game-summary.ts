import {
    BadgeItem,
    GetGameTotalRankSummaryResponse,
    RankColumnItem,
    RankRowItem,
} from 'controller/games.type'
import logRepository from '../db/redis/respository/log'
import roomService from './rooms'
import userService from './users'
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

    // Challengermode API용 게임 결과 생성
    async getChallengermodeGameResult(roomId: string) {
        const room = roomService.findGameRoomById(roomId)
        if (!room || !room.gameMap) return null

        console.log('=== Challengermode 게임 결과 생성 ===')
        console.log(
            'room.players:',
            room.players.map((p) => ({
                userId: p.userId,
                nickName: p.nickName,
                teamNumber: p.teamNumber,
            }))
        )
        console.log(
            'gameMap.characters:',
            room.gameMap.characters.map((c) => ({
                id: c.id,
                nickName: c.nickName,
            }))
        )

        const gameRecords = await this.getRankGameRecord(
            room.roomId,
            room.gameMap
        )

        // 각 플레이어의 결과 생성 (Challengermode 스키마에 맞춤)
        const competitorResults = await Promise.all(
            gameRecords.rows.map(async (row) => {
                // 플레이어 정보에서 teamNumber 가져오기 (userId로 정확히 매칭)
                const player = room.players.find((p) => p.userId === row.userId)

                console.log(
                    `게임 결과 생성 - userId: ${row.userId}, nickName: ${row.nickName}, 찾은 player:`,
                    player
                )

                // 콤보 수 계산 (더블 + 트리플 + 멀티플)
                const comboCount =
                    row.doubleCombos + row.tripleCombos + row.multipleCombos

                const teamNumber = player?.teamNumber || 1 // 저장된 teamNumber 사용 (기본값 1)

                console.log(
                    `최종 teamNumber 할당 - userId: ${row.userId}, teamNumber: ${teamNumber}`
                )

                // accountId 결정 (challengermodeId 우선, 없으면 userId 사용)
                let accountId = row.userId

                // player.accountId가 있으면 사용
                if (player?.accountId) {
                    accountId = player.accountId
                } else {
                    // accountId가 없으면 유저의 challengermodeId를 찾아서 사용
                    try {
                        const user = await userService.getUserByNickName(
                            row.nickName
                        )
                        if (user && user.challengermodeId) {
                            accountId = user.challengermodeId
                            console.log(
                                `유저 ${row.nickName}의 challengermodeId: ${accountId}`
                            )
                        }
                    } catch (error) {
                        console.warn(
                            `유저 ${row.nickName}의 challengermodeId를 찾을 수 없습니다:`,
                            error
                        )
                    }
                }

                return {
                    gameAccountReference: {
                        accountId: accountId,
                    },
                    result: {
                        GiftCount: row.gifts,
                        ComboCount: comboCount,
                    },
                }
            })
        )

        return {
            competitorResults,
        }
    }
}

const gameSummaryService = GameSummaryService.getInstance()

export default gameSummaryService
