import axios from 'axios';
import uniqid from 'uniqid';
import {
  CARRIERS,
  Currency,
  DHL_ECOM_SERVICE_TIMES,
  PARCELSELITE_NAME,
  INCOTERM
} from '../../constants';
import convertToDHLAddress from './dhl_ecommerce.helpers';
import util from 'util';
import { roundToTwoDecimal } from '../../utils/helpers';
import dayjs from 'dayjs';
import { IFacility, IShipping } from '../../../types/record.types';
import {
  IDHLeCommerceCustomsDetail,
  IDHLeCommercePackageDetail,
  IDHLeCommerceProduct,
  IDHLeCommerceProductRequest,
  IDHLeCommerceProductResponse
} from '../../../types/carriers/dhl_ecommerce';
import { Rate } from '../../../types/carriers/carrier';
import { logger } from '../../logger';
import { IAccount } from '../../../types/user.types';

const DHL_ECOM_ROUTES = {
  PRODUCTS_FINDER: '/shipping/v4/products'
};

export const callDhlEcommerceProductsEndpoint = async (
  api_url: string,
  prodReqBody: IDHLeCommerceProductRequest,
  headers: Record<string, string>,
  shipmentData: IShipping,
  isTest: boolean,
  clientCarrier: IAccount | undefined
): Promise<{ rates: Rate[]; errors: string[] }> => {
  if (!clientCarrier) return { rates: [], errors: [] };
  const response = await axios.post(
    api_url + DHL_ECOM_ROUTES.PRODUCTS_FINDER,
    prodReqBody,
    { headers: headers }
  );
  logger.info(
    `DHL eCommerce response for User ${shipmentData.userRef} with Order ${shipmentData._id}`
  );
  logger.info(util.inspect(response.data, true, null));

  const dhlProdResponse: IDHLeCommerceProductResponse = response.data;
  const prodResponse: Rate[] = [];
  const errors: string[] = [];
  if (dhlProdResponse.products) {
    for (const item of dhlProdResponse.products) {
      if (
        !item.messages ||
        (item.messages.length === 1 && item.messages[0].messageId === '300')
      ) {
        prodResponse.push(
          convertIDHLeCommerceProductToRate(item, isTest, clientCarrier)
        );
      }
    }
  }

  if (dhlProdResponse.invalidParams) {
    for (const item of dhlProdResponse.invalidParams) {
      errors.push(
        `${CARRIERS.DHL_ECOMMERCE} Error: [${item.name}]-${item.reason}`
      );
    }
  }

  logger.info('Return data from DHL eCommerce [Product Finder] endpoint');
  logger.info(util.inspect(prodResponse, true, null));
  logger.info(util.inspect(errors, true, null));
  return { rates: prodResponse, errors };
};

const getDHLeComServiceTime = (serviceId: string): string => {
  const time = DHL_ECOM_SERVICE_TIMES[serviceId];
  if (!time) return 'N/A';
  return time;
};

const convertIDHLeCommerceProductToRate = (
  dhlProduct: IDHLeCommerceProduct,
  isTest: boolean,
  clientCarrier: IAccount
): Rate => {
  const rate: Rate = {
    carrier: CARRIERS.DHL_ECOMMERCE,
    serviceId: dhlProduct.orderedProductId,
    service: dhlProduct.productName.replace('DHL SmartMail ', ''),
    rate: dhlProduct.rate ? dhlProduct.rate.amount : undefined,
    currency: dhlProduct.rate
      ? dhlProduct.rate.currency.toUpperCase()
      : Currency.USD,
    eta: dhlProduct.estimatedDeliveryDate
      ? `${dhlProduct.estimatedDeliveryDate.deliveryDaysMin} days`
      : getDHLeComServiceTime(dhlProduct.orderedProductId),
    isTest,
    clientCarrierId: clientCarrier.id.toString()
  };
  return rate;
};

export const buildDhlEcommerceProductReqBody = (
  shipmentData: IShipping,
  facilityObj: IFacility,
  isInternational: boolean
): IDHLeCommerceProductRequest => {
  const dhlPackageDetail: IDHLeCommercePackageDetail = {
    packageId: uniqid('PP'),
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

  if (isInternational) {
    dhlPackageDetail.shippingCost = {
      currency: Currency.USD,
      dutiesPaid:
        shipmentData.customDeclaration!.incoterm === INCOTERM.DDP.value
    };
  }

  const prodReqBody: IDHLeCommerceProductRequest = {
    pickup: facilityObj.pickup,
    distributionCenter: facilityObj.facility,
    consigneeAddress: convertToDHLAddress(shipmentData.toAddress),
    returnAddress: convertToDHLAddress(shipmentData.return),
    packageDetail: dhlPackageDetail,
    rate: {
      calculate: true,
      currency: shipmentData.orderCurrency || Currency.USD,
      rateDate: dayjs(shipmentData.shipmentOptions.shipmentDate).format(
        'YYYY-MM-DD'
      )
    },
    estimatedDeliveryDate: {
      calculate: true
    }
  };

  if (shipmentData.service) {
    prodReqBody.orderedProductId = shipmentData.service.key;
  }

  if (isInternational) {
    const customsDetails = shipmentData.customItems!.map((ele) => {
      const detail: IDHLeCommerceCustomsDetail = {
        itemDescription: ele.itemTitle,
        countryOfOrigin: ele.country!,
        packagedQuantity: ele.quantity,
        itemValue: ele.itemValue,
        currency: ele.itemValueCurrency,
        skuNumber: ele.sku!
      };
      return detail;
    });
    prodReqBody.customsDetails = customsDetails;
  }

  return prodReqBody;
};
