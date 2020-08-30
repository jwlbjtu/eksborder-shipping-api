var htmlToImage = require('node-html-to-image');
import fs from "fs";
import path from "path";
import { IFlatShippingInfo } from "./flat.helper";

export const generateLabel = (shippingInfo: IFlatShippingInfo, barcodeBase64: string) => {
    const logoPath = path.join(__dirname, "../../../../static/eksborder.png");
    const logoImage = fs.readFileSync(logoPath);
    // @ts-ignore
    const base64Image = new Buffer.from(logoImage).toString("base64");
    const imageUrl = `data:image/png;base64,${ base64Image }`;

    const templatePath = path.join(__dirname, "../../../../static/template.html")

    return htmlToImage({
        html: fs.readFileSync(templatePath).toString(),
        content: {
            logoSource: imageUrl,
            service: shippingInfo.service,
            number: shippingInfo.number,
            weight: shippingInfo.weight,
            fromAddress: shippingInfo.fromAddress,
            toAddress: shippingInfo.toAddress,
            barcodeSource: `data:image/png;base64,${ barcodeBase64 }`
        }
    });
}
