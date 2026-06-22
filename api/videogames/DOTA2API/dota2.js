/** CS2 API
 *  BASE URL: https://api.steampowered.com/
 * 
 *  Obtener ID del usuario:
 * https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=APIKEY&vanityurl=USUARIO
 *
 */

import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { ask, close } from '../../../components/ask.js'
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });
const apikey = process.env.SWEBAPI;
const BASEAPI = "https://api.steampowered.com";
const DOTAPI = "https://api.opendota.com";

async function getIDbyUser(user, apikey) {
    const { data } = await axios.get(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apikey}&vanityurl=${user}`)
    if (data.response.success === 1)
        return data.response.steamid;
    else 
        return "No se encontró la cuenta." 
}

async function get3steamFriendsbyID(id, apikey) {
    try {
        const { data } = await axios.get(`${BASEAPI}/ISteamUser/GetFriendList/v0001/?key=${apikey}&steamid=${id}&relationship=friend`)
        const friends = data.friendslist.friends

        if (!friends || friends.length === 0) {
            return null // Sin amigos o lista privada
        }

        // Tomamos hasta 3 amigos, los que haya
        const topFriends = friends.slice(0, 3)
        const ids = topFriends.map(f => f.steamid).join(',')

        // Obtener datos de perfil de los amigos
        const friendsData = await axios.get(`${BASEAPI}/ISteamUser/GetPlayerSummaries/v0002/?key=${apikey}&steamids=${ids}`)
        return friendsData.data.response.players
    } catch (err) {
        if (err.response?.status === 404) {
            return null // Lista de amigos privada
        }
        throw err
    }
}

async function getDota2Profile(accID) {
    const { data } = await axios.get(`${DOTAPI}/api/players/${accID}`)
    return data;
}

function steamIDtoAccID(steamid) {
    return BigInt(steamid) - 76561197960265728n;
}

async function checkDOTAWR(accID) {
    const { data } = await axios.get(`https://api.opendota.com/api/players/${accID}/wl`);

    return data;
}

let heroMap = null; // Cache en memoria

async function getHeroMap() {
    if (heroMap) return heroMap;

    const { data } = await axios.get(`${DOTAPI}/api/heroes`)
    heroMap = {};
    for (const hero of data) {
        heroMap[hero.id] = hero.localized_name;
    }
    return heroMap;
}

async function getRecentMatches(accID) {
    const { data } = await axios.get(`${DOTAPI}/api/players/${accID}/matches?limit=20`)
    return data
}

async function summarizeMatches(matches) {
    const totalGames = matches.length;
    let wins = 0;
    let totalKills = 0, totalDeaths = 0, totalAssists = 0;
    let totalGPM = 0, totalXPM = 0;
    const heroCount = {};

    for (const m of matches) {
        const isRadiant = m.player_slot < 128;
        const won = (isRadiant && m.radiant_win) || (!isRadiant && !m.radiant_win);
        if (won) wins++;

        totalKills += m.kills;
        totalDeaths += m.deaths;
        totalAssists += m.assists;
        totalGPM += m.gold_per_min;
        totalXPM += m.xp_per_min;

        heroCount[m.hero_id] = (heroCount[m.hero_id] || 0) + 1;
    }

    const losses = totalGames - wins;
    const winRate = ((wins / totalGames) * 100).toFixed(2);
    const avgKDA = ((totalKills + totalAssists) / Math.max(totalDeaths, 1)).toFixed(2);

    const mostPlayedHeroId = Number(
        Object.entries(heroCount).sort((a, b) => b[1] - a[1])[0][0]
    );

    const heroes = await getHeroMap();
    const mostPlayedHeroName = heroes[mostPlayedHeroId] || `ID ${mostPlayedHeroId}`;

    return {
        totalGames,
        wins,
        losses,
        winRate: `${winRate}%`,
        avgKills: (totalKills / totalGames).toFixed(1),
        avgDeaths: (totalDeaths / totalGames).toFixed(1),
        avgAssists: (totalAssists / totalGames).toFixed(1),
        avgKDA,
        avgGPM: Math.round(totalGPM / totalGames),
        avgXPM: Math.round(totalXPM / totalGames),
        mostPlayedHeroId,
        mostPlayedHeroName,
        mostPlayedHeroCount: heroCount[mostPlayedHeroId]
    };
}

async function SteamProfile() {
    try {
        let user = await ask('Usuario: '); close();
       // Si el input ya es un SteamID64 (17 dígitos numéricos), usarlo directo
        // Si no, resolver como vanity URL
        const isSteamID64 = /^\d{17}$/.test(user);
        const id = isSteamID64 ? user : await getIDbyUser(user, apikey)
console.log("isSteamID64:", isSteamID64, "| id resuelto:", id)
        let profile = "";

        let { data } = await axios.get(`${BASEAPI}/ISteamUser/GetPlayerSummaries/v0002/?key=${apikey}&steamids=${id}`)
        const profuser = data.response.players[0];
        const friends = await get3steamFriendsbyID(id, apikey)
        const accID = steamIDtoAccID(id)
        console.log("SteamID64:", id)
        console.log("AccID calculado:", accID.toString())

        const dotaprofile = await getDota2Profile(accID)
        profile += `\nUsuario: ${profuser.personaname}${profuser.realname ? ` (@${profuser.realname})` : ''}\n`
        profile += `Foto de perfil: ${dotaprofile.profile.avatarfull}\n`
        profile += `Steam ID: ${profuser.steamid}\n\n`

        // Meter a los amigos acá
        if (friends && friends.length > 0) {
            profile += `Amigos principales:\n`
            friends.forEach(f => {
                profile += `${f.personaname}\n${f.steamid}\nPFP: ${f.avatarfull}\n\n`
            })
        } else {
            profile += `Amigos principales: (lista privada o sin amigos)\n\n`
        }
        
        // Establecer datos de win rate en constantes para facilitar la impresión.
        // WINRATE: win / all * 100
        const gamesData = await checkDOTAWR(accID)
        const gameLosses = gamesData.lose;
        const gameWins = gamesData.win;
        const totalGames = gameWins + gameLosses 
        const winRate = gameWins / totalGames * 100  

        profile += `==-> ESTADISTICAS DOTA <-==\n` 
        profile += `Rank Tier: ${dotaprofile.rank_tier}\n`
        profile += `Matchmaking Ranking: ${dotaprofile.computed_mmr}\n`
        profile += `Partidas jugadas: ${totalGames}\n`
        profile += `Partidas ganadas: ${gameWins}\n`
        profile += `Partidas perdidas: ${gameLosses}\n`
        profile += `Win-Rate: ${winRate}%\n\n`
        
        const recentMatches = await getRecentMatches(accID)
        const summary = await summarizeMatches(recentMatches)

        profile += `==-> ULTIMAS ${summary.totalGames} PARTIDAS <-==\n`
        profile += `Win-Rate: ${summary.winRate} (${summary.wins}W - ${summary.losses}L)\n`
        profile += `KDA promedio: ${summary.avgKills}/${summary.avgDeaths}/${summary.avgAssists} (ratio: ${summary.avgKDA})\n`
        profile += `GPM promedio: ${summary.avgGPM}\n`
        profile += `XPM promedio: ${summary.avgXPM}\n`
        profile += `Héroe más jugado: ${summary.mostPlayedHeroName} (${summary.mostPlayedHeroCount} partidas)\n`
    
        console.log(profile)
    } catch(err) {
        console.error("ERROR COMPLETO:", err.message);
        console.error("Código:", err.code);
        console.error(err.response?.data);
        console.error(err.response?.status);
    }
}

SteamProfile();