import axios from 'axios';
import { ApiFinalResult } from '../../../types/carriers/api';
import { Rate } from '../../../types/carriers/carrier';
import {
  DPDOrderRequestBody,
  DPDOrderResponse,
  HawbChild
} from '../../../types/carriers/dpd';
import { IShipping } from '../../../types/record.types';
import { Currency, WeightUnit } from '../../constants';
import { logger } from '../../logger';
import { roundToTwoDecimal } from '../../utils/helpers';
import convertlib from 'convert-units';

export const buildDpdOrderRequestBody = (
  shipmentData: IShipping,
  rate: Rate,
  isTest: boolean
): DPDOrderRequestBody => {
  const totalWeight = shipmentData.packageList.reduce(
    (total, p) => total + p.weight.value,
    0
  );
  const totalWeightInKg = roundToTwoDecimal(
    convertlib(totalWeight).from(WeightUnit.LB).to(WeightUnit.KG)
  );

  const childHawItems: HawbChild[] = [];
  if (shipmentData.packageList.length > 1) {
    shipmentData.packageList.forEach((p, index) => {
      const hawbItem: HawbChild = {
        ChildCustomerHawb:
          index === 0
            ? shipmentData.orderId
            : `${shipmentData.orderId}-${index}`,
        Weight: p.weight
          ? roundToTwoDecimal(
              convertlib(p.weight.value)
                .from(p.weight.unitOfMeasure)
                .to(WeightUnit.KG)
            )
          : 0
      };
      childHawItems.push(hawbItem);
    });
  }

  const requestBody: DPDOrderRequestBody = {
    CustomerHawb: shipmentData.orderId,
    ReceiverName: shipmentData.toAddress.name || '',
    ReceiverAddress1: shipmentData.toAddress.street2
      ? `${shipmentData.toAddress.street1}, ${shipmentData.toAddress.street2}`
      : shipmentData.toAddress.street1,
    ReceiverTel: shipmentData.toAddress.phone || '',
    ReceiverCountry: shipmentData.toAddress.country,
    ReceiverZip: shipmentData.toAddress.zip,
    Weight: totalWeightInKg,
    DeclareCurrency: shipmentData.invoice?.currencyCode
      ? shipmentData.invoice.currencyCode
      : 'USD', // Assuming USD for simplicity
    DeclareValue: shipmentData.invoice?.invoiceDetailList![0].currencyValue
      ? shipmentData.invoice?.invoiceDetailList[0].currencyValue
      : 0,
    ServiceCode: isTest ? 'ADC' : rate.serviceId,
    DutyType: 'DDU',
    Content: shipmentData.description || '',
    HawbItems: shipmentData.invoice
      ? shipmentData.invoice.invoiceDetailList!.map((p) => {
          return {
            Content: p.descriptionEn || '',
            Price: p.currencyValue || 0,
            Pieces: p.unitCount || 1,
            Weight: p.weight
              ? roundToTwoDecimal(
                  convertlib(p.weight).from(WeightUnit.LB).to(WeightUnit.KG)
                )
              : 0
          };
        })
      : [],
    HawbChildren: childHawItems
  };
  return requestBody;
};

export const callDPDOrderEndpoint = async (
  path: string,
  requestBody: DPDOrderRequestBody,
  token: string
): Promise<DPDOrderResponse> => {
  logger.info(`Calling DPD order endpoint at ${path}`);
  logger.info('Request Body:', JSON.stringify(requestBody, null, 2));
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
  try {
    const response = await axios.post(path, requestBody, {
      headers
    });
    return response.data as DPDOrderResponse;
  } catch (error) {
    logger.error('Error calling DPD order endpoint:', error);
    throw new Error(`DPD Order API call failed: ${error}`);
  }
};
