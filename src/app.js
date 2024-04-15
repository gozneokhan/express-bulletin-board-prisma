/**
 * app.js 초기화
 * */
import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';

const app = express();
const SERVER_PORT = 3018;

app.use(express.json());
app.use(cookieParser());

app.use('/api', [UsersRouter]);

app.listen(SERVER_PORT, () => {
    console.log(SERVER_PORT, '포트로 서버가 열렸습니다.');
});
