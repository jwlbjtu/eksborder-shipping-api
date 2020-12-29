import request from 'supertest';
import app from '../../src/server';
import Account from '../../src/models/account.model';
import { setupDB, dhlAccount, testAccount } from '../fixtures/account';
import { adminUser } from '../fixtures/users';

describe('Account Unit Test', () => {
  beforeAll(setupDB);

  it('Should create account for admin user', async () => {
    await request(app)
      .post('/account')
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send(dhlAccount)
      .expect(200)
      .expect(async (res) => {
        const account = await Account.findById(dhlAccount._id);
        expect(account).not.toBeNull();
      });
  });

  it('Should get account by account name for admin user', async () => {
    await request(app)
      .get(`/account/${testAccount.accountName}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect(async (res) => {
        res.body.accountName === testAccount.accountName;
      });
  });

  it('Should get all accounts for admin user', async () => {
    await request(app)
      .get('/account')
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect(async (res) => {
        const accounts = await Account.find();
        expect(accounts.length).toEqual(2);
      });
  });

  it('Should update account for admin user', async () => {
    await request(app)
      .put(`/account/${testAccount.accountName}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send({ fee: 125 })
      .expect(200)
      .expect(async (res) => {
        const account = await Account.findById(testAccount._id);
        expect(account.fee).toEqual(125);
      });
  });

  it('Should delete account for admin user', async () => {
    await request(app)
      .delete(`/account/${testAccount.accountName}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect(async (res) => {
        const account = await Account.findById(testAccount._id);
        expect(account).toBeNull();
      });
  });
});
