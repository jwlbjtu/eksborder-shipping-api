import { resolve } from "path";
import { config } from "dotenv";

if(process.env.NODE_ENV === "test") {
    console.log("Loading .env.test");
    config({ path: resolve(__dirname, "../../.env.test") });
} else {
    console.log("Loading .env");
    config({ path: resolve(__dirname, "../../.env") });
}

