import request from "supertest";
import app from "../../src/server";
import User from "../../src/models/user.model";

import { adminUser, customerUser, createUser, setupDBAPI } from "../fixtures/users";

describe("API Token Unit Test", () => {
    beforeAll(setupDBAPI);

    it("Should refresh API token for admin user", async () => {
        await request(app)
            .get(`/api/refresh/${createUser._id}`)
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send()
            .expect(200)
            .expect(async (res) => {
                const user = await User.findById(createUser._id);
                // @ts-ignore
                expect(user.apiToken).not.toBeUndefined();
                // @ts-ignore
                expect(user.tokens.length).toEqual(1);
            });
    });

    it("Should revoke API token for admin user", async () => {
        await request(app)
            .get(`/api/revoke/${customerUser._id}`)
            .set("Authorization", `Bearer ${adminUser.tokens![0].token}`)
            .send()
            .expect(200)
            .expect(async (res) => {
                const user = await User.findById(customerUser._id);
                // @ts-ignore
                expect(user.apiToken).toBeUndefined;
                // @ts-ignore
                expect(user.tokens.length).toEqual(0);
            });
    });
}); 