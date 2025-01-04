import { check } from 'express-validator';

export const apiLabelHandlerValidator = [
  check('token').notEmpty().withMessage('token 不能为空'),
  check('channelId').notEmpty().withMessage('channelId 不能为空'),
  check('packageType').notEmpty().withMessage('packageType 不能为空'),

  check('shipTo').notEmpty().withMessage('shipTo 不能为空'),
  check('shipTo.name').notEmpty().withMessage('shipTo.name 不能为空'),
  check('shipTo.address1').notEmpty().withMessage('shipTo.address 不能为空'),
  check('shipTo.city').notEmpty().withMessage('shipTo.city 不能为空'),
  check('shipTo.state').notEmpty().withMessage('shipTo.state 不能为空'),
  check('shipTo.zipCode').notEmpty().withMessage('shipTo.zip 不能为空'),
  check('shipTo.country').notEmpty().withMessage('shipTo.country 不能为空'),

  check('packageList').notEmpty().withMessage('packageList 不能为空'),
  check('packageList').isArray().withMessage('packageList 必須为数组'),
  check('packageList.*.weight').notEmpty().withMessage('weight 不能为空'),
  check('packageList.*.weight').isNumeric().withMessage('weight 必須为数字'),
  check('packageList.*.lineItems').notEmpty().withMessage('lineItems 不能为空'),
  check('packageList.*.lineItems')
    .isArray()
    .withMessage('lineItems 必須为数组'),
  check('packageList.*.lineItems.*.name')
    .notEmpty()
    .withMessage('lineItems.name 不能为空'),
  check('packageList.*.lineItems.*.quantity')
    .notEmpty()
    .withMessage('lineItems.quantity 不能为空'),
  check('packageList.*.lineItems.*.totalValue')
    .notEmpty()
    .withMessage('lineItems.totalValue 不能为空')
];

export const apiRateHandlerValidator = [
  check('token').notEmpty().withMessage('token 不能为空'),
  check('channelId').notEmpty().withMessage('channelId 不能为空'),

  check('shipTo').notEmpty().withMessage('shipTo 不能为空'),
  check('shipTo.name').notEmpty().withMessage('shipTo.name 不能为空'),
  check('shipTo.address1').notEmpty().withMessage('shipTo.address 不能为空'),
  check('shipTo.city').notEmpty().withMessage('shipTo.city 不能为空'),
  check('shipTo.state').notEmpty().withMessage('shipTo.state 不能为空'),
  check('shipTo.zipCode').notEmpty().withMessage('shipTo.zip 不能为空'),
  check('shipTo.country').notEmpty().withMessage('shipTo.country 不能为空'),

  check('packageList').notEmpty().withMessage('packageList 不能为空'),
  check('packageList').isArray().withMessage('packageList 必須为数组'),
  check('packageList.*.weight').notEmpty().withMessage('weight 不能为空'),
  check('packageList.*.weight').isNumeric().withMessage('weight 必須为数字')
];

export const apiCancelHandlerValidator = [
  check('token').notEmpty().withMessage('token 不能为空'),
  check('trackingNumbers').notEmpty().withMessage('trackingNumbers 不能为空'),
  check('trackingNumbers').isArray().withMessage('trackingNumbers 必須为数组')
];
