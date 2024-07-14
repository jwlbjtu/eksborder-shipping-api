import uniqid from 'uniqid';
import axios from 'axios';
import {
  CARRIERS,
  Currency,
  INCOTERM,
  PARCELSELITE_NAME
} from '../../constants';
import convertToDHLAddress from './dhl_ecommerce.helpers';
import { roundToTwoDecimal } from '../../utils/helpers';
import { IFacility, IShipping, LabelData } from '../../../types/record.types';
import { Rate } from '../../../types/carriers/carrier';
import {
  IDHLeCommerceCustomsDetail,
  IDHLeCommerceLabelRequest,
  IDHLeCommerceLabelResponse,
  IDHLeCommercePackageDetail
} from '../../../types/carriers/dhl_ecommerce';
import { logger } from '../../logger';

export const buildDhlEcommerceLabelReqBody = (
  shipmentData: IShipping,
  facilityObj: IFacility,
  rate: Rate,
  isShipmentInternational: boolean
): IDHLeCommerceLabelRequest => {
  const dhlPackageDetail: IDHLeCommercePackageDetail = {
    packageId: uniqid('PE'),
    packageDescription: `${PARCELSELITE_NAME} Order`,
    weight: {
      value: roundToTwoDecimal(shipmentData.packageInfo!.weight.value),
      unitOfMeasure:
        shipmentData.packageInfo!.weight.unitOfMeasure.toUpperCase()
    },
    dimension: {
      length: roundToTwoDecimal(shipmentData.packageInfo!.dimentions!.length),
      width: roundToTwoDecimal(shipmentData.packageInfo!.dimentions!.width),
      height: roundToTwoDecimal(shipmentData.packageInfo!.dimentions!.height),
      unitOfMeasure:
        shipmentData.packageInfo!.dimentions!.unitOfMeasure.toUpperCase()
    },
    billingReference1: 'ParcelsPro',
    billingReference2: `User-${shipmentData.userRef}`
  };

  if (isShipmentInternational) {
    dhlPackageDetail.shippingCost = {
      currency: Currency.USD,
      dutiesPaid:
        shipmentData.customDeclaration!.incoterm === INCOTERM.DDP.value
    };
  }

  const labelReqBody: IDHLeCommerceLabelRequest = {
    pickup: facilityObj.pickup,
    distributionCenter: facilityObj.facility,
    orderedProductId: rate.serviceId,
    consigneeAddress: convertToDHLAddress(shipmentData.toAddress),
    returnAddress: convertToDHLAddress(shipmentData.return!),
    packageDetail: dhlPackageDetail
  };

  if (isShipmentInternational) {
    const customsDetails = shipmentData.customItems!.map((ele) => {
      const detail: IDHLeCommerceCustomsDetail = {
        itemDescription: ele.itemTitle,
        countryOfOrigin: ele.country!,
        packagedQuantity: ele.quantity,
        itemValue: ele.itemValue!,
        currency: ele.itemValueCurrency,
        skuNumber: ele.sku!
      };
      return detail;
    });
    labelReqBody.customsDetails = customsDetails;
  }
  return labelReqBody;
};

export const callDhlEcommerceLabelEndpoint = async (
  api_url: string,
  paramsStr: string,
  labelReqBody: IDHLeCommerceLabelRequest,
  headers: Record<string, string>,
  shipmentData: IShipping,
  isTest: boolean
): Promise<LabelData[]> => {
  logger.info('Call DHL eCommerce [Label] endpoint');
  logger.info(`User: ${shipmentData.userRef}, Order: ${shipmentData._id}`);
  const response = await axios.post(
    api_url + '/shipping/v4/label?' + paramsStr,
    labelReqBody,
    { headers: headers }
  );

  const dhlLabelResponse: IDHLeCommerceLabelResponse = response.data;
  const dhlLabelData = dhlLabelResponse.labels[0];
  const labelResponse: LabelData = {
    carrier: CARRIERS.DHL_ECOMMERCE,
    service: dhlLabelResponse.orderedProductId,
    tracking: dhlLabelData.dhlPackageId,
    createdOn: dhlLabelData.createdOn,
    data: dhlLabelData.labelData,
    format: dhlLabelData.format,
    encodeType: dhlLabelData.encodeType,
    isTest: isTest
  };
  logger.info('Return data from DHL eCommerce [Label] endpoint');
  return [labelResponse];
};
