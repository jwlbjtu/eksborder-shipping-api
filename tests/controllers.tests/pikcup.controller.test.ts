import { setupDB, testPickup, dhlPickup } from "../fixtures/pickup";
import { adminUser } from "../fixtures/users";
import { dhlCarrier } from "../fixtures/carriers";
import Carrier from "../../src/models/carrier.model";
import Pickup from "../../src/models/pickup.model";
import request from "supertest";
import app from "../../src/server";

describe("Pickup Controller Test", () => {

    beforeAll(setupDB);

    it("Should create pickup for admin user", async () => {
        await request(app)
            .post("/pickup")
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send(dhlPickup)
            .expect(200)
            .expect(async (res) => {
                const pickup = await Pickup.findById(dhlPickup._id);
                expect(pickup).not.toBeNull();

                const carrier = await Carrier.findById(dhlCarrier._id).populate({path: 'pickupRef'});
                // @ts-ignore
                expect(carrier.pickupRef.length).toEqual(2);
                // @ts-ignore
                expect(carrier.pickupRef[1].pickupAccount).toEqual(dhlPickup.pickupAccount);
            });
    });

    it("Should update pickup for admin user", async () => {
        await request(app)
            .put(`/pickup/${testPickup._id}`)
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send({pickupAccount: "11111"})
            .expect(200)
            .expect(async (res) => {
                const pickup = await Pickup.findById(testPickup._id);
                // @ts-ignore
                expect(pickup.pickupAccount).toEqual("11111");
            });
    });

    it("Should get all pickup for admin user", async () => {
        await request(app)
            .get("/pickup")
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send()
            .expect(200)
            .expect(async (res) => {
                const pickups = await Pickup.find();
                expect(pickups.length).toEqual(2);
            });
    });

    it("Should get pickup by name for admin user", async () => {
        await request(app)
            .get(`/pickup/${testPickup._id}`)
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send()
            .expect(200)
            .expect(async (res) => {
                res.body.pickupAccount = testPickup.pickupAccount;
            });
    });

    it("Should delete pickup for admin user", async () => {
        await request(app)
            .delete(`/pickup/${testPickup._id}`)
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send()
            .expect(200)
            .expect(async (res) => {
                const pickup = await Pickup.findById(testPickup._id);
                expect(pickup).toBeNull();
            });
    });
});