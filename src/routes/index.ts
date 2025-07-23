import userRouter from './users'
import gameRouter from './games'
import {
    challengermodeGameAccountWebhook,
    challengermodeCreateGameSessionWebhook,
    challengermodeGetGameSessionWebhook,
} from '../controller/challengermodeWebhook'

export default {
    user: userRouter,
    game: gameRouter,
    challengermodeGameAccountWebhook: challengermodeGameAccountWebhook,
    challengermodeCreateGameSessionWebhook:
        challengermodeCreateGameSessionWebhook,
    challengermodeGetGameSessionWebhook: challengermodeGetGameSessionWebhook,
}
