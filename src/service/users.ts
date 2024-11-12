import { generateGuestNickName } from './users.util'

class UserPool {
    users: User[] = []

    getUsers() {
        return this.users
    }

    checkDuplicatedNickName(nickName: string) {
        return this.users.some((user) => user.nickName === nickName)
    }

    addUser(user: User) {
        this.users.push(user)
    }

    removeUser(userId: string) {
        this.users = this.users.filter((user) => user.userId !== userId)
    }
}

class User {
    userId: string
    nickName: string

    constructor(userId: string, nickName: string) {
        this.userId = userId
        this.nickName = nickName
    }
}

const userPool = new UserPool()

const createUser = (userId: string, nickName: string) => {
    let updatedNickName = nickName
    if (updatedNickName == '') {
        updatedNickName = generateGuestNickName()

        while (!userPool.checkDuplicatedNickName(updatedNickName)) {
            // TODO: 9999명 이상 접속 시 무한 루프 위험
            updatedNickName = generateGuestNickName()
        }
    }

    const user = new User(userId, updatedNickName)
    userPool.addUser(user)

    return user
}

const checkDuplicatedNickName = (nickName: string) => {
    return userPool.checkDuplicatedNickName(nickName)
}

const userService = {
    createUser,
    checkDuplicatedNickName,
}

export default userService
