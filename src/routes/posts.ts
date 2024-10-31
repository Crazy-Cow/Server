import { Router, Request, Response } from 'express'
import { repository } from '../db'
import { PostCreateBody, PostUpdateBody } from './posts.type'
import { validateAuth } from '../middleware/auth'
import { createError } from '../utils/error'

const router = Router()

router.get('/list', async (_, res: Response) => {
    const result = await repository.post.find({
        select: ['title', 'createdAt'],
        relations: ['user'],
        order: { createdAt: 'DESC' },
    })

    const formatted = result.map((post) => ({
        title: post.title,
        nickname: post.user.name,
        createdAt: post.createdAt,
    }))

    res.json({ data: formatted })
})

router.get('/:postId', async (req: Request, res: Response): Promise<void> => {
    const { postId } = req.params
    const postID = Number(postId)
    if (!postID) {
        res.status(404).json(createError({ msg: '유효하지 않는 postId 에요' }))
        return
    }

    const post = await repository.post.findOne({
        where: { id: postID },
        relations: ['user'],
    })

    if (!post) {
        res.status(404).json(createError({ msg: '게시글을 찾을 수 없어요' }))
        return
    }

    res.status(200).json({
        title: post.title,
        content: post.content,
        nickname: post.user?.name ?? '탈퇴 유저',
        createdAt: post.createdAt,
    })
})

router.post(
    '/',
    validateAuth,
    async (
        req: Request<object, object, PostCreateBody>,
        res: Response
    ): Promise<void> => {
        const { title, content } = req.body
        const userId = req.user_id

        const existingUser = await repository.user.findOne({
            where: { id: userId },
        })

        if (!existingUser) {
            res.status(404).json(createError({ msg: '미가입 유저에요' }))
            return
        }

        const newPost = repository.post.create({
            title,
            content,
            user: existingUser,
        })

        try {
            await repository.post.save(newPost)
            res.status(201).json({
                id: newPost.id,
                title,
                content,
                userName: existingUser.name,
            })
        } catch (error) {
            console.error(error)
            res.status(500).json(createError({ msg: '서버 오류' }))
        }
    }
)

router.delete(
    '/:postId',
    validateAuth,
    async (req: Request, res: Response): Promise<void> => {
        const { postId } = req.params
        const postID = Number(postId)
        if (!postID) {
            res.status(404).json(
                createError({ msg: '유효하지 않는 postId 에요' })
            )
            return
        }

        const post = await repository.post.findOne({
            where: { id: postID },
            relations: ['user'],
        })

        if (!post) {
            res.status(404).json(
                createError({ msg: '게시글을 찾을 수 없어요' })
            )
            return
        } else if (!post.user) {
            res.status(404).json(createError({ msg: '미가입 유저에요' }))
            return
        }

        const userId = req.user_id

        if (post.user.id !== userId) {
            res.status(403).json(
                createError({ msg: '게시글 삭제 권한이 없습니다' })
            )
            return
        }

        await repository.post.delete(post.id)
        res.sendStatus(200)
    }
)

router.put(
    '/:postId',
    validateAuth,
    async (
        req: Request<{ postId: string }, object, PostUpdateBody>,
        res: Response
    ): Promise<void> => {
        const { postId } = req.params
        const postID = Number(postId)
        if (!postID) {
            res.status(404).json(
                createError({ msg: '유효하지 않는 postId 에요' })
            )
            return
        }

        const { title, content } = req.body
        const userId = req.user_id

        const post = await repository.post.findOne({
            where: { id: postID },
            relations: ['user'],
        })

        if (!post) {
            res.status(404).json(
                createError({ msg: '게시글을 찾을 수 없어요' })
            )
            return
        } else if (!post.user) {
            res.status(404).json(createError({ msg: '미가입 유저에요' }))
            return
        }

        if (post.user.id !== userId) {
            res.status(403).json(
                createError({ msg: '게시글 수정 권한이 없습니다' })
            )
            return
        }

        post.title = title
        post.content = content
        await repository.post.save(post)
        res.sendStatus(200)
    }
)

export default router
