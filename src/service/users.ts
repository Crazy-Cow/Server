import util from './users.util'

export class User {
    userId: string

    nickName: string

    constructor(userId: string, nickName: string) {
        this.userId = userId
        this.nickName = nickName
    }
}

class UserPool {
    users: User[] = []
    tempNicknames: Map<string, string> = new Map()

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

    checkDuplicatedNickName(userId: string, nickName: string) {
        if (this.users.some((user) => user.nickName === nickName)) return true
        else if (this.tempNicknames.get(userId) == nickName) return false
        return Array.from(this.tempNicknames.values()).includes(nickName)
    }

    addTempNickname(userId: string, nickName: string) {
        this.tempNicknames.set(userId, nickName)
    }

    removeTempNickname(userId: string) {
        this.tempNicknames.delete(userId)
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
        this.userPool.removeTempNickname(userId)
        this.userPool.addUser(user)
        return user
    }

    removeUser(userId: string) {
        this.userPool.removeUser(userId)
    }

    checkDuplicatedNickName(userId: string, nickName: string) {
        return this.userPool.checkDuplicatedNickName(userId, nickName)
    }

    createTempNickname(userId: string): string {
        let nickName = util.generateGuestNickName()

        while (this.userPool.checkDuplicatedNickName(userId, nickName)) {
            nickName = util.generateGuestNickName()
        }

        this.userPool.addTempNickname(userId, nickName)
        return nickName
    }
}

const userService = UserService.getInstance()

export default userService
