import { Client, Collection, GuildMember, TextChannel, CategoryChannel } from "discord.js";
import { Command, Config, EMOJIS } from "./utils/structs";
import { readdir } from "fs";
import { onReady, onMessage, onGuildMemberJoin, onGuildMemberLeft, updateStatus, onReactionAdd, onReactionRemove, onInviteCreate } from "./events";
import { scheduleJob } from "node-schedule";
import { getMemberCategory, daysBetween } from "./utils/functions";

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
            .on("channelCreate", () => updateStatus)
            .on("channelDelete", () => updateStatus)
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

scheduleJob('0 0 0 * * *', () => {
    bot.guilds.cache.first().members.cache
        .filter(gm => daysBetween(gm.joinedTimestamp) > 7) // Rejoint +7j
        .forEach(async (gm: GuildMember) => {
            var categ: CategoryChannel = getMemberCategory(gm);

            if (categ) {
                var liste: string[] = [];

                categ.children
                    .filter((c: TextChannel) => daysBetween(c.createdTimestamp) > 7) // Salons vieux +7j
                    .forEach(async (c: TextChannel) => {
                        if ((await c.messages.fetch({ limit: 1 }).catch(() => new Collection)).size === 0) {// => 0 message
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
                    .catch(() => { })

                if (liste.length !== 0) // Salons supprimés mais pas tous
                    gm.user.send(`${EMOJIS.WARNINGEMOJI} [__Message automatique__] - Le(s) salon(s) "\`${liste.join('`, `')}\`" a/ont été **supprimé(s)** de votre catégorie sur \`${categ.guild.name}\` car vous ne les avez **jamais utilisés.**`).catch(() => { });
            }
        });
});