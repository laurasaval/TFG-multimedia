import { createServer } from "http";
import { createExpressApp } from "./createExpressApp.js";
import { connectToDatabase } from "../data/database.js";
import { attachSignalingWebSocketServer } from "../signaling/signaling-websocket.server.js";

export async function countryServer() {
    const app = createExpressApp();
    const server = createServer(app);

    attachSignalingWebSocketServer(server);

    const hostname = process.env.HOSTNAME;
    const port = process.env.PORT;
    const countryName = process.env.COUNTRY_NAME;
    const countryCode = process.env.COUNTRY_CODE;
    const dataBaseUri = process.env.DATABASE_URI;

    await connectToDatabase(dataBaseUri);

    // app.listen(port, hostname, () => {
    //     console.log(
    //         `Servidor ${countryName} (${countryCode}) escuchando en http://${hostname}:${port}/`
    //     );
    // });

    server.listen(port, hostname, () => {
        console.log(
            `Servidor ${countryName} (${countryCode}) escuchando en http://${hostname}:${port}/`
        );
        console.log(
            `Signaling WebSocket de ${countryName} (${countryCode}) escuhando en ws://${hostname}:${port}/signaling`
        );
    });
}
