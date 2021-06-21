import { check } from 'express-validator';
import { FILE_FORMAT_LIST, FILE_TYPE_LIST } from '../../../lib/constants';

export const printFormatUpdateValidator = [
  check('id').notEmpty(),
  check([
    'labelSettings.format',
    'labelSettings.type',
    'packSlipSettings.format',
    'packSlipSettings.type'
  ]).notEmpty(),
  check(
    ['labelSettings.format', 'packSlipSettings.format'],
    'Unsupported file format'
  ).isIn(FILE_FORMAT_LIST),
  check(
    ['labelSettings.type', 'packSlipSettings.type'],
    'Unsupported file type'
  ).isIn(FILE_TYPE_LIST)
];
