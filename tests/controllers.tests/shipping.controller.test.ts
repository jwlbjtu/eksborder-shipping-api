import request from "supertest";
import { sync } from "svg2png";
import app from "../../src/server";
import { 
    allDHLeCommerceProductRequest, 
    allDHLeCommerceFLATRequest,
    allDHLeCommerceGNDRequest, 
    allPBProductsRequest,
    allPBPMProductsRequest,
    dhlEcommerceGNDLabel,
    dhlEcommerceFlatLabel,
    pbUspsFcmFlatLabelRequest,
    pbUspsFcmPkgLabelRequest,
    pbUspsPmFlatLabelRequest,
    pbUspsPmPkgLabelRequest,
    insufficientBalanceRequest,
    dhlManifestRequest,
    pbManifestRequest,
    setupDB } from "../fixtures/shipping";
import { adminUser, customerUser, createUser } from "../fixtures/users";

describe("Shipping Unit Test", () => {
    let dhlShippingId = "", 
    dhlTrackingId = "",
    pbTrackingId = "",
    dhlRequestId = "",
    pbRequestId = "";
    beforeAll(setupDB);

    //it("Should get carrier rules for admin user");

    it("Should get all DHL eCommerce products for admin user", async () => {
        await request(app)
            .post("/shipping/admin/products")
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send(allDHLeCommerceProductRequest)
            .expect(200)
            .expect((res) => {
                expect(res.body.products.length).toBeGreaterThan(1);
            });
    });

    it("Should get DHL eCommerce GND products for admin user", async () => {
        await request(app)
            .post("/shipping/admin/products")
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send(allDHLeCommerceGNDRequest)
            .expect(200)
            .expect((res) => {
                // @ts-ignore
                //console.log(res.body.products[0]);
                expect(res.body.products[0].service).toBe("GND");
            });

        
    });

    it("Should get DHL eCommerce FLAT products for admin user", async () => {
        await request(app)
            .post("/shipping/admin/products")
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send(allDHLeCommerceFLATRequest)
            .expect(200)
            .expect((res) => {
                // @ts-ignore
                //console.log(res.body.products[0]);
                expect(res.body.products[0].service).toBe("FLAT");
            });
    });

    it("Should get all PB USPS products for admin user", async () => {
        await request(app)
            .post("/shipping/admin/products")
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send(allPBProductsRequest)
            .expect(200)
            .expect((res) => {
                // @ts-ignore
                //console.log(res.body.products);
                expect(res.body.products.length).toBeGreaterThanOrEqual(1);
            });
    });

    it("Should get PB USPS PM PKG products for admin user", async () => {
        await request(app)
            .post("/shipping/admin/products")
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send(allPBPMProductsRequest)
            .expect(200)
            .expect((res) => {
                // @ts-ignore
                //console.log(res.body.products[0]);
                expect(res.body.products[0].service).toBe("PM");
                expect(res.body.products[0].parcelType).toBe("PKG");
            });
    });

    // Nagotive test for product -- missing fields
    it("Should create DHL eCommerce GND label", async () => {
        const response = await request(app)
            .post("/shipping/label")
            .set("Authorization", `Bearer ${customerUser.tokens![0].token}`)
            .send(dhlEcommerceGNDLabel)
            .expect(200)
            .expect((res) => {
                // @ts-ignore
                expect(res.body.service).toBe("GND");
                expect(res.body.labels[0].labelData).toBeDefined();
            });
        
        dhlShippingId = response.body.shippingId;
        dhlTrackingId = response.body.labels[0].trackingId;
    });

    it("Should create DHL eCommerce FLAT label", async () => {
        await request(app)
            .post("/shipping/label")
            .set("Authorization", `Bearer ${customerUser.tokens![0].token}`)
            .send(dhlEcommerceFlatLabel)
            .expect(200)
            .expect((res) => {
                // @ts-ignore
                expect(res.body.service).toBe("FLAT");
                expect(res.body.labels[0].labelData).toBeDefined();
            });
    });

    it("Should create PB USPS FCM FLAT label", async () => {
        await request(app)
            .post("/shipping/label")
            .set("Authorization", `Bearer ${customerUser.tokens![0].token}`)
            .send(pbUspsFcmFlatLabelRequest)
            .expect(200)
            .expect((res) => {
                // @ts-ignore
                expect(res.body.service).toBe("FCM");
                expect(res.body.labels[0].parcelType).toBe("FLAT");
                expect(res.body.labels[0].labelData).toBeDefined();
            });
    });

    it("Should create PB USPS FCM PKG label", async () => {
        await request(app)
            .post("/shipping/label")
            .set("Authorization", `Bearer ${customerUser.tokens![0].token}`)
            .send(pbUspsFcmPkgLabelRequest)
            .expect(200)
            .expect((res) => {
                // @ts-ignore
                expect(res.body.service).toBe("FCM");
                expect(res.body.labels[0].parcelType).toBe("PKG");
                expect(res.body.labels[0].labelData).toBeDefined();
            });
    });

    it("Should create PB USPS PM FLAT label", async () => {
        await request(app)
            .post("/shipping/label")
            .set("Authorization", `Bearer ${customerUser.tokens![0].token}`)
            .send(pbUspsPmFlatLabelRequest)
            .expect(200)
            .expect((res) => {
                // @ts-ignore
                expect(res.body.service).toBe("PM");
                expect(res.body.labels[0].parcelType).toBe("LFRB");
                expect(res.body.labels[0].labelData).toBeDefined();
            });
    });

    it("Should create PB USPS PM PKG label", async () => {
        const response = await request(app)
            .post("/shipping/label")
            .set("Authorization", `Bearer ${customerUser.tokens![0].token}`)
            .send(pbUspsPmPkgLabelRequest)
            .expect(200)
            .expect((res) => {
                // @ts-ignore
                expect(res.body.service).toBe("PM");
                expect(res.body.labels[0].parcelType).toBe("PKG");
                expect(res.body.labels[0].labelData).toBeDefined();
            });
        
        pbTrackingId = response.body.labels[0].trackingId;
    });

    it("Should not create label with insufficient balance", async () => {
        await request(app)
            .post("/shipping/label")
            .set("Authorization", `Bearer ${createUser.tokens![0].token}`)
            .send(insufficientBalanceRequest)
            .expect(400)
            .expect((res) => {
                // @ts-ignore
                expect(res.body.title).toBe("Insufficient balance, please contact the customer service.");
            });
    })
    // Nagotive test for product -- 
    // - missing fields, 
    // - product & account mis-match
    // - carrier & account mis-match 
    // - product not supported
    // - service not supported
    // - carrier not supported
    // -- make sure fee calcualtion is accurate
    it("Should get label by shipping Id", async () => {
        await request(app) 
            .get(`/shipping/label/${dhlShippingId}`)
            .set("Authorization", `Bearer ${customerUser.tokens![0].token}`)
            .send()
            .expect(200);
    });

    it("Should create DHL eCommerce manifest", async () => {
        // @ts-ignore
        dhlManifestRequest.manifests[0].trackingIds.push(dhlTrackingId);

        const response = await request(app)
            .post("/shipping/manifest")
            .set("Authorization", `Bearer ${customerUser.tokens![0].token}`)
            .send(dhlManifestRequest)
            .expect(200);
        
        dhlRequestId = response.body.requestId;
    });

    it("Should create PB USPS PM manifest", async () => {
        // @ts-ignore
        pbManifestRequest.manifests[0].trackingIds.push(pbTrackingId);
        
        const response = await request(app)
            .post("/shipping/manifest")
            .set("Authorization", `Bearer ${customerUser.tokens![0].token}`)
            .send(pbManifestRequest)
            .expect(200);
        
        pbRequestId = response.body.requestId;
    });

    it("Should get DHL eCommerce manifest", async () => {
        await request(app)
            .get(`/shipping/manifest/dhlAccount/${dhlRequestId}`)
            .set("Authorization", `Bearer ${customerUser.tokens![0].token}`)
            .send()
            .expect(200);
    });

    it("Should get PB USPS PM manifest", async () => {
        await request(app)
            .get(`/shipping/manifest/pbAccount/${pbRequestId}`)
            .set("Authorization", `Bearer ${customerUser.tokens![0].token}`)
            .send()
            .expect(200);
    });
});