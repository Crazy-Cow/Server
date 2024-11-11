import { Router, Request, Response } from 'express'
import Posts from '../schemas/example'

const router = Router()

router.get('/list', async (_: Request, res: Response) => {
    const result = await Posts.find()
        .select('title content created_at')
        .sort({ created_at: -1 })

    res.json({ data: result })
})

export default router
