import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();
/**
 * 1. 게시글을 작성하려는 클라이언트가 로그인된 사용자인지 검증 -> 사용자 인증 미들웨어를 통해 수행
 * 2. 게시글 생성을 위한 title, content를 body로 전달 받음
 * 3. Posts 테이블에 게시글을 생성
 */

/** 게시글 생성 API **/
router.post('/posts', authMiddleware, async (req, res, next) => {
    const { title, content } = req.body; // title과 content를 client의 req.body에 전달 받도록 구현
    const { userId } = req.user; // 사용자 인증미들웨어를 통과 했을 때에는 req.user에 실제 사용자 정보를 정의하도록 구현 -> req.user에 존재하는 해당하는 사용자의 userId를 꺼내오도록 함

    const post = await prisma.posts.create({
        data: {
            // 생성하기 위한 데이터
            userId: +userId,
            title: title,
            content: content,
        },
    });

    return res.status(201).json({ data: post });
});

/** 게시글 조회 API **/
router.get('/posts', async (req, res, next) => {
    const posts = await prisma.posts.findMany({
        // 모든 데이터 조회
        select: {
            // 조회할 데이터 선택
            postId: true,
            userId: true,
            title: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            // orderBy를 통한 게시글 정렬 기능 구현
            createdAt: 'desc', // createdAt 컬럼을 기준으로 게시글이 생성된 최신 순서대로 조회
        },
    });

    return res.status(200).json({ data: posts });
});

/** 게시글 상세 조회 API **/
router.get('/posts/:postId', async (req, res, nest) => {
    const { postId } = req.params;

    const post = await prisma.posts.findFirst({
        where: { postId: +postId },
        select: {
            postId: true,
            userId: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return res.status(200).json({ data: post });
});
export default router;
