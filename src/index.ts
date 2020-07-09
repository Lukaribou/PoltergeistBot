import { Client, Collection, GuildMember, CategoryChannel, TextChannel } from "discord.js";
import { Command, Config, EMOJIS, statsDb } from "./utils/structs";
import { readdir } from "fs";
import { onReady, onMessage, onGuildMemberJoin, onGuildMemberLeft, updateStatus, onReactionAdd, onReactionRemove, onInviteCreate } from "./events";
import { Stats } from "./utils/stats";
import { daysBetween, getMemberCategory, saveDB } from "./utils/functions";
import { scheduleJob } from "node-schedule";

export class Poltergeist extends Client { // extends Client = hérite des propriétés et méthodes de Discord.Client
    // bot
    public commands: Collection<string, Command> = new Collection();
    public aliases: Collection<string, Command> = new Collection();
    public prefix: string = undefined;
    public ownerId: string = undefined;
    public config: Config = undefined;
    public cooldown = {
        fast: new Array<string>(),
        warns: new Collection<string, number>()
    };

    constructor(config: Config) {
        super({ disableMentions: 'everyone' }); // On empêche le bot de pouvoir faire des @everyone
        this.ownerId = config.ownerId;
        this.prefix = config.prefix;
        this.config = config;

        this.run();
    }

    async run(): Promise<void> {
        this.loadCommands();
        this.on("inviteCreate", onInviteCreate)
            .on("ready", onReady)
            .on("message", onMessage)
            .on("guildMemberAdd", onGuildMemberJoin)
            .on("guildMemberRemove", onGuildMemberLeft)
            .on("error", () => this.run())
            .on("channelCreate", () => { updateStatus(); Stats.Monthly.inc("channels"); })
            .on("channelDelete", () => { updateStatus(); Stats.Monthly.dec("channels"); })
            .on("messageReactionAdd", onReactionAdd)
            .on("messageReactionRemove", onReactionRemove);

        await this.login(this.config.token);
    }

    private loadCommands(): void {
        readdir(__dirname + "/commands", (err: NodeJS.ErrnoException, filenames: Array<string>) => {
            if (err) { console.error(err.message); return; };
            let jsfile = filenames.filter(f => f.split(".").pop() === "js");
            if (jsfile.length <= 0) return console.log("[LOGS] - 0 fichiers trouvés");

            jsfile.forEach((file: string, _) => {
                try {
                    if (file.endsWith(".map")) return;
                    delete require.cache[require.resolve(`./commands/${file}`)];
                    let pull = new (require(`./commands/${file}`).default)();
                    this.commands.set(pull.name, pull);
                    pull.aliases.forEach((alias: string) => this.aliases.set(alias, pull));
                } catch (e) { console.log(e); }
            });
        });
    }
}

export const bot: Poltergeist = new Poltergeist(new Config());

scheduleJob('0 0 0 * * *', () => { // Suppression salons inutilisés
    bot.guilds.cache.first().members.cache
        .filter(gm => daysBetween(gm.joinedTimestamp) > 7) // Rejoint +7j
        .forEach(async (gm: GuildMember) => {
            var categ: CategoryChannel = getMemberCategory(gm);

            if (categ) {
                var liste: string[] = [];

                categ.children
                    .filter((c: TextChannel) => daysBetween(c.createdTimestamp) > 7) // Salons vieux +7j
                    .forEach(async (c: TextChannel) => {
                        if ((await c.messages.fetch({ limit: 1 }).catch(() => new Collection())).size === 0) {// => 0 message
                            c.delete('[Suppression automatique] - Salon inutilisé').catch(() => { });
                            liste.push(c.name);
                        }
                    });

                categ.fetch()
                    .then((c) => {
                        if (c.children.size === 0) {
                            categ.delete('[Suppression automatique] - 0 salon').catch(() => { }); // On supprime aussi la catégorie
                            gm.user.send(`${EMOJIS.WARNINGEMOJI} [__Message automatique__] - Votre catégorie et ses salons ont été **supprimés** de \`${categ.guild.name}\` car vous ne les avez **jamais utilisés**.`).catch(() => { });
                            return;
                        }
                    })
                    .catch(() => { });

                if (liste.length !== 0) // Salons supprimés mais pas tous
                    gm.user.send(`${EMOJIS.WARNINGEMOJI} [__Message automatique__] - Le(s) salon(s) "\`${liste.join('`, `')}\`" a/ont été **supprimé(s)** de votre catégorie sur \`${categ.guild.name}\` car vous ne les avez **jamais utilisés.**`).catch(() => { });
            }
        });

    setTimeout(() => Stats.All.update(), 30e3);
});

scheduleJob('0 0 0 1 * *', () => { // Chaque nouveau mois
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const guild = bot.guilds.cache.first();
    statsDb.monthly.push({
        monthName: months[new Date().getMonth()],
        year: new Date().getFullYear(),
        members: guild.members.cache.filter(m => !m.user.bot).size,
        messages: 0,
        channels: guild.channels.cache.size
    });
    saveDB('stats');
});

scheduleJob('*/1 * * * *', () => { // Toutes les minutes
    saveDB('stats')
});