import { Rate } from '../../../types/carriers/carrier';
import {
  CustomsClearanceDetail,
  FedexAddress,
  FedexCommodity,
  FedexContact,
  FedexCredential,
  FedexLabelReqBody,
  FedexLabelResponse,
  FedexShipper
} from '../../../types/carriers/fedex';
import {
  IShipping,
  LabelData,
  PackageInfo,
  FormData
} from '../../../types/record.types';
import { generateAuthentication } from './fedex.helpers';
import path from 'path';
import { isShipmentInternational } from '../carrier.helper';
import { createClientAsync } from 'soap';
import util from 'util';
import { logger } from '../../logger';
import { CARRIERS, Country } from '../../constants';
import { IAddress } from '../../../types/shipping.types';
import {
  computeTotalShipmentWeight,
  roundToTwoDecimal
} from '../../utils/helpers';

const wsdl = path.join(
  __dirname,
  '../../../../static/wsdl/ShipService_v26.wsdl'
);
const endpointPath = '/web-services';
const version = {
  ServiceId: 'ship',
  Major: 26,
  Intermediate: 0,
  Minor: 0
};

export const buildFedexLabelReqBody = (
  credential: FedexCredential,
  shipmentData: IShipping,
  rate: Rate,
  isMPS: boolean,
  masterTrackingNumber: string,
  packageCount: number,
  packageInfo: PackageInfo,
  sequenceNumber: number
): FedexLabelReqBody => {
  const fedexAuth = generateAuthentication(credential, version);
  const totalWeight = computeTotalShipmentWeight(shipmentData);
  const result: FedexLabelReqBody = {
    ...fedexAuth,
    RequestedShipment: {
      ShipTimestamp: new Date(
        new Date(shipmentData.shipmentOptions.shipmentDate).getTime() +
          24 * 60 * 60 * 1000
      ).toISOString(),
      DropoffType: 'REGULAR_PICKUP',
      ServiceType: rate.serviceId,
      PackagingType: 'YOUR_PACKAGING',
      TotalWeight: {
        Units: totalWeight.unitOfMeasure.toUpperCase(),
        Value: roundToTwoDecimal(totalWeight.value)
      },
      Shipper: ceateFedexShipper(shipmentData.sender),
      Recipient: ceateFedexShipper(shipmentData.toAddress),
      ShippingChargesPayment: {
        PaymentType: 'SENDER',
        Payor: {
          ResponsibleParty: {
            AccountNumber: credential.accountNumber
          }
        }
      }
    }
  };

  if (isShipmentInternational(shipmentData)) {
    result.RequestedShipment.SpecialServicesRequested = {
      SpecialServiceTypes: ['ELECTRONIC_TRADE_DOCUMENTS'],
      EtdDetail: {
        RequestedDocumentCopies: ['COMMERCIAL_INVOICE']
      }
    };
    result.RequestedShipment.CustomsClearanceDetail =
      buildFedexCustomClearanceDetail(shipmentData, credential.accountNumber);
  }

  if (rate.serviceId === 'SMART_POST') {
    result.RequestedShipment.SmartPostDetail = {
      ProcessingOptionsRequested: undefined,
      Indicia: 'PARCEL_SELECT',
      AncillaryEndorsement: 'ADDRESS_CORRECTION',
      HubId: credential.hubId
    };
  }

  result.RequestedShipment.LabelSpecification = {
    LabelFormatType: 'COMMON2D',
    ImageType: 'PDF',
    LabelStockType: 'STOCK_4X6'
  };

  if (isShipmentInternational(shipmentData)) {
    result.RequestedShipment.ShippingDocumentSpecification = {
      ShippingDocumentTypes: ['COMMERCIAL_INVOICE'],
      CommercialInvoiceDetail: {
        Format: {
          ImageType: 'PDF',
          StockType: 'PAPER_LETTER'
        }
      }
    };
  }

  if (isMPS) {
    result.RequestedShipment.MasterTrackingId = {
      TrackingNumber: masterTrackingNumber
    };
  }

  result.RequestedShipment.PackageCount = packageCount;
  result.RequestedShipment.RequestedPackageLineItems = [
    {
      SequenceNumber: sequenceNumber,
      GroupPackageCount: 1,
      Weight: {
        Units: packageInfo.weight.unitOfMeasure.toUpperCase(),
        Value: roundToTwoDecimal(packageInfo.weight.value)
      },
      Dimensions: {
        Length: parseInt(packageInfo.dimentions!.length.toFixed(0)),
        Width: parseInt(packageInfo.dimentions!.width.toFixed(0)),
        Height: parseInt(packageInfo.dimentions!.height.toFixed(0)),
        Units: packageInfo.dimentions!.unitOfMeasure.toUpperCase()
      }
    }
  ];

  return result;
};

export const buildFedexCustomClearanceDetail = (
  shipment: IShipping,
  accountNumber: string
): CustomsClearanceDetail => {
  const customItems = shipment.customItems!;
  const customValue = customItems.reduce(
    (acumulator, ele) => acumulator + ele.totalValue,
    0
  );
  const commodities = customItems.map((ele) => {
    const com: FedexCommodity = {
      NumberOfPieces: ele.quantity,
      Description: ele.itemTitle,
      CountryOfManufacture: ele.country!,
      Weight: {
        Units: ele.itemWeightUnit.toUpperCase(),
        Value: ele.itemWeight
      },
      Quantity: ele.quantity,
      QuantityUnits: 'EA',
      UnitPrice: {
        Currency: ele.itemValueCurrency,
        Amount: ele.itemValue
      },
      CustomsValue: {
        Currency: ele.itemValueCurrency,
        Amount: ele.totalValue
      }
    };
    return com;
  });
  const result: CustomsClearanceDetail = {
    DutiesPayment: {
      PaymentType: 'SENDER',
      Payor: {
        ResponsibleParty: {
          AccountNumber: accountNumber
        }
      }
    },
    DocumentContent: 'NON_DOCUMENTS',
    CustomsValue: {
      Currency: 'USD',
      Amount: customValue
    },
    Commodities: commodities
  };
  return result;
};

export const callFedExLanelEndpoint = async (
  apiUrl: string,
  reqBody: FedexLabelReqBody,
  isTest: boolean
): Promise<{ labels: LabelData[]; forms: FormData[] | undefined }> => {
  const options = {
    endpoint: `${apiUrl}${endpointPath}`
  };
  const client = await createClientAsync(wsdl, options);
  const response = await client.processShipmentAsync(reqBody);
  logger.info(util.inspect(response[0], true, null));
  const processedResponse = processFedexLabelResponse(response[0], isTest);
  return {
    labels: [processedResponse.label],
    forms: processedResponse.form ? [processedResponse.form] : undefined
  };
};

export const processFedexLabelResponse = (
  response: FedexLabelResponse,
  isTest: boolean
): { label: LabelData; form: FormData | undefined } => {
  const severity = response.HighestSeverity;
  if (severity === 'ERROR') {
    const notifications = response.Notifications;
    const error = notifications.find((ele) => ele.Severity === 'ERROR');
    if (error) throw new Error(error.Message);
  }
  const label =
    response.CompletedShipmentDetail.CompletedPackageDetails[0].Label;
  const labelData: LabelData = {
    carrier: CARRIERS.FEDEX,
    createdOn: new Date(),
    service: response.CompletedShipmentDetail.ServiceDescription.Description,
    tracking: response.CompletedShipmentDetail.MasterTrackingId.TrackingNumber,
    data: label.Parts[0].Image,
    encodeType: 'BASE64',
    format: label.ImageType,
    isTest
  };

  let formData: FormData | undefined = undefined;
  const shipmentDocuments = response.CompletedShipmentDetail.ShipmentDocuments;
  if (shipmentDocuments && shipmentDocuments.length > 0) {
    const document = shipmentDocuments[0];
    formData = {
      data: document.Parts[0].Image,
      format: document.ImageType,
      encodeType: 'BASE64'
    };
  }

  return { label: labelData, form: formData };
};

export const ceateFedexShipper = (address: IAddress): FedexShipper => {
  const contact: FedexContact = {
    PersonName: address.name!,
    CompanyName: address.company,
    PhoneNumber: address.phone!
  };
  const fAddress: FedexAddress = {
    StreetLines: [address.street1, address.street2 || ''],
    City: address.city,
    StateOrProvinceCode:
      address.country === Country.USA || address.country === Country.CANADA
        ? address.state!
        : 'XX',
    PostalCode: address.zip,
    CountryCode: address.country,
    Residential: false
  };

  return { Contact: contact, Address: fAddress };
};
