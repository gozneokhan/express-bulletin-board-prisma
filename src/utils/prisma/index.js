/**
 * prisma 초기화
 * */
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    // Prisma를 이용해 데이터베이스에 접근할 때, SQL을 출력
    log: ['query', 'info', 'warn', 'error'],

    // 에러 메시지를 평문이 아닌, 개발자가 읽기 쉬운 형태로 출력
    errorFormat: 'pretty',
}); // PrismaClient 인스턴스를 생성
