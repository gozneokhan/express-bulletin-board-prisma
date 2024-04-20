# Prisma Transaction

Prisma의 트랜잭션은 두 가지 유형
Sequential Transaction과 Interactive Transaction.

1. Sequential Transaction:
   Prisma가 제공하는 하나의 트랜잭션에서 여러 쿼리를 순차적으로 실행할 수 있음

2. Interactive Transaction:
   Prisma 자체적으로 트랜잭션의 성공과 실패를 관리하며 이 유형의 트랜잭션에서는 개발자가 직접적으로 트랜잭션을 컨트롤하고 관리할 수 있음

# Sequential Transaction

Sequential Transaction은 Prisma의 여러 Query를 Array([])로 전달받아, 각 쿼리들을 순서대로 실행하는 특징이 있습니다. 이러한 특징은 여러 작업이 순차적으로 실행되어야할 때 사용할 수 있음

```
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sequential Transaction은 순차적으로 실행
// 결과값은 각 쿼리의 순서대로 배열에 담겨 반환
const [posts, comments] = await prisma.$transaction([
  prisma.posts.findMany(), // 순차적으로 실행
  prisma.comments.findMany(),
])
```

  위에 있는 코드를 살펴보면 prisma.$transaction([]) 방식을 통해서 Transaction의 Method를 사용할 수 있는걸 확인 가능
    그런데 여기서 Transaction을 실행을 할 때 []이런 Array 형태로 전달을 받게 된다면 Array 내에 있는 Prisma의 Query들을 순차적으로 실행하도록 도와주는게 Sequential Transaction임

그래서 현재 Array 안에 있는 Query들이 Posts 테이블에서 여러가지의 데이터들을 조회하고 그 다음에 댓글 테이블에서 여러가지 데이터를 조회한 결과값을 왼쪽 앞에 있는 const [posts, comments]에 각각 배열 형태로 하나하나씩 할당됨

Sequential Transaction은 단순하게 여러개의 Query를 순차적으로 실행을 해서 해당하는 코드 중에 실패가 발생하면
자동으로 ROLLBACK을 시키고 성공을 했었을 때 Transaction을 Commit을 시키는 방법을 통해서 사용하는게 Sequential Transaction임.

또한 Sequential Transaction에서 단순한 Query뿐만 아니라 Prisma 내에서는 $ 표시와 queryRaw라는 방식을 쓰고 그 뒤에 Backtick을 사용함으로 인해서 SQL을 Raw Query 형식으로 사용할 수 있음.
이런 Prisma에서 지원하는 Raw Query 또한 아래의 방법처럼 Sequential Transaction을 적용할 수 있음.

```
import { PrismaClient } from '@prisma/client';

const prisma =new PrismaClient();

// Sequrntial Transaction은 순차적으로 실행됨.
// Raw Query를 이용하여, Transaction을 실행할 수 있음.
const [users, userInfos] = await prisma.$transaction([
  prisma.$queryRaw`SELECT * FROM Users`,
  prisma.$queryRaw`SELECT * FROM UserInfos`,
])
```

# Interactive Transaction

실제 비즈니스 로직을 해당하는 Transaction 내에서 구현

```
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Prisma의 Interactive Transaction을 실행
const result = await prisma.$transaction(async (tx) => {
  // Transaction 내에서 사용자를 생성
  const user = await tx.users.create({
    data: {
      email: 'example@gmail.com',
      password: 'ex@mple123',
    },
  });

  // error가 발생하여, Transaction 내에서 실행된 모든 Query가 ROLLBACK됨.
  throw new Error(' Transaction 실패! ');
  return user;
})
```

-   Interactive Transaction은 모든 비즈니스 로직이 성공적으로 완료되거나 에러가 발생한 경우 Prisma 자체적으로 COMMIT(성공) 또는 ROLLBACK(실패)을 실행하여 Transaction을 관리하는 장점을 가지고 있음.

-   Interactive Transaction은 Transaction 진행 중에도 비즈니스 로직을 처리할 수 있어, 복잡한 Query 시나리오를 효과적으로 구현할 수 있음.

-   $transaction() 메서드의 첫 번째 인자 async(tx)는 저희가 일반적으로 사용하는 prisma instance와 같은 기능을 수행

    그래서 단순하게 하나의 async(tx)라는 것을 통하여 실제 해당하는 Callback 함수를 Transaction 내부에 구현하면서 이 Callback 함수 내에서 에러가 발생했을 때, 자동적으로 Prisma의 Transaction이 ROLLBACK을 시키도록 구현되어 있고, 그 다음에 해당하는 Callback에서 return되는 최종 결과값을 변수의 최종 결과 값으로 할당하는 방법이 존재함.

    그래서 Transaction내에 있는 Callback 함수 내에서 사용한 것들이 전부 Transaction이 적용되고 난 뒤에 범위에서 사용되는 로직들임.

    위의 코드를 간략하게 본다면 prisma를 사용하지 않고 Callback 함수의 인자값으로 전달받은 tx라는 것을 이용하여 Users 테이블에 있는 특정 테이블을 생성하는 예저로 확인할 수 있음.

    위에서 throw new Error라고 해서 (' Transaction 실패! '); 라는 코드가 들어가 있는데 이렇게 에러가 발생하면 prisma가 내부적으로 지금 이건 Transaction 실행 중인데 에러가 발생했기 때문에 ROLLBACK을 해야 돠는구나를 내부적으로 인지하고 실제 코드가 성공하지 않고 ROOLBACK 되는 상황을 확인할 수 있음.

# Prisma의 격리 수준은 어떻게 설정?

Prisma에 격리수준은 Transaction을 생성할 때, isolationLevel 옵션을 정의함으로써 설정할 수 있음.

```
import { Prisma } from '@prisma/client';

await prisma.$transaction(
  async (tx) => { ... },
  {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  },
);
```

격리 수준(Isolation Level)을 설정할 때, 현재 구현하려는 API에는 어떠한 격리 수준이 필요한지 명확하게 이해해야 함.
이를 통해 효율적인 데이터베이스의 설계를 할 수 있고, 데이터의 일관성이 깨지지 않도록 구현할 수 있게 됨.
회원가입 API는 결제시스템과 같은 높은 수준의 일관성을 요구하지 않기 때문에 READ_COMMITTED 격리 수준을 사용하였지만, 나중에 높은 일관성이 필요하다면 격리 수준을 변경하여햐 함.
