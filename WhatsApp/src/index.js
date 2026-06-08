import {
    Browsers,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from "baileys";
import pino from "pino";
import 'dotenv/config';
import socket from "./lib/core/socket.js";
import { loadCommands, loadEvents } from "./lib/loaders.js";
import { setSock } from "./lib/botState.js";
import { startApiServer } from "./apiServer.js";

const logger = pino({ level: "silent" });

export async function startSock() {
    // Se guardan las sesiones en la carpeta "auth"
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = socket({
        version,
        logger,
        browser: Browsers.appropriate("chrome"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        }
    });

    // Compartir el sock con el servidor Express (botState)
    // connection.update.js llama a setSock cuando la conexión está abierta
    // y clearSock cuando se cierra. Aquí lo guardamos de inmediato
    // para que esté disponible aunque la reconexión demore.
    setSock(sock);

    sock.ev.on("creds.update", saveCreds);
    
    await loadEvents(sock);
    await loadCommands(sock);
}

// Iniciar el servidor HTTP interno para recibir llamados desde PHP
const WA_PORT = parseInt(process.env.WA_PORT || '3001', 10);
startApiServer(WA_PORT);

startSock();
