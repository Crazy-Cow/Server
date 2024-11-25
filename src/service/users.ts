export class User {
    userId: string
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
        if (this.users.some((user) => user.nickName === nickName)) return true
    }
}

class UserService {
    private userPool: UserPool
    private idCounter: number = 1

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

    private generateUserId(): string {
        const userId = `user-${this.idCounter}`
        this.idCounter += 1
        return userId
    }

    findUserById(userId: string) {
        return this.userPool.findUserById(userId)
    }

    createUser(nickName: string) {
        const userId = this.generateUserId()
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
}

const userService = UserService.getInstance()

export default userService
