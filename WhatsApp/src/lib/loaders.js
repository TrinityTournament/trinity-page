import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import { Collection } from "@discordjs/collection";

async function loadCommands(sock) {
    sock.commands = new Collection();
    sock.aliases  = new Collection();

    const commandsDir = path.join(process.cwd(), "src", "commands");

    try {
        const entries = await fs.readdir(commandsDir);

        for (const entry of entries) {
            const entryPath = path.join(commandsDir, entry);
            const stat      = await fs.stat(entryPath);

            let files = [];

            if (stat.isDirectory()) {
                // Subcarpeta — comportamiento original
                const dirFiles = await fs.readdir(entryPath);
                files = dirFiles
                    .filter(f => f.endsWith(".js"))
                    .map(f => path.join(entryPath, f));
            } else if (entry.endsWith(".js")) {
                // Archivo suelto directamente en commands/
                files = [entryPath];
            }

            for (const filePath of files) {
                const commandModule = await import(pathToFileURL(filePath));
                const command       = commandModule.default;

                if (command?.name && typeof command.execute === "function") {
                    sock.commands.set(command.name, command);

                    if (Array.isArray(command.aliases)) {
                        for (const alias of command.aliases) {
                            sock.aliases.set(alias, command.name);
                        }
                    }

                    console.log(`Comando cargado: ${command.name}`);
                } else {
                    console.log(`Comando no cargado: ${path.basename(filePath)}`);
                }
            }
        }

        console.log("Comandos cargados correctamente.");
    } catch (err) {
        console.error("Error al cargar los comandos:", err);
    }
}

async function loadEvents(sock) {
    try {
        const events = await fs.readdir(path.join(process.cwd(), "src", "events"));

        for (const file of events.filter(f => f.endsWith(".js"))) {
            const module = await import(pathToFileURL(path.join(process.cwd(), "src", "events", file)));
            const event  = module.default || module;
            sock.ev.on(file.replace(".js", ""), event.bind(null, sock));
        }

        console.log("Eventos cargados");
    } catch (error) {
        console.error("Error cargando los eventos:", error);
    }
}

export { loadCommands, loadEvents };