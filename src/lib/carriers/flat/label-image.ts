import fs from "fs";
import path from "path";
import images from "images";
import svg2png from "svg2png";
import { IFlatShippingInfo, IAddress } from "../../../types/shipping.types";
import { IUser } from "../../../types/user.types";

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

    return images(baseImage)
        .draw(logoImage, 50, 0)
        .draw(packageImage, 100, 150)
        .draw(separatorImage, 0, 235)
        .draw(returnAddImage, 100, 275)
        .draw(toAddImage, 200, 425)
        .draw(separatorImage, 0, 690)
        .draw(barcodeImage, 100 ,730)
        .encode("png");
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
        <svg>    
            <text x="0" y="1em" font-size="20">Service: ${shippingInfo.service}</text>
            <text x="0" y="3em" font-size="20">Packages: ${shippingInfo.number}</text>
            <text x="450" y="3em" font-size="20">Weight: ${shippingInfo.weight}</text>
        </svg>
    `;
    const packageBuffer = await svg2png(Buffer.from(packageSvg), { width: 650, height: 80 });
    return images(packageBuffer).resize(650, 80);
}

export const getSeparatorImage = async () => {
    const lineSvg = `
        <svg>
            <line x1="0" y1="0" x2="800" y2="0" stroke="black" stroke-width="10"/>
        </svg>
    `;
    const lineBuffer = await svg2png(Buffer.from(lineSvg), {width: 800, height: 10});
    return images(lineBuffer).resize(800, 10);
}

export const getAddressImage = async (address: IAddress, fontSize: number, height: number) => {
    const name = address.name || "";
    const company = address.company || "";
    const street2 = address.street2 || "";
    const state = address.state || "";

    const addressSvg = `
        <svg>
            <text x="0" y="0" font-size="${fontSize}" dy="0">
                <tspan x="0" dy="1em">${name}</tspan>
                <tspan x="0" dy="1.2em">${company}</tspan>
                <tspan x="0" dy="1.2em">${address.street1}</tspan>
                <tspan x="0" dy="1.2em">${street2}</tspan>
                <tspan x="0" dy="1.2em">${address.city} ${state} ${address.country} ${address.postalCode}</tspan>
            </text>
        </svg>
    `;

    const returnAddBuffer = await svg2png(Buffer.from(addressSvg), { width: 500, height});
    return  images(returnAddBuffer).resize(500, height);
}