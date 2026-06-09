import serialize from "#lib/core/serialize.js";
import { getMessageContent } from "#lib/utils.js";
import config from "../config.js";

export default async (sock, { messages, type }) => {
    if (type !== "notify") return;
    
    try {
        const msg = messages[0];
        
        if (!msg.message || msg.key.remoteJid === "status@broadcast") return;
        const jid = msg.key.remoteJid

        const m = await serialize(msg, sock);
        
        const content = getMessageContent(msg);
        if (!content) return;
        
        if (m.isGroup) return
        else console.log(content)
        
        const prefix = config.prefix;
        if (!content.startsWith(prefix)) return;
        
        const args = content.slice(prefix.length).trim().replace(/\n+/g, ' ').split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = sock.commands.get(commandName) || sock.commands.find(cmd => cmd.aliases?.includes(commandName));
        if (!command) return;
        
        try {
            command.execute(m, { args, content, prefix, sock });
        } catch(error) {
            console.error(`Error en el comando ${commandName}:`, error);
        }
        
    } catch(error) {
        console.error("Error procesando el mensaje", error);
    }
}