import { Router } from 'express'
import Game from '../utils/gameLogic'

const router = Router()
const games: Map<string, Game> = new Map()

router.get('/api/rooms', (req, res) => {
    const roomList = Array.from(games.keys())
    res.json(roomList)
})

router.get('/api/room/:roomCode', (req, res) => {
    const roomCode = req.params.roomCode
    if (games.has(roomCode)) {
        const game = games.get(roomCode)!
        res.json(game.getState())
    } else {
        res.status(404).json({ error: 'Room not found' })
    }
})

export default router
