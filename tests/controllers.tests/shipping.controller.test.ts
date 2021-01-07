import app from '../../src/server';
import request from 'supertest';
import {
  allDHLeCommerceProductRequest,
  allDHLeCommerceFLATRequest,
  allDHLeCommerceGNDRequest,
  allPBProductsRequest,
  allPBPMProductsRequest,
  dhlEcommerceGNDLabel,
  dhlEcommerceFlatLabel,
  pbUspsFcmFlatLabelRequest,
  pbUspsFcmPkgLabelRequest,
  pbUspsPmFlatLabelRequest,
  pbUspsPmPkgLabelRequest,
  insufficientBalanceRequest,
  dhlManifestRequest,
  pbManifestRequest,
  setupDB
} from '../fixtures/shipping';
import { adminUser, customerUser, createUser } from '../fixtures/users';

describe('Shipping Unit Test', () => {
  let dhlShippingId = '',
    dhlTrackingId = '',
    dhlRequestId = '';
  beforeAll(setupDB);

  // Nagotive test for product -- missing fields
  it('Should create DHL eCommerce GND label', async () => {
    const response = await request(app)
      .post('/shipping/label')
      .set('Authorization', `Bearer ${customerUser.tokens![0].token}`)
      .send(dhlEcommerceGNDLabel)
      .expect(200)
      .expect((res) => {
        expect(res.body.service).toBe('GND');
        expect(res.body.labels[0].labelData).toBeDefined();
      });

    dhlShippingId = response.body.shippingId;
    dhlTrackingId = response.body.labels[0].trackingId;
  });

  it('Should create DHL eCommerce FLAT label', async () => {
    await request(app)
      .post('/shipping/label')
      .set('Authorization', `Bearer ${customerUser.tokens![0].token}`)
      .send(dhlEcommerceFlatLabel)
      .expect(200)
      .expect((res) => {
        expect(res.body.service).toBe('FLAT');
        expect(res.body.labels[0].labelData).toBeDefined();
      });
  });

  // it('Should not create label with insufficient balance', async () => {
  //   await request(app)
  //     .post('/shipping/label')
  //     .set('Authorization', `Bearer ${createUser.tokens![0].token}`)
  //     .send(insufficientBalanceRequest)
  //     .expect(400)
  //     .expect((res) => {
  //       expect(res.body.title).toBe(
  //         'Insufficient balance, please contact the customer service.'
  //       );
  //     });
  // });
  // // Nagotive test for product --
  // // - missing fields,
  // // - product & account mis-match
  // // - carrier & account mis-match
  // // - product not supported
  // // - service not supported
  // // - carrier not supported
  // // -- make sure fee calcualtion is accurate
  // it('Should get label by shipping Id', async () => {
  //   await request(app)
  //     .get(`/shipping/label/${dhlShippingId}`)
  //     .set('Authorization', `Bearer ${customerUser.tokens![0].token}`)
  //     .send()
  //     .expect(200);
  // });

  // it('Should create DHL eCommerce manifest', async () => {
  //   dhlManifestRequest.manifests[0].trackingIds.push(dhlTrackingId);

  //   const response = await request(app)
  //     .post('/shipping/manifest')
  //     .set('Authorization', `Bearer ${customerUser.tokens![0].token}`)
  //     .send(dhlManifestRequest)
  //     .expect(200);

  //   dhlRequestId = response.body.requestId;
  // });

  // it('Should get DHL eCommerce manifest', async () => {
  //   await request(app)
  //     .get(`/shipping/manifest/iklciklsjfidpcl/${dhlRequestId}`)
  //     .set('Authorization', `Bearer ${customerUser.tokens![0].token}`)
  //     .send()
  //     .expect(200);
  // });
});
