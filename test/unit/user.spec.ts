import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { DBAccessService } from 'src/db-access/db-access.service';
import { LoginIsOccupied } from 'src/user/error';
import { UserService } from 'src/user/user.service';
import { userIdByName } from 'test/helper/userIdByName';

import { user } from '../helper';

describe('UserService tests', () => {
  let service: UserService;
  let db: DBAccessService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<UserService>(UserService);
    db = module.get<DBAccessService>(DBAccessService);

    await db.clear();
  });

  describe('Create', () => {
    it('1: Should create user', async () => {
      expect(await service.create({ ...user.alice })).toEqual(
        expect.any(String),
      );
    });

    it('2: Should forbid to create user with the same login', async () => {
      await expect(
        service.create({ email: user.alice.email, password: '' }),
      ).rejects.toThrowError(LoginIsOccupied);

      await expect(
        service.create({
          email: 'a@gmail.com',
          name: user.alice.name,
          password: '',
        }),
      ).rejects.toThrowError(LoginIsOccupied);

      await expect(
        service.create({
          email: 'a@gmail.com',
          phone: user.alice.phone,
          password: '',
        }),
      ).rejects.toThrowError(LoginIsOccupied);
    });
  });

  describe('Edit', () => {
    it('1: Should forbid to change login to occupied', async () => {
      await service.create({ ...user.bob });
      const id = await userIdByName(db, user.alice.name);

      await expect(
        service.edit(id, { name: user.bob.name }),
      ).rejects.toThrowError(LoginIsOccupied);

      await expect(
        service.edit(id, { phone: user.bob.phone }),
      ).rejects.toThrowError(LoginIsOccupied);
    });

    it('2: Should successfully edit a user', async () => {
      const id = await userIdByName(db, user.alice.name);

      await service.edit(id, {
        name: 'newName',
        password: 'newPassword',
      });
    });
  });
});
