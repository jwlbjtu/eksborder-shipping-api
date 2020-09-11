import bwipjs from "bwip-js";

export const createBarcode = (code: string): Promise<Buffer> => {
    return new Promise((resolve , reject) => {
        bwipjs.toBuffer({
            bcid:        'code128',       // Barcode type
            text:        code,           // Text to encode
            scale:       4,               // 3x scaling factor
            height:      15,              // Bar height, in millimeters
            includetext: true,            // Show human-readable text
            textxalign:  'center'    // Always good to set this
        }, function (err, png) {
            if (err) {
                return reject(err);
            } else {
                return resolve(png);
            }
        });
    });
}