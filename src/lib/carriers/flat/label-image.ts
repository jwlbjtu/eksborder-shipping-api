var htmlToImage = require('node-html-to-image');
import fs from "fs";
import path from "path";
import { IFlatShippingInfo } from "../../../types/shipping.types";
import { IUser } from "../../../types/user.types";

export const generateLabel = (shippingInfo: IFlatShippingInfo, barcodeBase64: string, user? : IUser) => {
    const logoPath = path.join(__dirname, "../../../../static/eksborder.png");
    const logoImage = fs.readFileSync(logoPath);
    // @ts-ignore
    let base64Image = new Buffer.from(logoImage).toString("base64");
    
    // Use customer's logo image if available
    if(user && user.logoImage) {
        base64Image = user.logoImage.toString("base64");
    }
    const logoImageUrl = `data:image/png;base64,${ base64Image }`;
    const templatePath = path.join(__dirname, "../../../../static/template.html")

    return htmlToImage({
        html: fs.readFileSync(templatePath).toString(),
        content: {
            logoSource: logoImageUrl,
            service: shippingInfo.service,
            number: shippingInfo.number,
            weight: shippingInfo.weight,
            fromAddress: shippingInfo.fromAddress,
            toAddress: shippingInfo.toAddress,
            barcodeSource: `data:image/png;base64,${ barcodeBase64 }`
        }
    });
}
