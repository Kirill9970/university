import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from 'src/app.module';
import { DBAccessService } from 'src/db-access/db-access.service';

const port = 3000;

describe('Authorization tests', () => {
  let app: INestApplication;
  let db: DBAccessService;

  const accessTokenKey = 'accessToken';
  const bearerAuth = { Authorization: `Bearer $S{${accessTokenKey}}` };
  const resBody = 'res.body';

  const uriPath = {
    signup: '/auth/signup',
    signin: '/auth/signin',
    getMe: '/user/me',
  };

  const user = {
    email: 'alice89@example.com',
    name: 'Alice',
    phone: '+79998887766',
    password: '150689',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.listen(port);
    await app.init();

    db = app.get(DBAccessService);
    await db.clear();

    pactum.request.setBaseUrl(`http://localhost:${port}`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Signup', () => {
    it('1: Should forbid to signup without password', async () => {
      return pactum
        .spec()
        .post(uriPath.signup)
        .withBody({ email: user.email })
        .expectStatus(HttpStatus.BAD_REQUEST);
    });

    it('2: Should forbid to signup without email', async () => {
      return pactum
        .spec()
        .post(uriPath.signup)
        .withBody({ password: user.password })
        .expectStatus(HttpStatus.BAD_REQUEST);
    });

    it('3: Should forbid to signup without body data', async () => {
      return pactum
        .spec()
        .post(uriPath.signup)
        .expectStatus(HttpStatus.BAD_REQUEST);
    });

    it('4: Should allow to signup', async () => {
      return pactum
        .spec()
        .post(uriPath.signup)
        .withBody({ ...user })
        .expectStatus(HttpStatus.CREATED)
        .stores(accessTokenKey, resBody);
    });
  });

  describe('Signin', () => {
    it('1: Should fail to sigin with no password', async () => {
      return pactum
        .spec()
        .post(uriPath.signin)
        .withBody({ login: user.email })
        .expectStatus(HttpStatus.BAD_REQUEST);
    });

    it('2: Should fail to signin without login', async () => {
      return pactum
        .spec()
        .post(uriPath.signin)
        .withBody({ password: user.password })
        .expectStatus(HttpStatus.BAD_REQUEST);
    });

    it('3: Should fail to signin with wrong password', async () => {
      return pactum
        .spec()
        .post(uriPath.signin)
        .withBody({
          login: user.email,
          password: 'I am a wrong password',
        })
        .expectStatus(HttpStatus.FORBIDDEN);
    });

    it('4: Should success to signin with email', async () => {
      return pactum
        .spec()
        .post(uriPath.signin)
        .withBody({ login: user.email, password: user.password })
        .expectStatus(HttpStatus.OK);
    });

    it('5: Should success to signin with name', async () => {
      return pactum
        .spec()
        .post(uriPath.signin)
        .withBody({ login: user.name, password: user.password })
        .expectStatus(HttpStatus.OK);
    });

    it('6: Should success to signin with phone', async () => {
      return pactum
        .spec()
        .post(uriPath.signin)
        .withBody({ login: user.phone, password: user.password })
        .expectStatus(HttpStatus.OK);
    });
  });

  describe('Access token check', () => {
    it('1: Should fail to get/me with bad access token', async () => {
      return pactum
        .spec()
        .get(uriPath.getMe)
        .expectStatus(HttpStatus.UNAUTHORIZED);
    });

    it('2: Should success to get/me with right access token', async () => {
      return pactum
        .spec()
        .get(uriPath.getMe)
        .withHeaders(bearerAuth)
        .expectStatus(HttpStatus.OK);
    });

    it('3: Should fail to get/me with expired access token', async () => {
      const week = 7 * 86400 * 1000;

      jest
        .useFakeTimers()
        .setSystemTime(new Date(new Date().getTime() + (week + 1)));

      return pactum
        .spec()
        .get(uriPath.getMe)
        .withHeaders(bearerAuth)
        .expectStatus(HttpStatus.UNAUTHORIZED);
    });
  });
});
