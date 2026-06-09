// ══════════════════════════════════════════════════════════
//  TRINITY Bot — Estado compartido del socket de WhatsApp
//  Permite que el servidor Express acceda al sock de Baileys
// ══════════════════════════════════════════════════════════

let _sock      = null;
let _connected = false;

/** Guarda la referencia al sock y lo marca como conectado */
export const setSock = (sock) => {
    _sock      = sock;
    _connected = true;
};

/** Limpia la referencia (se llama al desconectarse) */
export const clearSock = () => {
    _connected = false;
    _sock      = null;  // FIX: sin esto isReady() devuelve true con sock viejo
};

/** Devuelve el sock actual */
export const getSock = () => _sock;

/** true sólo cuando la conexión con WhatsApp está activa */
export const isReady = () => _sock !== null && _connected;
