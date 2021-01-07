import { setupDB, dhlCarrier, dhlCarrier2 } from '../fixtures/carriers';
import { adminUser } from '../fixtures/users';
import Carrier from '../../src/models/carrier.model';
import request from 'supertest';
import app from '../../src/server';

describe('Carrier Controller Test', () => {
  beforeAll(setupDB);

  it('Should create carrier for admin user', async () => {
    await request(app)
      .post('/carrier')
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send(dhlCarrier2)
      .expect(200)
      .expect(async (res) => {
        const carrier = await Carrier.findById(dhlCarrier2._id);
        expect(carrier).not.toBeNull();
        expect(carrier.carrierName).toEqual('DHL eCommerce 2');
      });
  });

  it('Should update carrier for admin user', async () => {
    await request(app)
      .put(`/carrier`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send({ id: dhlCarrier._id, accountName: 'Updated by Unit Test' })
      .expect(200)
      .expect(async (res) => {
        const carrier = await Carrier.findById(dhlCarrier._id);
        expect(carrier.accountName).toEqual('Updated by Unit Test');
      });
  });

  it('Should get all carriers for admin user', async () => {
    await request(app)
      .get('/carrier')
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect(async (res) => {
        const carriers = await Carrier.find();
        expect(carriers.length).toEqual(2);
      });
  });

  it('Should get carrier by id for admin user', async () => {
    await request(app)
      .get(`/carrier/${dhlCarrier._id}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect(async (res) => {
        res.body.carrierName = dhlCarrier.carrierName;
      });
  });

  it('Should delete carrier for admin user', async () => {
    await request(app)
      .delete(`/carrier/${dhlCarrier._id}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect(async (res) => {
        const carrier = await Carrier.findById(dhlCarrier._id);
        expect(carrier).toBeNull();
      });
  });
});
