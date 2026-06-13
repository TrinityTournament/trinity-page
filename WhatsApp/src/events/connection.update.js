import { startSock } from "../index.js";
import { delay, DisconnectReason } from "baileys";
import { Boom } from "@hapi/boom";
import { setSock, clearSock } from "#lib/botState.js";

export default async (sock, update) => {
    try {
        const { connection, lastDisconnect, qr } = update;

        if (connection === "connecting" || !!qr) {
            await delay(1500);
            const code = await sock.requestPairingCode("59892928797", "TRINITY0");
            console.log("Codigo de emparejamiento:", code);
            return;
        }

        if (connection === "open") {
            setSock(sock);
            console.log("Conexión abierta — Bot listo para enviar mensajes.");
            return;
        }

        if (connection === "close") {
            clearSock();

            const error      = lastDisconnect?.error;
            const boom       = new Boom(error);
            const statusCode = boom.output?.statusCode;

            const shouldReconnect = ![
                DisconnectReason.loggedOut,
                DisconnectReason.forbidden,
            ].includes(statusCode);

            console.log(
                `Conexión cerrada. Código: ${statusCode}. ${
                shouldReconnect ? "Reconectando..." : "No se reconectará."
                }`
            );

            if (!shouldReconnect) {
                console.error('Sesión expirada. Eliminá la carpeta "auth" y volvé a vincular.');
                process.exit(1);
            }

            await startSock();
            return;
        }
    } catch (err) {
        console.error("Error en connection.update:", err);
    }
};