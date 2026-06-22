/** ===========================
 *         TRINITY - ASK
 * Esto se usa en api/videogames/
 * La unica función es hacer interactivo 
 * los testeos de las apis.
 *  ===========================
 */

import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

function close() {
    rl.close();
}

export { ask, close };