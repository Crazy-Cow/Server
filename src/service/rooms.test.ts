import { User } from './users'
import roomService from './rooms'

describe('RoomService', () => {
    let user1: User
    let user2: User
    let user3: User
    let user4: User

    beforeEach(() => {
        user1 = new User('user1', 'Player1')
        user2 = new User('user2', 'Player2')
        user3 = new User('user3', 'Player3')
        user4 = new User('user4', 'Player4')
        roomService.roomPool.waitingRoom.players = []
        roomService.roomPool.waitingRoom.state = 'waiting'
    })

    it('유저 입장 후 대기실 진입', () => {
        roomService.joinRoom(user1)
        expect(roomService.roomPool.waitingRoom.players).toContain(user1)
    })

    it('유저 입장 후 나가기', () => {
        roomService.joinRoom(user1)
        roomService.leaveRoom(user1.userId)
        expect(roomService.roomPool.waitingRoom.players).not.toContain(user1)
    })

    it('대기실 게임 시작 불가능', () => {
        roomService.joinRoom(user1)
        roomService.joinRoom(user2)
        const waitingRoom = roomService.roomPool.waitingRoom
        expect(waitingRoom.canStartGame()).toBe(false)
        expect(waitingRoom.state).toBe('waiting')
    })

    it('대기실 풀방이면, 게임 시작', () => {
        const waitingRoom = roomService.roomPool.waitingRoom
        for (let i = 0; i < waitingRoom.maxPlayerCnt; i++) {
            roomService.joinRoom(new User(`user${i + 1}`, `Player${i + 1}`))
        }

        expect(waitingRoom.canStartGame()).toBe(true)
        expect(waitingRoom.state).toBe('playing')
    })

    it('대기실 최대 수용인원 꽉차면, 게임 시작 후 새 대기실 생성', () => {
        const waitingRoom = roomService.roomPool.waitingRoom

        for (let i = 0; i < waitingRoom.maxPlayerCnt; i++) {
            roomService.joinRoom(new User(`user${i + 1}`, `Player${i + 1}`))
        }

        expect(waitingRoom.state).toBe('playing')
        const newWaitingRoom = roomService.roomPool.waitingRoom
        expect(newWaitingRoom).not.toBe(waitingRoom)
    })

    it('대기실 최소 인원 만족 && 최대 대기 시간 지나면, 게임 시작', () => {
        const waitingRoom = roomService.roomPool.waitingRoom
        const fakeMaxWaitingTime = 5
        waitingRoom.maxWaitingTime = fakeMaxWaitingTime
        jest.useFakeTimers()

        for (let i = 0; i < waitingRoom.minPlayerCnt; i++) {
            roomService.joinRoom(new User(`user${i + 1}`, `Player${i + 1}`))
        }

        expect(waitingRoom.canStartGame()).toBe(false)
        jest.advanceTimersByTime(fakeMaxWaitingTime * 1000)
        expect(waitingRoom.canStartGame()).toBe(true)

        jest.useRealTimers()
    })
})
