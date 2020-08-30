import { trackingNumberGenerator } from "./tracking-generator";
import { createBarcode } from "./barcode";
import { generateLabel } from "./label-image";

export interface IAddress {
    name?: string,
    companyName?: string,
    street1: string,
    street2?: string,
    city: string,
    state: string,
    country: string,
    postal_code: string
}

export interface IFlatShippingInfo {
    fromAddress: IAddress,
    toAddress: IAddress,
    service: string,
    number: number,
    weight: string
};

export const createFlatLabel = async (body: any, account: any) => {
    // Generate tracking number
    const trackingNumber = trackingNumberGenerator();
    // Genereate bardcode based on the tracking number
    const barcode = await createBarcode(trackingNumber);
    // Create Shipping Info from Body
    const shippingInfo = shippingInfoFromBody(body, account);
    // @ts-ignore // Generate PNG format label buffer
    const labelBuffer = await generateLabel(shippingInfo, barcode);
    const createdDate = new Date();
    // Encode to base64
    const labelData = labelBuffer.toString("base64");
    // generate Flat response
    return generateResponse(body, trackingNumber, labelData, createdDate);
};

const generateResponse = (body: any, trackingId: any, labelData: string, createdOn: Date) => {
    const labelRespsone = {
        timestamp: new Date(),
        carrier: body.carrier,
        service: body.service,
        labels: [
            {
                createdOn,
                trackingId,
                labelData,
                encodeType: "BASE64",
                format: "PNG"
            }
        ]
    }

    return labelRespsone;
}

const shippingInfoFromBody = (body: any, account: any): IFlatShippingInfo => {
    const weight = body.packageDetail.weight;

    const shippingInfo: IFlatShippingInfo = {
        fromAddress: account.carrierRef.returnAddress,
        toAddress: body.toAddress,
        service: `${body.carrier} ${body.service}`,
        number: 1,
        weight: `${weight.value} ${weight.unitOfMeasure}`
    }
    return shippingInfo;
}