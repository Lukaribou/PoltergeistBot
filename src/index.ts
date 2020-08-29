import { Client, Collection } from "discord.js";
import { Command, Config } from "./utils/structs";
import { readdir } from "fs";
import { onReady, onMessage, onReactionAdd, onReactionRemove } from "./events";

export class Poltergeist extends Client {
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
        super({ disableMentions: 'everyone' });
        this.ownerId = config.ownerId;
        this.prefix = config.prefix;
        this.config = config;

        this.run();
    }

    async run(): Promise<void> {
        this.loadCommands();
        this.on("ready", onReady)
            .on("message", onMessage)
            .on("error", () => this.run())
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