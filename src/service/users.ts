import util from './users.util'

export class User {
    userId: string // accessToken
    nickName: string
    roomId: string

    constructor(userId: string, nickName: string) {
        this.userId = userId
        this.nickName = nickName
    }

    updateRoomId = (roomId: string) => {
        this.roomId = roomId
    }
    resetRoomId = () => {
        this.roomId = undefined
    }
}

class UserPool {
    users: User[] = []

    getUsers() {
        return this.users
    }

    findUserById(userId: string): User | undefined {
        return this.users.find((user) => user.userId === userId)
    }

    addUser(user: User) {
        this.users.push(user)
    }

    removeUser(userId: string) {
        this.users = this.users.filter((user) => user.userId !== userId)
    }

    checkDuplicatedNickName(nickName: string) {
        return this.users.some((user) => user.nickName === nickName)
    }
}

class UserService {
    private userPool: UserPool

    private constructor() {
        this.userPool = new UserPool()
    }

    private static instance: UserService

    public static getInstance(): UserService {
        if (!this.instance) {
            this.instance = new UserService()
        }
        return this.instance
    }

    findUserById(userId: string) {
        return this.userPool.findUserById(userId)
    }

    createUser(userId: string, nickName: string) {
        const user = new User(userId, nickName)
        this.userPool.addUser(user)
        return user
    }

    removeUser(userId: string) {
        this.userPool.removeUser(userId)
    }

    checkDuplicatedNickName(nickName: string) {
        return this.userPool.checkDuplicatedNickName(nickName)
    }

    createTempNickname(): string {
        let nickName = util.generateGuestNickName()

        while (this.userPool.checkDuplicatedNickName(nickName)) {
            nickName = util.generateGuestNickName()
        }

        // TODO: 임시 발급된 닉네임 중복 위험
        // this.userPool.addTempNickname(nickName)
        return nickName
    }
}

const userService = UserService.getInstance()

export default userService
