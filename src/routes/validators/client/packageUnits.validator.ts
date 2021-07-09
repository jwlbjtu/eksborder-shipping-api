import { check } from 'express-validator';
import { DISTANCE_UNIT_LIST, WEIGHT_UNIT_LIST } from '../../../lib/constants';

export const updatePackageSettingsValidator = [
  check(['id', 'weightUnit', 'distanceUnit']).notEmpty(),
  check('weightUnit').isIn(WEIGHT_UNIT_LIST),
  check('distanceUnit').isIn(DISTANCE_UNIT_LIST)
];
