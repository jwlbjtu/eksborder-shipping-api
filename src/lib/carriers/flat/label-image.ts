import fs from "fs";
import path from "path";
import images from "images";
import sharp from "sharp";
import { IFlatShippingInfo, IAddress } from "../../../types/shipping.types";
import { IUser } from "../../../types/user.types";
import { Buffer } from "buffer";

export const generateLabel = async (shippingInfo: IFlatShippingInfo, barcodeBuffer: Buffer, user? : IUser) => {
    // Background Image
    const baseImage = images(800, 1000).fill(255, 255, 255);
    // Get Logo Image
    const logoImage = await getLogoImage(user);
    // Get Package Info
    const packageImage = await getPackageInfoImage(shippingInfo);
    // Get Separator
    const separatorImage = await getSeparatorImage();
    // Return Address
    const returnAddImage = await getAddressImage(shippingInfo.fromAddress, 18, 130);
    // To Address
    const toAddImage = await getAddressImage(shippingInfo.toAddress, 33, 200);
    // Barcode Image
    const barcodeImage = images(barcodeBuffer).size(600, 200);

    let result =  images(baseImage)
        .draw(logoImage, 50, 0)
        .draw(packageImage, 100, 150)
        .draw(separatorImage, 0, 235)
        .draw(returnAddImage, 100, 275)
        .draw(toAddImage, 200, 425)
        .draw(separatorImage, 0, 690)
        .draw(barcodeImage, 100 ,730)
        .encode("png");

    return result;
}

export const getLogoImage = async (user?: IUser) => {
    // Use customer's logo image if available
    if(user && user.logoImage) {
        const logoBuffer = user.logoImage;
        return images(logoBuffer).resize(260, 150);
    }

    const logoPath = path.join(__dirname, "../../../../static/eksborder.png");
    const logoBuffer = fs.readFileSync(logoPath);
    return images(logoBuffer).resize(260, 150);
}

export const getPackageInfoImage = async (shippingInfo: IFlatShippingInfo) => {
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
}

export const getSeparatorImage = async () => {
    const lineSvg = `
        <svg>
            <line x1="0" y1="0" x2="800" y2="0" stroke="black" stroke-width="10"/>
        </svg>
    `;
    const lineBuffer = await sharp(Buffer.from(lineSvg)).resize(800, 10).toBuffer();
    return images(lineBuffer).resize(800, 10);
}

export const getAddressImage = async (address: IAddress, fontSize: number, height: number) => {
    const name = address.name || "";
    const company = address.company || "";
    const street2 = address.street2 || "";
    const state = address.state || "";

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

    const returnAddBuffer = await sharp(Buffer.from(addressSvg)).resize(500, height).toBuffer();
    return  images(returnAddBuffer).resize(500, height);
}