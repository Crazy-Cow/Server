import userService from './users'

jest.mock('./users.util', () => ({
    generateGuestNickName: jest.fn(() => 'GUEST-0001'),
}))

describe('UserService', () => {
    beforeEach(() => {
        ;(userService as any)['userPool'].users = []
    })

    it('닉네임 지정', () => {
        const user = userService.createUser('user1', 'TestUser')
        expect(user.nickName).toBe('TestUser')
        expect(userService.findUserById('user1')).toEqual(user)
    })

    it('닉네임 미지정 - 랜덤 생성', () => {
        const user = userService.createUser('user1', '')
        expect(user.nickName).toBe('GUEST-0001')
        expect(userService.findUserById('user1')).toEqual(user)
    })

    it('닉네임 중복 확인', () => {
        userService.createUser('user1', 'DuplicateNick')
        expect(userService.checkDuplicatedNickName('DuplicateNick')).toBe(true)
        expect(userService.checkDuplicatedNickName('UniqueNick')).toBe(false)
    })

    it('유저 목록에서 제거', () => {
        const user = userService.createUser('user1', 'RemovableUser')
        ;(userService as any)['userPool'].removeUser(user.userId)
        expect(userService.findUserById('user1')).toBeUndefined()
    })
})
