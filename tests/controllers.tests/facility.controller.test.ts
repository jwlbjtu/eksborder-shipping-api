import { setupDB, testFacility, dhlFacility } from '../fixtures/facilities';
import { adminUser } from '../fixtures/users';
import { dhlCarrier } from '../fixtures/carriers';
import Carrier from '../../src/models/carrier.model';
import Facility from '../../src/models/facility.model';
import request from 'supertest';
import app from '../../src/server';

describe('Facility Controller Test', () => {
  beforeAll(setupDB);

  it('Should create facility for admin user', async () => {
    await request(app)
      .post('/facility')
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send(dhlFacility)
      .expect(200)
      .expect(async (res) => {
        const facility = await Facility.findById(dhlFacility._id);
        expect(facility).not.toBeNull();

        const carrier = await Carrier.findById(dhlCarrier._id).populate({
          path: 'facilityRef'
        });
        expect(carrier.facilityRef.length).toEqual(2);
        expect(carrier.facilityRef[1].facilityNumber).toEqual(
          dhlFacility.facilityNumber
        );
      });
  });

  it('Should update facility for admin user', async () => {
    await request(app)
      .put(`/facility/${testFacility._id}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send({ facilityNumber: 'USBOS1' })
      .expect(200)
      .expect(async (res) => {
        const facility = await Facility.findById(testFacility._id);
        expect(facility.facilityNumber).toEqual('USBOS1');
      });
  });

  it('Should get all facilities for admin user', async () => {
    await request(app)
      .get('/facility')
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect(async (res) => {
        const facilities = await Facility.find();
        expect(facilities.length).toEqual(2);
      });
  });

  it('Should get facility by name for admin user', async () => {
    await request(app)
      .get(`/facility/${testFacility._id}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect(async (res) => {
        res.body.facilityNumber = testFacility.facilityNumber;
      });
  });

  it('Should delete facility for admin user', async () => {
    await request(app)
      .delete(`/facility/${testFacility._id}`)
      .set('Authorization', `Bearer ${adminUser.tokens![0].token}`)
      .send()
      .expect(200)
      .expect(async (res) => {
        const facility = await Facility.findById(testFacility._id);
        expect(facility).toBeNull();
      });
  });
});
