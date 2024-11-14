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

    getUsers() {
        return this.users
    }

    checkDuplicatedNickName(nickName: string) {
        return this.users.some((user) => user.nickName === nickName)
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
        let updatedNickName = nickName
        if (updatedNickName == '') {
            updatedNickName = util.generateGuestNickName()

            while (this.userPool.checkDuplicatedNickName(updatedNickName)) {
                // TODO: 9999명 이상 접속 시 무한 루프
                updatedNickName = util.generateGuestNickName()
            }
        }

        const user = new User(userId, updatedNickName)
        this.userPool.addUser(user)

        return user
    }

    removeUser(userId: string) {
        this.userPool.removeUser(userId)
    }

    checkDuplicatedNickName(nickName: string) {
        return this.userPool.checkDuplicatedNickName(nickName)
    }
}

const userService = UserService.getInstance()

export default userService
