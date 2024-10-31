import { Router, Request, Response } from 'express'
import { repository } from '../db'
import { PostCreateBody, PostUpdateBody } from './posts.type'
import { validateAuth } from '../middleware/auth'
import { createError } from '../utils/error'

const router = Router()

router.get('/list', async (_, res: Response) => {
    const result = await repository.post.find({
        select: ['title', 'created_at'],
        relations: ['user'],
        order: { created_at: 'DESC' },
    })

    const formatted = result.map((post) => ({
        title: post.title,
        nickname: post.user.name,
        created_at: post.created_at,
    }))

    res.json({ data: formatted })
})

router.get('/:post_id', async (req: Request, res: Response): Promise<void> => {
    const { post_id } = req.params
    const postId = Number(post_id)
    if (!postId) {
        res.status(404).json(createError({ msg: '유효하지 않는 post_id 에요' }))
        return
    }

    const post = await repository.post.findOne({
        where: { id: postId },
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
        created_at: post.created_at,
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
        const user_id = req.user_id

        const existingUser = await repository.user.findOne({
            where: { id: user_id },
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
                user_name: existingUser.name,
            })
        } catch (error) {
            console.error(error)
            res.status(500).json(createError({ msg: '서버 오류' }))
        }
    }
)

router.delete(
    '/:post_id',
    validateAuth,
    async (req: Request, res: Response): Promise<any> => {
        const { post_id } = req.params
        const postId = Number(post_id)
        if (!postId) {
            res.status(404).json(
                createError({ msg: '유효하지 않는 post_id 에요' })
            )
            return
        }

        const post = await repository.post.findOne({
            where: { id: postId },
            relations: ['user'],
        })

        if (!post) {
            return res
                .status(404)
                .json(createError({ msg: '게시글을 찾을 수 없어요' }))
        } else if (!post.user) {
            return res.status(404).json(createError({ msg: '미가입 유저에요' }))
        }

        const userId = req.user_id

        if (post.user.id !== userId) {
            return res
                .status(403)
                .json(createError({ msg: '게시글 삭제 권한이 없습니다' }))
        }

        await repository.post.delete(post.id)
        res.sendStatus(200)
    }
)

router.put(
    '/:post_id',
    validateAuth,
    async (
        req: Request<{ post_id: string }, object, PostUpdateBody>,
        res: Response
    ): Promise<any> => {
        const { post_id } = req.params
        const postId = Number(post_id)
        if (!postId) {
            res.status(404).json(
                createError({ msg: '유효하지 않는 post_id 에요' })
            )
            return
        }

        const { title, content } = req.body
        const user_id = req.user_id

        const post = await repository.post.findOne({
            where: { id: postId },
            relations: ['user'],
        })

        if (!post) {
            return res
                .status(404)
                .json(createError({ msg: '게시글을 찾을 수 없어요' }))
        } else if (!post.user) {
            return res.status(404).json(createError({ msg: '미가입 유저에요' }))
        }

        if (post.user.id !== user_id) {
            return res
                .status(403)
                .json(createError({ msg: '게시글 수정 권한이 없습니다' }))
        }

        post.title = title
        post.content = content
        await repository.post.save(post)
        res.sendStatus(200)
    }
)

export default router
