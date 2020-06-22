import { Client, Collection } from "discord.js";
import { Command, Config } from "./utils/structs";
import { readdir } from "fs";
import { onReady, onMessage, onGuildMemberJoin, onGuildMemberLeft, updateStatus } from "./events";
import schedule = require("node-schedule");

import * as express from "express";
import * as bodyParser from "body-parser";
import e = require("express");
import * as path from "path";


export class Poltergeist extends Client { // extends Client = hérite des propriétés et méthodes de Discord.Client
    // bot
    public commands: Collection<string, Command> = new Collection();
    public aliases: Collection<string, Command> = new Collection();
    public prefix: string = undefined;
    public ownerId: string = undefined;
    public config: Config = undefined;

    // dashboard
    public app: express.Application = undefined;

    constructor(config: Config) {
        super({ disableMentions: 'everyone' }); // On empêche le bot de pouvoir faire des @everyone
        this.ownerId = config.ownerId;
        this.prefix = config.prefix;
        this.config = config;

        this.run();
    };

    async run(): Promise<void> {
        this.loadCommands();
        this.on("ready", onReady); // Déclenché quand le bot est connecté
        this.on("message", onMessage); // Quand un message est envoyé (soit au bot soit dans un salon)
        this.on("guildMemberAdd", onGuildMemberJoin); // Quand quelqu'un rejoind le serveur
        this.on("guildMemberRemove", onGuildMemberLeft); // Quand quelqu'un quitte le serveur (si il est kick ou ban aussi)
        this.on("error", () => this.run()); // Si il y a une erreur on le redémarre
        this.on("channelCreate", () => updateStatus);
        this.on("channelDelete", () => updateStatus);

        await this.login(this.config.token);

        this.startServer();
    };

    private startServer(): void {
        this.app = express();

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(express.static(__dirname + '/dashboard/views'));

        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '/dashboard/views/'));

        require('./dashboard/router').routes(this.app);

        const PORT = process.env.PORT || 3000;

        this.app.listen(PORT, () => console.log(`Ecoute le port ${PORT}`));
    };

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
                } catch (e) { console.log(e); };
            });
        });
    };
};

export const bot: Poltergeist = new Poltergeist(new Config());
export const app: e.Application = bot.app;