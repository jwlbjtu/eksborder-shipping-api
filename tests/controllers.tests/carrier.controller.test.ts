import { setupDB, dhlCarrier, pbCarrier } from "../fixtures/carriers";
import { adminUser } from "../fixtures/users";
import Carrier from "../../src/models/carrier.model";
import request from "supertest";
import app from "../../src/server";

describe("Carrier Controller Test", () => {

    beforeAll(setupDB);

    it("Should create carrier for admin user", async () => {
        await request(app)
            .post("/carrier")
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send(pbCarrier)
            .expect(200)
            .expect(async (res) => {
                const carrier = await Carrier.findById(pbCarrier._id);
                expect(carrier).not.toBeNull();
                // @ts-ignore
                expect(carrier.carrierName).toEqual("Pitney Bowes");
            });
    });

    it("Should update carrier for admin user", async () => {
        await request(app)
            .put(`/carrier/${dhlCarrier.carrierName}`)
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send({accountName: "Updated by Unit Test"})
            .expect(200)
            .expect(async (res) => {
                const carrier = await Carrier.findById(dhlCarrier._id);
                // @ts-ignore
                expect(carrier.accountName).toEqual("Updated by Unit Test");
            });
    });

    it("Should get all carriers for admin user", async () => {
        await request(app)
            .get("/carrier")
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send()
            .expect(200)
            .expect(async (res) => {
                const carriers = await Carrier.find();
                expect(carriers.length).toEqual(2);
            });
    });

    it("Should get carrier by name for admin user", async () => {
        await request(app)
            .get(`/carrier/${dhlCarrier.carrierName}`)
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send()
            .expect(200)
            .expect(async (res) => {
                res.body.carrierName = dhlCarrier.carrierName;
            });
    });

    it("Should delete carrier for admin user", async () => {
        await request(app)
            .delete(`/carrier/${dhlCarrier.carrierName}`)
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send()
            .expect(200)
            .expect(async (res) => {
                const carrier = await Carrier.findById(dhlCarrier._id);
                expect(carrier).toBeNull();
            });
    });
});