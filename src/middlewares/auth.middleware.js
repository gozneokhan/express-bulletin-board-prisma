import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js'; // jwt에서 꺼낸 userId를 바탕으로 DB에서 사용자 조회 해야하기 때문에 prisma client 가져오기

/** 사용자 인증 미들웨어 구현 **/
// express의 의존성이 존재하지 않기 때문에 함수형으로 구현
export default async function (req, res, next) {
    try {
        const { authorization } = req.cookies; // req.cookie에 있는 authorization 쿠키 가져오기

        if (!authorization) throw new Error('요청한 사용자의 토큰이 존재하지 않습니다.');

        // cookie가 Bearer Token 형식인지 확인 => authorization "Bearer(tokenType) edfwietjwet(token)"
        const [tokenType, token] = authorization.split(' '); // ' '를 기준으로 분리해서 배열로 만들어서 관리

        // cookie가 Bearer Token 형식인지 확인
        if (tokenType !== 'Bearer') throw new Error('토큰 타입이 Bearer 형식이 아닙니다.');

        // 실저로 jwt가 서버에서 발급한 게 맞는지 검증이 완료되었을 때만 decodedToken에 할당
        const decodedToken = jwt.verify(token, 'custom-secret-key');

        // jwt의 userId를 이용해 사용자를 조회
        // jwt 내부에다가 userId를 하나 저장 -> 사용자 middleware에서도 userId를 꺼내서 사용 가능
        const userId = decodedToken.userId;

        // userId를 통해 해당하는 유저 조회
        const user = await prisma.users.findFirst({
            where: { userId: +userId }, //Primary key를 숫자로 변환해서 에러 발생 방지
        });
        if (!user) throw new Error('토큰 사용자가 존재하지 않습니다.');

        // req.user에 조회된 사용자 정보를 할당
        req.user = user;

        // 해당하는 middleware가 다음 middleware를 호출 할 수 있도록 next()사용
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: '토큰이 만료되었습니다.' });
        }

        if (error.name === 'JsonwebTokenError') {
            return res.status(401).json({ message: '토큰이 조작되었습니다.' });
        }

        return res.status(400).json({ message: error.message });
    }
}
