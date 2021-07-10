import { IShipping } from '../../types/record.types';
import { IAccount, IUser } from '../../types/user.types';
import { CARRIERS, DistanceUnit, WeightUnit } from '../constants';
import bwipjs from 'bwip-js';
import { IAddress, IFlatShippingInfo } from '../../types/shipping.types';
import images from 'images';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import convert from 'convert-units';

export const validateShipment = (
  shipmentData: IShipping,
  carrierAccount: IAccount | undefined
): string | undefined => {
  if (!carrierAccount) return '账号信息错误';
  // - carrierName matches carrier account
  if (
    carrierAccount.carrier !== shipmentData.carrier ||
    carrierAccount.accountId !== shipmentData.carrierAccount
  ) {
    return `${shipmentData.carrier}与所用账号不匹配`;
  }
  // - service is supported by carrier account
  if (
    !shipmentData.service ||
    !carrierAccount.services
      .map((ele) => ele.key)
      .includes(shipmentData.service.key)
  ) {
    return '所选服务不支持';
  }
  // - facility is support by carrier account
  if (
    CARRIERS.DHL_ECOMMERCE === shipmentData.carrier &&
    (!shipmentData.facility ||
      !carrierAccount.facilities.includes(shipmentData.facility))
  ) {
    return '所选操作中心不支持';
  }
  // - packageInfo
  if (!shipmentData.packageInfo) return '缺少包裹信息';
  // - packageInfo weight
  const weight = shipmentData.packageInfo.weight;
  if (
    !weight ||
    weight.value <= 0 ||
    !Object.values(WeightUnit).includes(weight.unitOfMeasure)
  ) {
    return '包裹重量信息有误';
  }
  // - packageInfo dimension
  const dimension = shipmentData.packageInfo.dimentions;
  if (
    !dimension ||
    dimension.length <= 0 ||
    dimension.width <= 0 ||
    dimension.height <= 0 ||
    !Object.values(DistanceUnit).includes(dimension.unitOfMeasure)
  ) {
    return '包裹尺寸信息有误';
  }
  // - custom declaration (international)
  if (
    isShipmentInternational(shipmentData) &&
    !shipmentData.customDeclaration
  ) {
    return '国际件缺少清关信息';
  }
  // - custom items (international)
  if (
    isShipmentInternational(shipmentData) &&
    (!shipmentData.customItems || shipmentData.customItems.length === 0)
  ) {
    return '国际件至少要有一个清关物品';
  }

  return undefined;
};

export const isShipmentInternational = (shipmentData: IShipping): boolean => {
  return shipmentData.sender.country !== shipmentData.toAddress.country;
};

function setTimeDateFmt(s: number) {
  return s < 10 ? '0' + s : s.toString();
}

export const trackingNumberGenerator = (): string => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const monthString = setTimeDateFmt(month);
  const dayString = setTimeDateFmt(day);
  const hourString = setTimeDateFmt(hour);
  const minutesString = setTimeDateFmt(minutes);
  const secondsString = setTimeDateFmt(seconds);

  const trackingNumber =
    now.getFullYear().toString() +
    monthString +
    dayString +
    hourString +
    minutesString +
    secondsString +
    Math.round(Math.random() * 1000000).toString();

  return trackingNumber;
};

export const createBarcode = (code: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'code128', // Barcode type
        text: code, // Text to encode
        scale: 4, // 3x scaling factor
        height: 15, // Bar height, in millimeters
        includetext: true, // Show human-readable text
        textxalign: 'center' // Always good to set this
      },
      function (err, png) {
        if (err) {
          return reject(err);
        } else {
          return resolve(png);
        }
      }
    );
  });
};

export const shippingInfoFromBody = (
  shipmentData: IShipping
): IFlatShippingInfo => {
  const weight = shipmentData.packageInfo!.weight;
  const weightOz = convert(weight.value)
    .from(weight.unitOfMeasure)
    .to(WeightUnit.OZ);

  const shippingInfo: IFlatShippingInfo = {
    fromAddress: shipmentData.sender,
    toAddress: shipmentData.toAddress,
    service: shipmentData.service!.name,
    number: 1,
    weight: `${weightOz} ${WeightUnit.OZ}`
  };
  return shippingInfo;
};

export const generateLabel = async (
  shippingInfo: IFlatShippingInfo,
  barcodeBuffer: Buffer,
  user?: IUser
): Promise<Buffer> => {
  // Background Image
  const baseImage = images(800, 1000).fill(255, 255, 255);
  // Get Logo Image
  const logoImage = await getLogoImage(user);
  // Get Package Info
  const packageImage = await getPackageInfoImage(shippingInfo);
  // Get Separator
  const separatorImage = await getSeparatorImage();
  // Return Address
  const returnAddImage = await getAddressImage(
    shippingInfo.fromAddress,
    18,
    130
  );
  // To Address
  const toAddImage = await getAddressImage(shippingInfo.toAddress, 33, 200);
  // Barcode Image
  const barcodeImage = images(barcodeBuffer).size(600, 200);

  const result = images(baseImage)
    .draw(logoImage, 60, 30)
    .draw(packageImage, 100, 150)
    .draw(separatorImage, 0, 235)
    .draw(returnAddImage, 100, 275)
    .draw(toAddImage, 200, 425)
    .draw(separatorImage, 0, 690)
    .draw(barcodeImage, 100, 730)
    .encode('png');

  return result;
};

export const getLogoImage = async (user?: IUser): Promise<images.Image> => {
  // Use customer's logo image if available
  if (user && user.logoImage) {
    const logoBuffer = user.logoImage;
    return images(logoBuffer).resize(260, 150);
  }

  const logoPath = path.join(__dirname, '../../../static/logo.png');
  const logoBuffer = fs.readFileSync(logoPath);
  return images(logoBuffer).resize(130, 90);
};

export const getPackageInfoImage = async (
  shippingInfo: IFlatShippingInfo
): Promise<images.Image> => {
  const packageSvg = `
        <svg viewBox="0 0 650 70" xmlns="http://www.w3.org/2000/svg">    
            <style>
                .small { font: 20px sans-serif; }
            </style>
            <text x="0" y="1em" class="small">Service: ${shippingInfo.service}</text>
            <text x="0" y="3em" class="small">Packages: ${shippingInfo.number}</text>
            <text x="450" y="3em" class="small">Weight: ${shippingInfo.weight}</text>
        </svg>
    `;
  const packageBuffer = await sharp(Buffer.from(packageSvg)).toBuffer();
  return images(packageBuffer);
};

export const getSeparatorImage = async (): Promise<images.Image> => {
  const lineSvg = `
        <svg>
            <line x1="0" y1="0" x2="800" y2="0" stroke="black" stroke-width="10"/>
        </svg>
    `;
  const lineBuffer = await sharp(Buffer.from(lineSvg))
    .resize(800, 10)
    .toBuffer();
  return images(lineBuffer).resize(800, 10);
};

export const getAddressImage = async (
  address: IAddress,
  fontSize: number,
  height: number
): Promise<images.Image> => {
  const name = address.name || '';
  const company = address.company || '';
  const street2 = address.street2 || '';
  const state = address.state || '';

  const addressSvg = `
        <svg viewBox="0 0 500 ${height}" xmlns="http://www.w3.org/2000/svg">
            <style>
                .small { font: ${fontSize}px sans-serif; }
            </style>
            <text x="0" y="0" class="small" dy="0">
                <tspan x="0" dy="1em">${name}</tspan>
                <tspan x="0" dy="1.2em">${company}</tspan>
                <tspan x="0" dy="1.2em">${address.street1}</tspan>
                <tspan x="0" dy="1.2em">${street2}</tspan>
                <tspan x="0" dy="1.2em">${address.city} ${state} ${address.country} ${address.postalCode}</tspan>
            </text>
        </svg>
    `;

  const returnAddBuffer = await sharp(Buffer.from(addressSvg))
    .resize(500, height)
    .toBuffer();
  return images(returnAddBuffer).resize(500, height);
};
