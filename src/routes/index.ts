import userRouter from './users'
import gameRouter from './games'
import { challengermodeGameAccountWebhook } from '../controller/challengermodeWebhook'

export default {
    user: userRouter,
    game: gameRouter,
    challengermodeGameAccountWebhook: challengermodeGameAccountWebhook,
}
