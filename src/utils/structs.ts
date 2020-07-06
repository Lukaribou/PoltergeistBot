import { Poltergeist } from '../index';
import { Message, User, GuildChannel } from 'discord.js';
import { IStats } from './stats';

export abstract class Command {
    abstract name: string;
    abstract desc: string;
    abstract usage: string;
    abstract categorie: string;
    ownerOnly: boolean = false; // De base on le met sur faux
    botAdminsOnly: boolean = false;
    aliases: Array<string> = []; // De base les aliasses sont vides
    abstract async execute(args: CommandParams): Promise<void>;
};

interface IBotsList {
    list: string[][],
    reactionRoles: {
        messageId: string,
        list: string[][]
    }
};

export const confdb = require("../../database/config.json");
export const botsListDb: IBotsList = require("../../database/botsList.json");
export const statsDb: IStats = require("../../database/stats.json");

export interface CommandParams {
    args: string[]; // Les args c'est le message qu'on coupe à chaque espace
    message: Message;
    bot: Poltergeist;
};

export class Config {
    token: string = confdb.token;
    ownerId: string = confdb.ownerId;
    adminsId: string[] = confdb.adminsId
    prefix: string = confdb.prefix;
    dev: boolean = confdb.dev;
};

export enum EMOJIS {
    OKEMOJI = "✅",
    XEMOJI = "❌",
    WARNINGEMOJI = "⚠",
    RIGHTARROW = "➡",
    TADAEMOJI = "🎉",
    ADMINSEMOJI = "🚔",
    OWNERONLYEMOJI = "🔐"
};

export const mutedRole: string = "706783593040445482";
export const welcomeChannel: string = "705851074921234432";