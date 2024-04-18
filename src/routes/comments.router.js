import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * 1. 댓글을 작성하려는 클라이언트가 로그인된 사용자인지 검증
 * 2. 게시물을 특정하기 위한 postId를 parh parameter로 전달 받기
 * 3. 댓글 생성을 위한 content를 body로 전달 받기
 * 4. comments 테이블에 댓글을 생성
 */

/** 댓글 생성 API **/
router.post('/posts/:postId/comments', authMiddleware, async (req, res, next) => {
    const { postId } = req.params;
    const { content } = req.body;
    const { userId } = req.user; // authMiddleware 내부에서 사용자 정보를 확인하고 해당 정보를 req.user에 할당을 해주기 때문

    // comments를 생성하기 위해서 해당하는 posts가 존재하는지 확인
    const post = await prisma.posts.findFirst({
        where: {
            postId: +postId,
        },
    });

    if (!post) return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });

    const comment = await prisma.comments.create({
        data: {
            postId: +postId, // 댓글 작성 게시글 ID
            userId: +userId, // 댓글 작성자 ID
            content: content,
        },
    });

    return res.status(201).json({ data: comment });
});

/** 댓글 조회 API **/
router.get('/posts/:postId/comments', async (req, res, next) => {
    const { postId } = req.params; // pathparams에서 전달받은 postId를 req.params에서 사용 -> postId를 바탕으로 해당 게시글 조회

    //  comments 목록 조회
    const comments = await prisma.comments.findMany({
        where: { postId: +postId },
        orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ data: comments });
});

export default router;
