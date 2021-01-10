import { trackingNumberGenerator } from './tracking-generator';
import { createBarcode } from './barcode';
import { generateLabel } from './label-image';
import {
  IFlatShippingInfo,
  ILabelRequest,
  ILabelResponse
} from '../../../types/shipping.types';
import { IAccount, IUser } from '../../../types/user.types';

export const createFlatLabel = async (
  body: ILabelRequest,
  account: IAccount,
  user?: IUser
): Promise<ILabelResponse | undefined> => {
  // Generate tracking number
  const trackingNumber = trackingNumberGenerator();
  // Genereate bardcode based on the tracking number
  const barcode = await createBarcode(trackingNumber);
  // Create Shipping Info from Body
  const shippingInfo = shippingInfoFromBody(body, account);
  // Generate PNG format label buffer
  const labelBuffer = await generateLabel(shippingInfo, barcode, user);
  const createdDate = new Date();
  // Encode to base64
  const labelData = labelBuffer.toString('base64');
  // generate Flat response
  return generateResponse(body, trackingNumber, labelData, createdDate);
};

const generateResponse = (
  body: ILabelRequest,
  trackingId: any,
  labelData: string,
  createdOn: Date
) => {
  const labelRespsone: ILabelResponse = {
    timestamp: new Date(),
    carrier: body.carrier,
    service: body.service,
    facility: body.facility,
    carrierAccount: body.carrierAccount,
    labels: [
      {
        createdOn,
        trackingId,
        labelData,
        encodeType: 'BASE64',
        format: 'PNG'
      }
    ],
    shippingId: trackingId
  };

  return labelRespsone;
};

const shippingInfoFromBody = (
  body: ILabelRequest,
  account: IAccount
): IFlatShippingInfo => {
  const weight = body.packageDetail.weight;

  const shippingInfo: IFlatShippingInfo = {
    fromAddress: account.carrierRef.returnAddress,
    toAddress: body.toAddress,
    service: `${body.carrier} ${body.service}`,
    number: 1,
    weight: `${weight.value} ${weight.unitOfMeasure}`
  };
  return shippingInfo;
};
