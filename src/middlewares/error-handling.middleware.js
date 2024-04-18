/**
 * 에러처리 미들웨어 구현
 * express에서 발생한 에러를 통합적으로 처리하기 위한 미들웨어
 */
export default function (err, req, res, next) {
    console.error(err); // 현재 전달된 err 정보를 출력하도록 구현
    res.status(500).json({ message: '서버 내부에서 에러가 발생했습니다.' }); // 특정 상태 코드 또한 response에 해당하는 err 처리 미들웨어에 전달해서 response 또한 커스터하게 사용할 수 있음.
}
