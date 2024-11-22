import userRepository from '../repository/users'

export class RedisUser {
    userId: string
    nickName: string
    roomId: string

    constructor(props: { userId: string; nickName: string; roomId: string }) {
        this.userId = props.userId
        this.nickName = props.nickName
        this.roomId = props.roomId
    }

    updateRoomId(roomId: string) {
        userRepository.updateRoomId({ userId: this.userId, roomId: roomId })
    }

    resetRoomId() {
        userRepository.updateRoomId({ userId: this.userId, roomId: '' })
    }
}
