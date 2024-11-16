import userService from './users'

jest.mock('./users.util', () => ({
    generateGuestNickName: jest.fn(() => 'GUEST-0001'),
}))

describe('UserService', () => {
    beforeEach(() => {
        ;(userService as any)['userPool'].users = []
        ;(userService as any)['userPool'].tempNicknames = new Map()
    })

    it('닉네임 지정', () => {
        const user = userService.createUser('user1', 'TestUser')
        expect(user.nickName).toBe('TestUser')
        expect(userService.findUserById('user1')).toEqual(user)
    })

    it('유저 목록에 추가', () => {
        const user = userService.createUser('user1', 'TestUser')
        expect(user.nickName).toBe('TestUser')
        expect(userService.findUserById('user1')).toEqual(user)
    })

    it('유저 목록에서 제거', () => {
        const user = userService.createUser('user1', 'RemovableUser')
        ;(userService as any)['userPool'].removeUser(user.userId)
        expect(userService.findUserById('user1')).toBeUndefined()
    })

    it('임시 닉네임 중복 확인', () => {
        userService.createTempNickname('user1')
        expect(userService.checkDuplicatedNickName('user1', 'GUEST-0001')).toBe(
            false
        )
        expect(userService.checkDuplicatedNickName('user2', 'GUEST-0001')).toBe(
            true
        )
    })
})
