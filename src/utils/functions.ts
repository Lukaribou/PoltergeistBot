import { writeFile } from "fs";
import { User } from "discord.js";
import { bot } from "..";

/**
 * Sauvegarde la base de données donnée
 * @param {string} dbname Le nom de la base de données (sans le json)
 */
export function saveDB(dbname: string): void {
    writeFile(`database/${dbname}.json`, JSON.stringify(require(`../../database/${dbname}.json`), null, 4), (err) => {
        if (err) console.log(err);
    });
};

/**
 * Renvoie si un utilisateur est un admin du bot ou non
 * @param {User} user L'utilisateur
 */
export function isBotAdmin(user: User): boolean {
    return (user.id == bot.config.ownerId || bot.config.adminsId.includes(user.id)); // || = ou, Array.includes() est une fonction qui permet de voir si le tableau contient une certaine valeur
};