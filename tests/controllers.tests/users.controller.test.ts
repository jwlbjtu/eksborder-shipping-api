import request from 'supertest';
import app from '../../src/server';
import User from '../../src/models/user.model';

import {
  adminUser,
  customerUser,
  createUser,
  setupDB
} from '../fixtures/users';
import { USER_ROLES } from '../../src/lib/constants';

describe('User Controller Tests', () => {
  beforeAll(setupDB);

  it('Should login as admin super user', async () => {
    await request(app)
      .post('/users/login')
      .set('Content-Type', 'application/json')
      .send({
        user: {
          email: adminUser.email,
          password: adminUser.password
        }
      })
      .expect(200)
      .expect(async (res) => {
        expect(res.body.role).toBe(USER_ROLES.ADMIN_SUPER);

        const loginUser = await User.findById(adminUser._id);
        // @ts-expect-error: ignore
        expect(res.body.token).toBe(loginUser.tokens[1].token);
      });
  });

  it('Should login as customer user', async () => {
    await request(app)
      .post('/users/login')
      .set('Content-Type', 'application/json')
      .send({
        user: {
          email: customerUser.email,
          password: customerUser.password
        }
      })
      .expect(200)
      .expect(async (res) => {
        expect(res.body.role).toBe(USER_ROLES.API_USER);
        const loginUser = await User.findById(customerUser._id);
        // @ts-expect-error: ignore
        expect(res.body.token).toBe(loginUser.tokens[1].token);
      });
  });

  it('Should not login unknow user', async () => {
    await request(app)
      .post('/users/login')
      .set('Content-Type', 'application/json')
      .send({
        user: {
          email: 'unknow@email.com',
          password: 'wrongpass'
        }
      })
      .expect(400);
  });

  it('Should get user by id for admin user', async () => {
    await request(app)
      .get(`/users/${customerUser._id}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect((res) => {
        expect(res.body.role).toBe(USER_ROLES.API_USER);
      });
  });

  it('Should not get user by id for customer user', async () => {
    await request(app)
      .get(`/users/${customerUser._id}`)
      .set('Authorization', `Bearer ${customerUser.tokens![0].token}`)
      .send()
      .expect(401);
  });

  it('Should not get user by id for unauthorized user', async () => {
    await request(app).get(`/users/${customerUser._id}`).send().expect(401);
  });

  it('Should get all users for admin user', async () => {
    await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200);
  });

  it('Should not get all users for customer user', async () => {
    await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${customerUser.tokens![0].token}`)
      .send()
      .expect(401);
  });

  it('Should not get all users for unauthorized user', async () => {
    await request(app).get('/users').send().expect(401);
  });

  it('Should create user for admin user', async () => {
    await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send(createUser)
      .expect(200)
      .expect(async (res) => {
        const createdUser = await User.findById(createUser._id);
        expect(createdUser).toBeDefined();
      });
  });

  it('Should not create user for customer user', async () => {
    await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${customerUser.tokens![0].token}`)
      .send(createUser)
      .expect(401);
  });

  it('Should not create user for unauthorized user', async () => {
    await request(app).post('/users').send(createUser).expect(401);
  });

  it('Should update user for admin user', async () => {
    await request(app)
      .put(`/users/${customerUser._id}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send({ balance: 100 })
      .expect(200)
      .expect(async (res) => {
        const updatedUser = await User.findById(customerUser._id);
        // @ts-expect-error: ignore
        expect(updatedUser.balance).toBe(100);
      });
  });

  it('Should not update user for customer user', async () => {
    await request(app)
      .put(`/users/${customerUser._id}`)
      .set('Authorization', `Bearer ${customerUser.tokens![0].token}`)
      .send({ balance: 100 })
      .expect(401);
  });

  it('Should not update user for unauthorized user', async () => {
    await request(app)
      .put(`/users/${customerUser._id}`)
      .send({ balance: 100 })
      .expect(401);
  });

  it('Should upload user logo for admin user', async () => {
    await request(app)
      .post(`/users/logo/${customerUser._id}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .attach('upload', 'tests/fixtures/DU.png')
      .expect(200)
      .expect(async (res) => {
        const logoUser = await User.findById(customerUser._id);
        // @ts-expect-error: ignore
        expect(logoUser.logoImage).toEqual(expect.any(Buffer));
      });
  });

  it('Should not upload user logo for customer user', async () => {
    await request(app)
      .post(`/users/logo/${customerUser._id}`)
      .set('Authorization', `Bearer ${customerUser.tokens![0].token}`)
      .attach('upload', 'tests/fixtures/DU.png')
      .expect(401);
  });

  it('Should not upload user logo for unauthrized user', async () => {
    await request(app)
      .post(`/users/logo/${customerUser._id}`)
      .attach('upload', 'tests/fixtures/DU.png')
      .expect(401);
  });

  it('Should delete user for admin user', async () => {
    await request(app)
      .delete(`/users/${customerUser._id}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect(async (res) => {
        const deletedUser = await User.findById(customerUser._id);
        expect(deletedUser).toBeNull();
      });
  });

  it('Should not delete user for customer user', async () => {
    await request(app)
      .delete(`/users/${customerUser._id}`)
      .set('Authorization', `Bearer ${customerUser.tokens![0].token}`)
      .send()
      .expect(401);
  });

  it('Should not delete user for unauthorized user', async () => {
    await request(app).delete(`/users/${customerUser._id}`).send().expect(401);
  });

  it('Should log out user', async () => {
    await request(app)
      .get('/users/logout')
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect(async (res) => {
        const logoutUser = await User.findById(adminUser._id);
        // @ts-expect-error: ignore
        expect(logoutUser.tokens[1]).toBeUndefined();
      });
  });
});
