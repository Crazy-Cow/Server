import { createServer } from 'node:http'
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client'
import { Server, type Socket as ServerSocket } from 'socket.io'
import { AddressInfo } from 'node:net'
import roomService from '../service/rooms'
import { SOCKET_ON_EVT_TYPE } from './constant'
import { initSocket } from '.'

describe('대기실 관련 소켓 통신 테스트', () => {
    let io: Server, serverSocket: ServerSocket, clientSocket: ClientSocket

    beforeEach((done) => {
        const httpServer = createServer()
        io = new Server(httpServer)
        initSocket(io)
        httpServer.listen(() => {
            const port = (httpServer.address() as AddressInfo).port
            clientSocket = ioc(`http://localhost:${port}`)

            io.on('connection', (socket) => {
                serverSocket = socket
            })
            clientSocket.on('connect', done)
        })
    })

    afterEach(() => {
        io.close()
        clientSocket.disconnect()
    })

    it('should work with an acknowledgement', (done) => {
        roomService.joinRoom = jest.fn()

        clientSocket.emit(SOCKET_ON_EVT_TYPE.ROOM_ENTER)
        serverSocket.on(SOCKET_ON_EVT_TYPE.ROOM_ENTER, () => {
            expect(roomService.joinRoom).toHaveBeenCalled()
            done() // 테스트 종료 필수
        })
    })
})
