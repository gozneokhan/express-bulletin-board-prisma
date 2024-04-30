/** app.js 초기화 **/
import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import PostsRouter from './routes/posts.router.js';
import CommentsRouter from './routes/comments.router.js';
import LogMiddleware from './middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';
import expressSession from 'express-session';
import expressMySQLSession from 'express-mysql-session';
import dotenv from 'dotenv';

dotenv.config(); // root 위치에 존재하는 .env 파일을 가져와서 해당하는 정보를 모두 process.env에다가 할당

const app = express();
const SERVER_PORT = 3018;

const MySQLStore = expressMySQLSession(expressSession); // 외부 session storagy를 사용하는 문법
const sessionStore = new MySQLStore({
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    expiration: 1000 * 60 * 60 * 24, // 만료 기간 1일로 설정
    createDatabaseTable: true, // 해당하는 세션 테이블 존재하지 않을 때에는 자동으로 설정
});

app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(
    expressSession({
        secret: process.env.SESSION_SECRET_KEY, // 해당하는 session을 암호화하는 비밀키 설정
        resave: false, // 해당하는 사용자에게 req.session에다가 특정한 session 정보가 할당되지 않았을 때, 설정 정보를 저장하지 않도록 설정
        saveUninitialized: false, // session이 초기화되지 않았을 때, session을 저장하지 않도록 설정
        cookie: {
            // session을 어느정도 시간정도 유지할 건지? maxAge -> 최대 시간
            maxAge: 1000 * 60 * 60 * 24, // 1일 동안 쿠키를 사용할 수 있도록 설정
        },
        store: sessionStore, // store는 외부 세션 스토리지 사용을 express-session에게 알려줌
    })
);

app.use('/api', [UsersRouter, PostsRouter, CommentsRouter]);
app.use(ErrorHandlingMiddleware); // 미들웨어 중 가장 최하단에 위치

app.listen(SERVER_PORT, () => {
    console.log(SERVER_PORT, '포트로 서버가 열렸습니다.');
});
