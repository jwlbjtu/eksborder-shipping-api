import axios from 'axios';
import fastParser from 'fast-xml-parser';
import {
  RuiYunCredentials,
  RuiYunLabelBody,
  RuiYunLabelOrderResult,
  RuiYunLabelRequest,
  RuiYunLabelResponse
} from '../../../types/carriers/rui_yun';
import { IShipping } from '../../../types/record.types';
import { Rate } from '../../../types/carriers/carrier';
import convertlib from 'convert-units';
import { WeightUnit } from '../../constants';
import { ApiPackage } from '../../../types/carriers/api';
import util from 'util';
import { roundToTwoDecimal } from '../../utils/helpers';

const options = {
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  parseTrueNumberOnly: true
};

export const buildRuiYunLabelReqBody = (
  shipmentData: IShipping,
  credentials: RuiYunCredentials,
  rate: Rate
): RuiYunLabelRequest => {
  const ruiYunLabelRequest: RuiYunLabelRequest = {
    clientInfo: {
      bankerId: credentials.bankerId,
      plantId: credentials.plantId,
      plantKey: credentials.plantKey,
      userId: credentials.userId
    },
    orderList: [
      {
        signature: shipmentData.signature ? shipmentData.signature : '0',
        orderId: shipmentData.orderId,
        priceId: rate.serviceId,
        description: shipmentData.description,
        referenceNumber: shipmentData.referenceNumber
          ? shipmentData.referenceNumber
          : shipmentData.orderId,
        packageType: shipmentData.packageList[0].packageType, // 02 - package
        taxdutyType: shipmentData.taxdutyType ? shipmentData.taxdutyType : 'R', // 'R',
        shipTo: {
          userName: shipmentData.toAddress.name!,
          companyName:
            shipmentData.toAddress.company || shipmentData.toAddress.name!,
          phoneNumber: shipmentData.toAddress.phone!,
          email: shipmentData.toAddress.email!,
          address: {
            address1: shipmentData.toAddress.street1,
            address2: shipmentData.toAddress.street2,
            city: shipmentData.toAddress.city,
            country: shipmentData.toAddress.country,
            province: shipmentData.toAddress.state!,
            postalCode: shipmentData.toAddress.zip
          }
        },
        packageList: shipmentData.packageList.map((ele) => {
          const unitOfMeasure = ele.weight.unitOfMeasure;
          const weight = ele.weight.value;
          const ruiYunWeight = roundToTwoDecimal(
            convertlib(weight).from(unitOfMeasure).to(WeightUnit.KG)
          );
          return {
            weight: ruiYunWeight,
            count: ele.count ? ele.count : 1
          } as ApiPackage;
        }),
        invoice: {
          currencyCode: shipmentData.invoice?.currencyCode
            ? shipmentData.invoice.currencyCode
            : 'USD',
          shipmentTerms: shipmentData.invoice?.shipmentTerms
            ? shipmentData.invoice.shipmentTerms
            : 'FOB',
          exportReason: shipmentData.invoice?.exportReason
            ? shipmentData.invoice.exportReason
            : 'SAMPLE',
          insuranceCharges: shipmentData.invoice?.insuranceCharges
            ? shipmentData.invoice.insuranceCharges
            : 0,
          freightCharges: shipmentData.invoice?.freightCharges
            ? shipmentData.invoice.freightCharges
            : 0,
          invoiceDetailList: shipmentData.invoice?.invoiceDetailList
            ? shipmentData.invoice.invoiceDetailList.map((ele) => {
                return {
                  descriptionEn: ele.descriptionEn || '',
                  descriptionCn: ele.descriptionCn || '',
                  partNumber: ele.partNumber || '',
                  commodityCode: ele.commodityCode || '',
                  weight: ele.weight ? ele.weight : 0,
                  currencyValue: ele.currencyValue ? ele.currencyValue : 0,
                  unitCount: ele.unitCount ? ele.unitCount : 0,
                  measure: ele.measure || '',
                  originCountry: ele.originalCountry || ''
                };
              })
            : []
        }
      }
    ]
  };
  // console.log(util.inspect(ruiYunLabelRequest, false, null, true));
  return ruiYunLabelRequest;
};

export const ruiYunOrderShipHandler = async (
  ruiYunLabelRequest: RuiYunLabelRequest,
  url: string
): Promise<RuiYunLabelResponse> => {
  const body: RuiYunLabelBody = {
    'soapenv:Body': {
      'ser:orderShip': {
        request: ruiYunLabelRequest
      }
    }
  };

  const Parser = fastParser.j2xParser;
  const xmlRequest = new Parser(options).parse(body);
  const xmlRequestString = `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.eship.logisticstb/"><soapenv:Header/>${xmlRequest}</soapenv:Envelope>`;
  // console.log(xmlRequestString);

  try {
    const response = await axios.post(url, xmlRequestString, {
      headers: {
        'Content-Type': 'application/xml;charset=UTF-8'
      }
    });
    // console.log(response.data);
    const result = fastParser.parse(response.data, options);
    const ruiYunLabelResponse: RuiYunLabelResponse =
      result['soap:Envelope']['soap:Body']['ns1:orderShipResponse'];
    const responseResult = ruiYunLabelResponse.return.result;
    const orderResult = ruiYunLabelResponse.return.orderResult;
    // console.log('Rui Yun Label API Result: ' + responseResult);
    // console.log(orderResult);
    if (responseResult) {
      const ruiYunRes: RuiYunLabelResponse = {
        return: {
          result: responseResult,
          orderResult: orderResult
        }
      };
      return ruiYunRes;
    } else {
      let msgs = (orderResult as RuiYunLabelOrderResult).messages;
      if (!msgs) msgs = [];
      if (!Array.isArray(msgs)) msgs = [msgs];
      const ruiYunRes: RuiYunLabelResponse = {
        return: {
          result: false,
          orderResult: [],
          message: msgs
            .map((ele) => ele.text.replace('睿云科技：', ''))
            .join(',')
        }
      };
      return ruiYunRes;
    }
  } catch (error) {
    const data = (error as any).response.data;
    const result = fastParser.parse(data, options);
    // console.log(result);
    const msg = result['soap:Envelope']['soap:Body']['soap:Fault'].faultstring;
    // console.log(msg);
    const ruiYunRes: RuiYunLabelResponse = {
      return: {
        result: false,
        orderResult: [],
        message: msg.replace('睿云科技：', '')
      }
    };
    console.log(ruiYunRes);
    return ruiYunRes;
  }
};
