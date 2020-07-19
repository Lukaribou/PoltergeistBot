import { writeFile } from "fs";
import { User, GuildMember, CategoryChannel, Message } from "discord.js";
import { bot } from "..";

/**
 * Sauvegarde la base de données donnée
 * @param dbname Le nom de la base de données (sans le json)
 */
export function saveDB(dbname: string): void {
    writeFile(`database/${dbname}.json`, JSON.stringify(require(`../../database/${dbname}.json`), null, 1), (err) => {
        if (err) console.log(err);
    });
}

/**
 * Renvoie si un utilisateur est un admin du bot ou non
 * @param user L'utilisateur
 */
export function isBotAdmin(user: User): boolean {
    return (user.id == bot.config.ownerId || bot.config.adminsId.includes(user.id));
}

/**
 * Renvoie la catégorie perso de la personne
 * @param member Le membre
 */
export function getMemberCategory(member: GuildMember): CategoryChannel {
    if (member.hasPermission(['ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_ROLES'])) return null;
    else return member.guild.channels.cache.filter(c => c.type === 'category'
        && c.permissionsFor(member)
        && c.permissionsFor(member).has(['VIEW_CHANNEL', 'SEND_MESSAGES', 'STREAM', 'USE_VAD', 'PRIORITY_SPEAKER'])
        && !c.permissionsFor(member.guild.roles.everyone).has('VIEW_CHANNEL'))
        .first() as CategoryChannel;
}

/**
 * Renvoie le nombre de jours entre deux dates
 * @param old La date la plus vieille
 * @param newest La date la moins ancienne | Si non spécifié: Date.now()
 */
export function daysBetween(old: number | Date, youngest: number | Date = Date.now()): number {
    if (youngest instanceof Date) youngest = youngest.getMilliseconds();
    if (old instanceof Date) old = old.getMilliseconds();
    return parseInt((youngest / 8.64e7 - old / 8.64e7).toFixed(0));
}

/**
 * Renvoie le nombre d'heures entre deux dates
 * @param old La date la plus vieille
 * @param newest La date la moins ancienne | Si non spécifié: Date.now()
 */
export function hoursBetween(old: number | Date, youngest: number | Date = Date.now()): number {
    if (youngest instanceof Date) youngest = youngest.getMilliseconds();
    if (old instanceof Date) old = old.getMilliseconds();
    return (youngest - old) / 36e5;
}

/**
 * Crée un salon DM si besoin et y envoie le message
 * @param u L'utilisateur | son id
 * @param msg Le contenu du message
 */
export function sendDM(u: User | GuildMember | string, msg: any): Promise<Message> {
    return new Promise(async (res, rej) => {
        if (u instanceof GuildMember) u = u.user;
        else if (typeof u === 'string') u = bot.users.cache.get(u);
        
        if (typeof u === 'undefined') rej("Utilisateur non trouvé");
        if (!u.dmChannel) await u.createDM();
        res(await u.dmChannel.send(msg));
    })
}