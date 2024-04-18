import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/** 회원가입 API - bcrypt 적용 **/
router.post('/sign-up', async (req, res, next) => {
    try {
        // throw new Error('에러 핸들링 미들웨어 테스트 에러');
        const { email, password, name, age, gender, profileImage } = req.body;

        const isExistUser = await prisma.users.findFirst({
            where: { email }, // 전달 받은 email과 일치하는 사용자가 존재하는지 검색
        });

        // 동일한 email을 이용해서 회원가입을 한 사용자가 있다면 error 발생
        if (isExistUser) {
            return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
        }

        // 사용자 정보를 저장하는 user 부분에 hash() 진행 -> 처음에  전달 받은 password와 암호화 문을 13번의 반복으로 복잡하게 만듬
        const hashedPassword = await bcrypt.hash(password, 13);
        // 사용자 생성작업 -> prisma의 users 테이블에서 진행
        const user = await prisma.users.create({
            // users 테이블에서 관리하는 데이터는 { email, password } =>  data를 사용하여 삽입가능
            data: {
                email,
                password: hashedPassword, // 실제 사용자의 비밀번호가  hashedPassword로 저장되게 구현
            },
        });

        // 사용자 정보 저장
        const userInfo = await prisma.userInfos.create({
            data: {
                // 사용자 정보 테이블은 사용자 테이블과 1:1 관계 -> 사용자 정보 테이블이 어떤 사용자 테이블을 바라보는지 확인 필요
                // user: {
                // connect: { userId: user.userId }, // 기존 사용자에 연결
                // },
                userId: user.userId,
                name,
                age,
                gender,
                profileImage,
            },
        });

        return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
    } catch (err) {
        next(err); // 에러가 발생 했을 때 바깥으로 다음에 있는 미들웨어로 에러를 전달해주는 작업
    }
});

/** 로그인 API **/
router.post('/sign-in', async (req, res, next) => {
    const { email, password } = req.body;

    // 전달 받은 이메일에 해당하는 사용자가 있는지 확인
    const user = await prisma.users.findFirst({
        where: { email },
    });

    // 입력받은 email에 해당하는 사용자가 없을 때에는 res error massage 전달
    if (!user) return res.status(401).json({ message: '존재하지 않는 이메일 입니다.' });

    // 전달 받은 비밀번호와 DB의 비밀번호가 일치하는지 검증
    // DB안에 비밀번호가 bcrypt로 인해 암호화가 되어 있기 때문에 복호화를 실행하기 위해 compare() 메서드 사용
    // ! 만약에 현재 사용자의 password와 전달받은 password가 일치하지 않는다면 error message
    if (!(await bcrypt.compare(password, user.password)))
        return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });

    // jwt 할당 -> token을 통해 jsonwebtoken을 실제로 만들어서 저장 -> jwt.sign을 통해 사용자의 정보를 실제로 만듬
    // userId라는 정보를 실제 사용자가 가지고 있는 user에 있는 userId 값을 할당해서 jwt를 생성 -> 생성할 때 사용하는 jwt의 시크릿 키는 'custom-secret-key'
    const token = jwt.sign({ userId: user.userId }, 'custom-secret-key');

    // res를 이용해서 Client에게 cookie 할당
    res.cookie('authorization', `Bearer ${token}`); // %20 -> space
    return res.status(200).json({ message: '로그인에 성공하였습니다.' });
});

/**
 * 사용자 정보 조회 API
 * 1. 클라이언트가 로그인된 사용자인지 검증 -> 사용자 인증 미들웨어로 위임
 * 2. 사용자를 조회할 떄, 1:1 관계를 맺고 있는 Users와 UsersInfo 테이블을 조회
 * 3. 조회한 사용자의 상세한 정보를 클라이언트에게 반환
 */

router.get('/users', authMiddleware, async (req, res, next) => {
    const { userId } = req.user;

    const user = await prisma.users.findFirst({
        where: { userId: +userId }, // userId가 전달 받은 사용자의 userId와 일치하는 데이터 찾기
        select: {
            // select를 통해서 특정 컬럼만 조회
            userId: true,
            email: true,
            createdAt: true,
            updatedAt: true,
            userInfos: {
                // 중첩 select -> join 연산자가 가능한 이유는 schema.prisma 파일 내부 model Users {} 내부에  userInfos UserInfos? 1:1 관계 정리했기 때문
                // 즉. 1:1 관계를 맺고있는 UserInfos 테이블을 조회
                select: {
                    name: true,
                    age: true,
                    gender: true,
                    profileImage: true,
                },
            },
        },
    });

    return res.status(200).json({ data: user });
});
export default router;
