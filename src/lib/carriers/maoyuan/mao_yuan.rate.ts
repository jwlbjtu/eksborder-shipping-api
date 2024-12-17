import {
  MaoYuanRatePackingContent,
  MaoYuanRateReqBody
} from '../../../types/carriers/mao_yuan';
import { IShipping } from '../../../types/record.types';
import { roundToTwoDecimal } from '../../utils/helpers';
import convertlib from 'convert-units';
import { logger } from '../../logger';
import { DistanceUnit, WeightUnit } from '../../constants';

export const buildMaoYuanProductsReqBodyWithWeight = (
  shipmentData: IShipping,
  weight: number,
  weightType: string
): MaoYuanRateReqBody => {
  const maoYuanRateReqBody: MaoYuanRateReqBody = {
    channelId: Number(shipmentData.service!.id!),
    row: {
      shipperCountry: shipmentData.sender!.country,
      shipperAddrOne: shipmentData.sender!.street1,
      shipperAddrTwo: shipmentData.sender!.street2 || '',
      shipperAddrThree: '',
      shipperPostalCode: shipmentData.sender!.zip,
      shipperProvince: shipmentData.sender!.state!,
      shipperCity: shipmentData.sender!.city,
      isResidence: '0',
      recipientCountry: shipmentData.toAddress.country,
      recipientAddrOne: shipmentData.toAddress.street1,
      recipientAddrTwo: shipmentData.toAddress.street2 || '',
      recipientAddrThree: '',
      recipientPostalCode: shipmentData.toAddress.zip,
      recipientProvince: shipmentData.toAddress.state!,
      recipientCity: shipmentData.toAddress.city,
      isResidencetwo: '1',
      packing: 'YOUR_PACKAGING',
      packingContent: [
        {
          name: 1,
          weight: roundToTwoDecimal(
            convertlib(weight)
              .from(weightType as WeightUnit)
              .to(WeightUnit.LB)
          ),
          unit: 'LB',
          long: 1,
          width: 1,
          height: 1,
          longunit: 'IN'
        }
      ]
    }
  };
  return maoYuanRateReqBody;
};

export const buildMaoYuanProductsReqBody = (
  shipmentData: IShipping
): MaoYuanRateReqBody => {
  const maoYuanRateReqBody: MaoYuanRateReqBody = {
    channelId: Number(shipmentData.service!.id!),
    row: {
      shipperCountry: shipmentData.sender!.country,
      shipperAddrOne: shipmentData.sender!.street1,
      shipperAddrTwo: shipmentData.sender!.street2 || '',
      shipperAddrThree: '',
      shipperPostalCode: shipmentData.sender!.zip,
      shipperProvince: shipmentData.sender!.state!,
      shipperCity: shipmentData.sender!.city,
      isResidence: '0',
      recipientCountry: shipmentData.toAddress.country,
      recipientAddrOne: shipmentData.toAddress.street1,
      recipientAddrTwo: shipmentData.toAddress.street2 || '',
      recipientAddrThree: '',
      recipientPostalCode: shipmentData.toAddress.zip,
      recipientProvince: shipmentData.toAddress.state!,
      recipientCity: shipmentData.toAddress.city,
      isResidencetwo: '1',
      packing: 'YOUR_PACKAGING',
      packingContent: shipmentData.packageList.map(
        (p, index): MaoYuanRatePackingContent => {
          const unitOfMeasure = p.weight.unitOfMeasure;
          const weight = p.weight.value;
          const maoYuanWeight = roundToTwoDecimal(
            convertlib(weight).from(unitOfMeasure).to(WeightUnit.LB)
          );
          const dimension = p.dimentions;
          const l = dimension?.length || 0;
          const w = dimension?.width || 0;
          const h = dimension?.height || 0;
          const dUnitOfMeasure = dimension?.unitOfMeasure;

          return {
            name: index + 1,
            weight: maoYuanWeight,
            unit: 'LB',
            long: l
              ? roundToTwoDecimal(
                  convertlib(l).from(dUnitOfMeasure!).to(DistanceUnit.IN)
                )
              : 1,
            width: w
              ? roundToTwoDecimal(
                  convertlib(w).from(dUnitOfMeasure!).to(DistanceUnit.IN)
                )
              : 1,
            height: h
              ? roundToTwoDecimal(
                  convertlib(h).from(dUnitOfMeasure!).to(DistanceUnit.IN)
                )
              : 1,
            longunit: 'IN'
          };
        }
      )
    }
  };
  return maoYuanRateReqBody;
};
