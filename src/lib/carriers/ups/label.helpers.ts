import axios from 'axios';
import {
  CARRIERS,
  UPS_SERVICE_IDS,
  UPS_WEIGHT_UNITS,
  UPS_WEIGHT_UNITS_REVERSE,
  WeightUnit
} from '../../constants';
import { roundToTwoDecimal } from '../../utils/helpers';
import { buildUPSLabelPackages, convertToUPSAddress } from './ups.helpers';

import dayjs from 'dayjs';
import util from 'util';
import {
  FormData,
  IShipping,
  IThirdPartyAccount,
  LabelData,
  ShippingRate
} from '../../../types/record.types';
import {
  InternationalForms,
  UPSLabelPaymentInfo,
  UPSLabelReqBody,
  UPSLabelResponse,
  UPSProduct,
  UPSShipper
} from '../../../types/carriers/ups';
import { Rate } from '../../../types/carriers/carrier';
import ThirdPartySchema from '../../../models/thirdparty.model';
import { isShipmentInternational } from '../carrier.helper';
import IdGenerator from '../../utils/IdGenerator';
import { logger } from '../../logger';
import convertlib from 'convert-units';

const shipEndpoint = '/ship/v1801/shipments';

export const buildUpsLabelReqBody = async (
  shipment: IShipping,
  accountNum: string,
  shipperInfo: UPSShipper,
  rate: Rate
): Promise<UPSLabelReqBody> => {
  const packages = buildUPSLabelPackages(shipment);
  let thirdpartyAcct: IThirdPartyAccount | null = null;
  if (rate.thirdparty) {
    thirdpartyAcct = await ThirdPartySchema.findOne({
      _id: rate.thirdpartyAcctId
    });
  }
  const paymentInformation: UPSLabelPaymentInfo = rate.thirdparty
    ? {
        ShipmentCharge: {
          Type: '01',
          BillReceiver: {
            AccountNumber: thirdpartyAcct!.accountNum,
            Address: {
              PostalCode: thirdpartyAcct!.zipCode!,
              CountryCode: thirdpartyAcct!.countryCode
            }
          }
        }
      }
    : {
        ShipmentCharge: {
          Type: '01',
          BillShipper: {
            AccountNumber: accountNum
          }
        }
      };

  const upsLabelRequest: UPSLabelReqBody = {
    ShipmentRequest: {
      Shipment: {
        Description:
          shipment.customItems && shipment.customItems.length > 0
            ? shipment.customItems[0].itemTitle
            : '',
        Shipper: shipperInfo,
        ShipTo: {
          Name: shipment.toAddress.company || shipment.toAddress.name!,
          AttentionName: shipment.toAddress.company || shipment.toAddress.name,
          Phone: {
            Number: shipment.toAddress.phone!
          },
          EMailAddress: shipment.toAddress.email,
          Address: convertToUPSAddress(shipment.toAddress)
        },
        ShipFrom: {
          Name: shipment.sender.company || shipment.sender.name!,
          AttentionName: shipment.sender.company || shipment.sender.name,
          Phone: {
            Number: shipment.sender.phone!
          },
          EMailAddress: shipment.sender.email,
          Address: convertToUPSAddress(shipment.sender)
        },
        PaymentInformation: paymentInformation,
        Service: {
          Code: rate.serviceId,
          Description: rate.service
        },
        Package: packages,
        ItemizedChargesRequestedIndicator: '',
        RatingMethodRequestedIndicator: '',
        TaxInformationIndicator: '',
        ShipmentRatingOptions: {
          NegotiatedRatesIndicator: ''
        }
      },
      LabelSpecification: {
        LabelImageFormat: {
          Code: 'PNG'
        },
        LabelStockSize: {
          Height: '8',
          Width: '4'
        }
      }
    }
  };

  const isInternational = isShipmentInternational(shipment);
  if (isInternational) {
    const forms = await generateInternationalForm(shipment);
    upsLabelRequest.ShipmentRequest.Shipment.ShipmentServiceOptions = {
      InternationalForms: forms
    };
  }

  if (
    shipment.service &&
    shipment.service.id === UPS_SERVICE_IDS.UPS_SUREPOST_LIGHT &&
    !(shipment.morePackages && shipment.morePackages.length > 0)
  ) {
    const weight =
      upsLabelRequest.ShipmentRequest.Shipment.Package[0].PackageWeight;
    const ozsWeight = convertlib(parseFloat(weight.Weight))
      .from(
        UPS_WEIGHT_UNITS_REVERSE[weight.UnitOfMeasurement.Code] as WeightUnit
      )
      .to(WeightUnit.OZ);

    upsLabelRequest.ShipmentRequest.Shipment.Package[0].PackageWeight = {
      UnitOfMeasurement: { Code: UPS_WEIGHT_UNITS[WeightUnit.OZ] },
      Weight: roundToTwoDecimal(ozsWeight).toString()
    };
  }

  return upsLabelRequest;
};

const generateInternationalForm = async (
  shipment: IShipping
): Promise<InternationalForms> => {
  const customDeclaration = shipment.customDeclaration!;
  const customItems = shipment.customItems!;

  const products = customItems.map((ele) => {
    const product: UPSProduct = {
      Description: ele.itemTitle,
      Unit: {
        Number: ele.quantity.toString(),
        UnitOfMeasurement: {
          Code: 'PCS' // Pieces
        },
        Value: ele.itemValue.toFixed(2)
      },
      CommodityCode: ele.sku,
      OriginCountryCode: ele.country!
    };
    return product;
  });

  const createShippingInvoiceNum = async (
    orderDate: string
  ): Promise<string> => {
    const id = await IdGenerator.generateId('ups_invoice');
    return `${orderDate}${id}`;
  };

  const forms: InternationalForms = {
    FormType: '01', // invoice
    InvoiceDate: dayjs(shipment.shipmentOptions.shipmentDate).format(
      'YYYYMMDD'
    ),
    InvoiceNumber: await createShippingInvoiceNum(
      dayjs(shipment.shipmentOptions.shipmentDate).format('YYYYMMDD')
    ),
    ReasonForExport: customDeclaration.typeOfContent,
    CurrencyCode: customItems[0].itemValueCurrency,
    Contacts: {
      SoldTo: {
        Name: shipment.toAddress.company || shipment.toAddress.name!,
        AttentionName: shipment.toAddress.company || shipment.toAddress.name,
        Phone: {
          Number: shipment.toAddress.phone!
        },
        EMailAddress: shipment.toAddress.email,
        Address: convertToUPSAddress(shipment.toAddress)
      }
    },
    Product: products
  };

  return forms;
};

export const callUpsLabelEndpoint = async (
  apiUrl: string,
  labelReqBody: UPSLabelReqBody,
  headers: Record<string, string>,
  serviceId: string,
  isTest: boolean
): Promise<{
  labels: LabelData[];
  forms: FormData[] | undefined;
  shippingRate: ShippingRate[];
}> => {
  const url = apiUrl + shipEndpoint;
  const response = await axios.post(url, labelReqBody, { headers: headers });

  const upsLabelResponse: UPSLabelResponse = response.data;
  logger.info(util.inspect(upsLabelResponse, true, null));

  const shippingCharges =
    upsLabelResponse.ShipmentResponse.ShipmentResults.ShipmentCharges
      .TotalCharges;
  const shippingRate: ShippingRate[] = [
    {
      rate: parseFloat(shippingCharges.MonetaryValue),
      currency: shippingCharges.CurrencyCode
    }
  ];

  const upsPackage =
    upsLabelResponse.ShipmentResponse.ShipmentResults.PackageResults;
  if (Array.isArray(upsPackage)) {
    const result: LabelData[] = [];

    for (let i = 0; i < upsPackage.length; i += 1) {
      const label = upsPackage[i];
      const labelData: LabelData = {
        carrier: CARRIERS.UPS,
        service: serviceId,
        tracking: label.TrackingNumber,
        createdOn: new Date(),
        data: label.ShippingLabel.GraphicImage,
        format: label.ShippingLabel.ImageFormat.Code,
        encodeType: 'BASE64',
        isTest
      };
      result.push(labelData);
    }

    const forms: FormData[] = [];
    if (upsLabelResponse.ShipmentResponse.ShipmentResults.Form) {
      const upsForms = upsLabelResponse.ShipmentResponse.ShipmentResults.Form;
      const fm: FormData = {
        data: upsForms.Image.GraphicImage,
        format: upsForms.Image.ImageFormat.Code,
        encodeType: 'BASE64'
      };
      forms.push(fm);
    }

    logger.info('Return data from UPS [Label] endpoint');
    return { labels: result, forms, shippingRate };
  } else {
    const result: LabelData[] = [
      {
        carrier: CARRIERS.UPS,
        service: serviceId,
        tracking: upsPackage.TrackingNumber,
        createdOn: new Date(),
        data: upsPackage.ShippingLabel.GraphicImage,
        format: upsPackage.ShippingLabel.ImageFormat.Code,
        encodeType: 'BASE64',
        isTest
      }
    ];

    const forms: FormData[] = [];
    if (upsLabelResponse.ShipmentResponse.ShipmentResults.Form) {
      const upsForms = upsLabelResponse.ShipmentResponse.ShipmentResults.Form;
      const fm: FormData = {
        data: upsForms.Image.GraphicImage,
        format: upsForms.Image.ImageFormat.Code,
        encodeType: 'BASE64'
      };
      forms.push(fm);
    }

    logger.info('Return data from UPS [Label] endpoint');
    return { labels: result, forms, shippingRate };
  }
};
