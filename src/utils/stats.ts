import { Message, User } from "discord.js";
import { statsDb } from "./structs";
import { saveDB, daysBetween } from "./functions";
import { bot } from "..";

interface fnOptions {
    msg?: Message,
    user?: User
}

type DataName = "members"
    | "messages"
    | "channels";

export interface IStats {
    monthly: IStatsMonth[];
    activity: {
        peoples: {
            [key: string]: number[]
        }
    };
}

export interface IStatsMonth {
    monthName: string;
    year: number;
    members: number;
    messages: number;
    channels: number;
}

export namespace Stats {
    export class Activity {
        private static check(u: User, msg: Message): boolean {
            return !u.bot
                && [ // ID des salons acceptés
                    '705850506412556288', '727978513554210877', '714121901257261137', '714414656860717068', '714121927676919850'
                ].includes(msg.channel.id);
        }

        public static exist(u: User): boolean {
            return statsDb.activity.peoples[u.id] !== undefined;
        }

        public static add(u: User, msg: Message): void {
            if (!this.check(u, msg)) return;
            if (!this.exist(u)) statsDb.activity.peoples[u.id] = [msg.createdTimestamp];
            else statsDb.activity.peoples[u.id].push(msg.createdTimestamp);
        }

        public static empty(): void {
            var d = Date.now();
            for (let t in statsDb.activity.peoples) {
                if (!bot.users.cache.get(t)) delete statsDb.activity.peoples[t];
                else statsDb.activity.peoples[t] = statsDb.activity.peoples[t]
                    .filter(x => daysBetween(x, d) < 7);
            }
            saveDB('stats');
        }
    }

    export class Monthly {
        private static check(d: DataName, o?: fnOptions): boolean {
            if (d === "messages" && o.msg.author.bot) return false;
            if (d === "members" && o.user.bot && o.user.id !== '415925242242924564') return false;
            return true;
        }

        /**
         * Incrémente la valeur du champ donné de 1
         * @param dataName Nom du champ à incrémenter
         * @param options Paramètres en plus
         */
        public static inc(dataName: DataName, options?: fnOptions): void {
            if (!this.check(dataName, options)) return;
            this.modify(dataName, ++this.getLast()[dataName]);
        }

        /**
         * Décrémente la valeur du champ donné de 1
         * @param dataName Nom du champ à décrémenter
         * @param options Paramètres en plus
         */
        public static dec(dataName: DataName, options?: fnOptions): void {
            if (!this.check(dataName, options)) return;
            this.modify(dataName, --this.getLast()[dataName]);
        }

        /**
         * Retourne le dernier élément de la bdd stats.json
         */
        public static getLast(): IStatsMonth {
            return this.getFromBack(1);
        }

        /**
         * Retourne la x ème valeur en partant de la fin
         * @param x
         */
        public static getFromBack(x: number): IStatsMonth {
            return statsDb.monthly[statsDb.monthly.length - x];
        }

        /**
         * Retourne toutes les données de la section monthly
         */
        public static getAll(): IStatsMonth[] {
            return statsDb.monthly;
        }

        /**
         * Modifie la valeur du champ
         * @param categ Nom de la catégorie où se trouve le champ
         * @param dataName Nom du champ à modifier
         * @param newValue Nouvelle valeur du champ
         */
        private static modify(dataName: DataName, newValue: any): void {
            statsDb.monthly.push((function () {
                let t = statsDb.monthly.pop();
                t[dataName] = newValue;
                return t;
            }()));
        }

        public static update(): void {
            this.modify('channels', bot.guilds.cache.first().channels.cache.size);
            this.modify('members', bot.guilds.cache.first().members.cache.filter(m => !m.user.bot).size);
        }
    }

    export class All {
        public static update(): void {
            Monthly.update();
            Activity.empty();
        }
    }
}