/** app.js 초기화 **/
import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import LogMiddleware from './middlewares/log.middleware.js';
import errorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const app = express();
const SERVER_PORT = 3018;

app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use('/api', [UsersRouter]);
app.use(errorHandlingMiddleware); // 에러처리 미들웨어는 클라이언트 요청이 실패하였을 때, 가장 마지막에 실행 -> app.use를 이용한 전역 미들웨어 중 가장 최하단에 위치

app.listen(SERVER_PORT, () => {
    console.log(SERVER_PORT, '포트로 서버가 열렸습니다.');
});
