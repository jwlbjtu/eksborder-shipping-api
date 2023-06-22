import convert from 'convert-units';
import { Rate } from '../../../../types/carriers/carrier';
import {
  FedexRestAddress,
  FedexRestCommodity,
  FedexRestContact,
  FedexRestCustomsClearanceDetail,
  FedexRestLabelRecipient,
  FedexRestLabelRequest,
  FedexRestLabelResponse,
  FedexRestLabelShipper,
  FedexRestPackageLineItem,
  FedexRestRequestedShipment,
  FedexRestShippingAddress
} from '../../../../types/carriers/fedex.rest';
import {
  FormData,
  IShipping,
  LabelData,
  ShippingRate
} from '../../../../types/record.types';
import { IAddress } from '../../../../types/shipping.types';
import { isShipmentInternational } from '../../carrier.helper';
import FedexAuthHelper from './auth.helper';
import axios from 'axios';
import util from 'util';
import { logger } from '../../../logger';
import { CARRIERS } from '../../../constants';
import { isWeightGreater } from '../label.helper';
import { computeTotalShipmentWeight } from '../../../utils/helpers';

const labelUrl = '/ship/v1/shipments';

export const buildFedexRestLabelRequest = (
  accountNumber: string,
  hubId: string,
  shipmentData: IShipping,
  rate: Rate
): FedexRestLabelRequest => {
  const requestedShipment: FedexRestRequestedShipment = {
    shipDatestamp: buildDateString(shipmentData.shipmentOptions.shipmentDate),
    shipper: buildFedexShipper(shipmentData.sender),
    recipients: [buildFedexShipper(shipmentData.toAddress)],
    pickupType: 'CONTACT_FEDEX_TO_SCHEDULE',
    serviceType: rate.serviceId,
    packagingType: 'YOUR_PACKAGING',
    totalWeight: computeTotalWeight(shipmentData),
    shippingChargesPayment: {
      paymentType: 'SENDER',
      payor: {
        accountNumber: { value: accountNumber }
      }
    }
  };

  if (isShipmentInternational(shipmentData)) {
    requestedShipment.shipmentSpecialServices = {
      specialServiceTypes: ['ELECTRONIC_TRADE_DOCUMENTS'],
      etdDetail: {
        requestedDocumentTypes: ['COMMERCIAL_INVOICE']
      }
    };
    requestedShipment.customsClearanceDetail =
      buildFedexRestCustomClearanceDetail(shipmentData, accountNumber);
  }

  if (rate.serviceId === 'SMART_POST') {
    const totalWeight = computeTotalShipmentWeight(shipmentData);
    const greaterThan1lb = isWeightGreater(totalWeight, 1);
    requestedShipment.smartPostDetail = {
      indicia: shipmentData.isReturn
        ? 'PARCEL_RETURN'
        : greaterThan1lb
        ? 'PARCEL_SELECT'
        : 'PRESORTED_STANDARD',
      ancillaryEndorsement: 'ADDRESS_CORRECTION',
      hubId
    };
  }

  requestedShipment.labelSpecification = {
    labelFormatType: 'COMMON2D',
    imageType: 'PDF',
    labelStockType: 'STOCK_4X6',
    labelOrder: 'SHIPPING_LABEL_FIRST'
  };

  requestedShipment.shippingDocumentSpecification = {
    shippingDocumentTypes: ['COMMERCIAL_INVOICE'],
    commercialInvoiceDetail: {
      documentFormat: {
        stockType: 'PAPER_LETTER',
        docType: 'PDF'
      }
    }
  };

  requestedShipment.totalPackageCount = shipmentData.morePackages
    ? shipmentData.morePackages.length + 1
    : 1;
  requestedShipment.requestedPackageLineItems =
    buildFedexRestLabelPackageLineItems(shipmentData);

  const result: FedexRestLabelRequest = {
    requestedShipment: requestedShipment,
    labelResponseOptions: 'LABEL',
    accountNumber: { value: accountNumber }
  };

  return result;
};

const buildFedexShipper = (
  localtion: IAddress
): FedexRestLabelShipper | FedexRestLabelRecipient => {
  const address: FedexRestShippingAddress = {
    streetLines: localtion.street2
      ? [localtion.street1, localtion.street2]
      : [localtion.street1],
    city: localtion.city,
    stateOrProvinceCode: localtion.state,
    postalCode: localtion.zip,
    countryCode: localtion.country,
    residential: localtion.isResidential ? localtion.isResidential : false
  };

  const contact: FedexRestContact = {
    personName: localtion.name!,
    companyName: localtion.company ? localtion.company : '',
    phoneNumber: localtion.phone!,
    emailAddress: localtion.email ? localtion.email : ''
  };

  const result = {
    address,
    contact
  };

  return result;
};

const buildDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const computeTotalWeight = (shipment: IShipping): number => {
  const packageinfo = shipment.packageInfo;
  const morePackages = shipment.morePackages;
  if (packageinfo) {
    const data = { ...packageinfo.weight };
    if (morePackages && morePackages.length > 0) {
      const total = morePackages.reduce(
        (acumulator, ele) => acumulator + ele.weight.value,
        0
      );
      data.value += total;
    }
    return convert(data.value).from(data.unitOfMeasure).to('lb');
  }
  return 0;
};

const buildFedexRestLabelPackageLineItems = (
  shipment: IShipping
): FedexRestPackageLineItem[] => {
  const packageInfo = shipment.packageInfo;
  if (!packageInfo) {
    return [];
  }
  let pkList = [packageInfo];
  const morePackages = shipment.morePackages;
  if (morePackages && morePackages.length > 0) {
    pkList = pkList.concat(morePackages);
  }
  return pkList.map((pk, index) => {
    const weight = convert(pk.weight.value)
      .from(pk.weight.unitOfMeasure)
      .to('lb');
    const result: FedexRestPackageLineItem = {
      sequenceNumber: index + 1,
      groupPackageCount: 1,
      weight: {
        value: weight,
        units: 'LB'
      },
      dimensions: {
        length: parseInt(pk.dimentions!.length.toFixed(0)),
        width: parseInt(pk.dimentions!.width.toFixed(0)),
        height: parseInt(pk.dimentions!.height.toFixed(0)),
        units: pk.dimentions!.unitOfMeasure.toUpperCase()
      }
    };
    return result;
  });
};

const buildFedexRestCustomClearanceDetail = (
  shipment: IShipping,
  accountNumber: string
): FedexRestCustomsClearanceDetail => {
  const customItems = shipment.customItems!;
  const customValue = customItems?.reduce(
    (acumulator, ele) => acumulator + ele.totalValue,
    0
  );
  const commodities = customItems?.map((item) => {
    const com: FedexRestCommodity = {
      numberOfPieces: item.quantity,
      description: item.itemTitle,
      countryOfManufacture: item.country!,
      weight: {
        units: item.itemWeightUnit.toUpperCase() as 'LB' | 'KG',
        value: item.itemWeight
      },
      quantity: item.quantity,
      quantityUnits: 'EA',
      unitPrice: {
        amount: item.itemValue,
        currency: item.itemValueCurrency
      },
      customsValue: {
        amount: item.totalValue,
        currency: item.itemValueCurrency
      }
    };
    return com;
  });

  const result: FedexRestCustomsClearanceDetail = {
    dutiesPayment: {
      paymentType: 'SENDER',
      payor: {
        responsibleParty: {
          accountNumber: { value: accountNumber }
        }
      }
    },
    commercialInvoice: {
      shipmentPurpose: 'SOLD'
    },
    isDocumentOnly: false,
    totalCustomsValue: {
      amount: customValue,
      currency: 'USD'
    },
    commodities: commodities
  };
  return result;
};

export const fedexRestLabelService = async (
  apiUrl: string,
  apiKey: string,
  apiSecret: string,
  reqBody: FedexRestLabelRequest,
  isTest: boolean
): Promise<{
  labels: LabelData[];
  forms: FormData[] | undefined;
  shippingRate: ShippingRate[];
}> => {
  // Get auth token
  const token = await FedexAuthHelper.getToken(
    apiUrl,
    apiKey,
    apiSecret,
    isTest
  );
  // Send request
  const url = `${apiUrl}${labelUrl}`;
  const response = await axios.post(url, reqBody, {
    headers: {
      Authorization: `Bearer ${token?.access_token}`,
      'Content-Type': 'application/json'
    }
  });
  logger.info(util.inspect(response.data, true, null));
  const result = processFedexRestLabelResponse(response.data, isTest);
  return {
    labels: result.labels,
    forms: result.forms,
    shippingRate: result.shippingRate
  };
};

const processFedexRestLabelResponse = (
  data: FedexRestLabelResponse,
  isTest: boolean
): {
  labels: LabelData[];
  forms: FormData[] | undefined;
  shippingRate: ShippingRate[];
} => {
  const output = data.output;
  const transactionShipments = output.transactionShipments;
  const labels: LabelData[] = [];
  let forms: FormData[] | undefined = undefined;
  const shippingRate: ShippingRate[] = [];
  for (let i = 0; i < transactionShipments.length; i++) {
    const transactionShipment = transactionShipments[i];
    const pieceResponses = transactionShipment.pieceResponses;
    for (let j = 0; j < pieceResponses.length; j++) {
      const pieceResponse = pieceResponses[j];
      const packageDocuments = pieceResponse.packageDocuments;
      const label = packageDocuments.find(
        (item) => item.contentType === 'LABEL'
      );
      const labelData: LabelData = {
        masterTracking: pieceResponse.masterTrackingNumber,
        carrier: CARRIERS.FEDEX,
        createdOn: new Date(),
        service: transactionShipment.serviceName,
        tracking: pieceResponse.trackingNumber,
        data: label!.encodedLabel,
        format: label!.docType,
        encodeType: 'BASE64',
        isTest
      };
      labels.push(labelData);
    }

    const shipmentDocuments = transactionShipment.shipmentDocuments;
    const invoice = shipmentDocuments.find(
      (item) => item.contentType === 'COMMERCIAL_INVOICE'
    );
    let formData: FormData | undefined = undefined;
    if (invoice) {
      formData = {
        data: invoice.encodedLabel,
        format: invoice.docType,
        encodeType: 'BASE64'
      };
      if (!forms) forms = [];
      forms.push(formData);
    }
    const shipmentRateDetails =
      transactionShipment.completedShipmentDetail.shipmentRating
        .shipmentRateDetails;
    for (let i = 0; i < shipmentDocuments.length; i++) {
      const shipmentRateDetail = shipmentRateDetails[i];
      const rate: ShippingRate = {
        rate: shipmentRateDetail.totalNetCharge,
        currency: shipmentRateDetail.currency
      };
      shippingRate.push(rate);
    }
  }
  return { labels, forms, shippingRate };
};
