import { Message, User } from "discord.js";
import { statsDb } from "./structs";
import { saveDB } from "./functions";

interface fnOptions {
    msg?: Message,
    user?: User
};

type DataName = "members"
    | "messages";

export interface IStats {
    stats: IStatsMonth[];
}

export interface IStatsMonth {
    monthName: string;
    year: number;
    members: number;
    messages: number;
}

export class Stats {
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

    public static dec(dataName: DataName, options?: fnOptions): void {
        if (!this.check(dataName, options)) return;
        this.modify(dataName, --this.getLast()[dataName]);
    }

    /**
     * Retourne le dernier élément de la bdd stats.json
     */
    private static getLast(): IStatsMonth {
        return statsDb.stats[statsDb.stats.length - 1];
    }

    /**
     * Modifie la valeur du champ
     * @param dataName Nom du champ à modifier
     * @param newValue Nouvelle valeur du champ
     */
    private static modify(dataName: DataName, newValue: any): void {
        statsDb.stats.push(statsDb.stats.pop()[dataName] = newValue);
        saveDB('stats');
    }

    public static getAll(): IStatsMonth[] {
        return statsDb.stats;
    }
}