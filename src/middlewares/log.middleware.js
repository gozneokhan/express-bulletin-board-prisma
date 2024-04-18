/** 간단하게 터미널에 기록하는 로그 미들웨어 ->  winston module 사용 **/
import winston from 'winston';

// createLogger()를 이용하여 해당하는 winston logger 구현
const logger = winston.createLogger({
    level: 'info', // error. warn, debug 등등 다양하게 winston의 로그를 출력 가능
    format: winston.format.json(), //  실제 winston이 어떤 형태로 출력하는지에 대한 내용 -> json 형태 출력되도록 구현
    transports: [new winston.transports.Console()], // 어떤 형태로 format된 logger를 출력할지에 대한 내용 -> 실제 해당하는 logger를 console에 출력하는 작업을 구현
});

/** winston logger를 이용해서 로깅하는 작업을 수행하는 log middleware를 구현 **/
// (1) 들어오고
export default function (req, res, next) {
    // (2) 시작시간 정의
    const start = new Date().getTime(); // 해당하는 log가 언제 시작됐는지 확인하기 위해 시간 정보 적용 -> 현재 시간 가져오기
    // res.on() 문법을 통해 해당하는 응답이 완료되었을 때, 로그를 출력하는 과정을 거쳐감
    // (4) 마지막으로 callback 함수 '()=> {}' 실행
    res.on('finish', () => {
        // 만약에 이 res가 정상적으로 전달이 되고 난 뒤라면 duration 변수에 해당하는 시간정보 가져와서 저장
        // 실제로 해당하는 미들웨어로 들어온 시간 그리고 모든 res가 처리되고 난 시간에 - 시간을 빼서 관리
        const duration = new Date().getTime() - start; // 최종적으로 비즈니스 로직이 수행된 시간 -> 해당하는 미들웨어로 들어온 시간과 모든 response가 처리되고난 시간에다가 시간을 빼서 관리
        //  logger.info()를 통해 logger의 info level을 출력 + 야러가지 logger를 출력하도록 구현
        logger.info(`Method: ${req.method}, URL: ${req.url}, Status: ${res.statusCode}, Duration: ${duration}ms `); // ${duration} -> 최종적으로 비즈니스 로직이 수행된 시간
    });

    //(3) next()에서 다음 미들웨어로써 동작을 하고
    next();
}

/**
 * 출력: {"level":"info","message":"Method: GET, URL: /users, Status: 200, Duration: 64ms "}
 * logger를 통해 실제 API가 어떤 식으로 정상적으로 동작하는지에 대해서 Log를 명확하게 하는 것 또한 중요함
 * 위에서는 간단히 level과 해당하는 message와 어떤식으로 URL이 호출되고 Status나 Duration 정보도 있지만
 * 나중에는 조금 더 규격화를 해서 추상화가 잘 된 log를 사용하게 되면 데이터 분석을 했을 때도 유용한 방식으로 사용 가능함
 */
