import { Client, Collection, GuildMember } from "discord.js";
import { Command, Config, EMOJIS } from "./utils/structs";
import { readdir } from "fs";
import { onReady, onMessage, onGuildMemberJoin, onGuildMemberLeft, updateStatus } from "./events";
import schedule = require("node-schedule");

export class Poltergeist extends Client { // extends Client = hérite des propriétés et méthodes de Discord.Client
    // bot
    public commands: Collection<string, Command> = new Collection();
    public aliases: Collection<string, Command> = new Collection();
    public prefix: string = undefined;
    public ownerId: string = undefined;
    public config: Config = undefined;

    constructor(config: Config) {
        super({ disableMentions: 'everyone' }); // On empêche le bot de pouvoir faire des @everyone
        this.ownerId = config.ownerId;
        this.prefix = config.prefix;
        this.config = config;

        this.run();
    }

    async run(): Promise<void> {
        this.loadCommands();
        this.on("ready", onReady)
            .on("message", onMessage)
            .on("guildMemberAdd", onGuildMemberJoin)
            .on("guildMemberRemove", onGuildMemberLeft)
            .on("error", () => this.run())
            .on("channelCreate", () => updateStatus)
            .on("channelDelete", () => updateStatus);

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

schedule.scheduleJob('0 0 0 * * *', () => {
    bot.guilds.cache.first().members.cache
        .filter(u => u.lastMessageID === null
            && <number><unknown>(Date.now() / 8.64e7 - u.joinedTimestamp / 8.64e7).toFixed(0) > 7)
        .forEach((u: GuildMember) => {
            bot.emit('guildMemberRemove', u);
            u.send(`${EMOJIS.WARNINGEMOJI} [__Message automatique__] - Vos salons ont été **supprimés** de \`${bot.guilds.cache.first()}\` car vous n'avez **pas parlé 1 seul fois pendant les 7 jours ayant suivis votre arrivée.**`).catch();
        });
});