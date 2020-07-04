import { bot } from './index';
import { Message, GuildMember, MessageEmbed, TextChannel, MessageReaction, EmojiResolvable, Collection, User, CategoryChannel, ReactionCollector } from 'discord.js';
import { Command, botsListDb, EMOJIS, mutedRole } from './utils/structs';
import { getMemberCategory } from './utils/functions';

export function onReady(): void {
    (<TextChannel>bot.guilds.cache.first().channels.cache.get("712578364577153024")).messages.fetch("712580174360739871").catch()
    console.log(`Connecté sur ${bot.guilds.cache.first()}, ${bot.guilds.cache.first().memberCount} membres et ${bot.guilds.cache.first().channels.cache.size} salons.`);
    updateStatus();
};

// async + Promise<void> = fonction asynchrone (async: où on peut attendre qlq chose avec await) qui ne retourne rien (void)
export async function onMessage(message: Message): Promise<void> {
    if (message.author.bot
        || !["text", "news", "shop"].includes(message.channel.type)) return;
    if (message.content.trim() === `<@!${bot.user.id}>`) {
        message.channel.send(`${EMOJIS.RIGHTARROW} \`${bot.config.prefix}help\``);
        return;
    };

    bot.cooldown.warns.set("415925242242924564", 5)

    if (message.channel.id === "705850506412556288" // Que dans le général
        && !message.member.hasPermission("ADMINISTRATOR")) {
        if (!bot.cooldown.fast.includes(message.author.id)) {
            bot.cooldown.fast.push(message.author.id);
            setTimeout(() =>
                bot.cooldown.fast = bot.cooldown.fast.filter(x => x !== message.author.id),
                1e3);
        } else {
            if (bot.cooldown.warns.has(message.author.id)) {
                bot.cooldown.warns.set(message.author.id, bot.cooldown.warns.get(message.author.id) + 1)
                switch (bot.cooldown.warns.get(message.author.id)) {
                    case 3:
                        message.channel.send(`${EMOJIS.WARNINGEMOJI} ${message.author.id} **Si vous continuez de spammer vous serez sanctionné(e) !**`);
                        break;
                    case 5:
                        message.guild.members.cache
                            .filter(m => m.hasPermission("ADMINISTRATOR")
                                && !m.user.bot
                                && m.user.presence.status !== "offline"
                                && m.id !== bot.config.ownerId)
                            .forEach(m => m.user.send(`${message.author} **(Pseudo: \`${message.author.username}\`, ID: \`${message.author.id}\`) a atteint les 5 warns du système anti-spam !**`).catch());
                        bot.users.cache.get(bot.config.ownerId).send(`${message.author} **(Pseudo: \`${message.author.username}\`, ID: \`${message.author.id}\`) a atteint les 5 warns du système anti-spam !**`).catch();
                        message.channel.send(`${EMOJIS.ADMINSEMOJI} **Un membre du staff a été prévenu.**`);
                        break;
                    case 7:
                        message.member.roles.add(mutedRole, "[Système anti-spam] Palié 4 atteint, sanction automatique.")
                            .then(() => {
                                message.channel.send(`${EMOJIS.ADMINSEMOJI} ${message.author} **s'est fait mute pour spam.**`);
                                setTimeout(() => message.member.roles.remove(mutedRole).catch(), 1.8e6);
                            })
                            .catch();
                        break;
                    default:
                    //
                }
                setTimeout(() => decCooldownWarn(message.author), 3e5);
            } else {
                bot.cooldown.warns.set(message.author.id, 1);
                setTimeout(() => decCooldownWarn(message.author), 2e4)
            }
            await message.delete().catch();
            message.channel.send(`${EMOJIS.WARNINGEMOJI} ${message.author} **Le salon général possède un cooldown de 1 seconde.**`)
                .then((m) => m.delete({ timeout: 2e3 }).catch());
            return;
        }
    }

    if (!message.content.startsWith(bot.prefix)) return; // Si le message ne commence pas par le prefix

    const command: string = message.content.split(" ")[0].substring(bot.prefix.length); // exemple: p!eval je suis con => command = test
    const args: string[] = message.content.split(" ").slice(1); // exemple: p!eval je suis con => args = ["je", "suis", "con"]

    if (bot.commands.has(command) || bot.aliases.has(command)) {
        const comm: Command = bot.commands.get(command) || bot.aliases.get(command);
        message.delete().catch();
        comm.execute({ args: args, message: message, bot: this }).catch();
    };
};

export async function onGuildMemberJoin(member: GuildMember): Promise<void> { // \n = retour à la ligne
    /**
     * Renvoie l'émoji à partir de son id
     * @param {string} e id de l'émoji
     */
    const emf = (e: string): EmojiResolvable => isNaN(parseInt(e)) ? e : bot.emojis.cache.get(e);
    // Façon de déclarer une fonction sur une ligne | opérateur ternaire =   condition ? true : false

    member.roles.add('717099769322930176');

    let em: MessageEmbed = new MessageEmbed()
        .setColor(0x0000FF)
        .setDescription(`Cliquez sur les réactions pour choisir quels bots vous souhaitez utiliser.\n${EMOJIS.WARNINGEMOJI} Si le salon existe déjà, il est possible qu'il soit dupliqué.\n\n${EMOJIS.OKEMOJI} pour valider, ${EMOJIS.XEMOJI} pour annuler.`); // 0x0000FF = #0000FF = 0, 0, 255 = bleu
    botsListDb.list
        .forEach((e: [string, string]) =>
            em.addField(`**__${member.guild.member(e[0]).user.username}__**`, emf(e[1]), true)); // e[0] = id, e[1] = émoji

    member.user.send(em)
        .then(async (msg: Message) => {
            const collector: ReactionCollector = msg.createReactionCollector((_, user: User) =>
                user.id == member.user.id, { time: 3e5 }); // On ne prend que les réactions de l'utilisateur | 3e5 ms = 5 minutes

            botsListDb.list.forEach(async (e: [string, string]) =>
                await msg.react(emf(e[1])).catch()); // Pour chaque entrée on réagit avec l'émoji donné

            await msg.react(EMOJIS.OKEMOJI).catch();
            await msg.react(EMOJIS.XEMOJI).catch();

            collector.on('collect', (reaction: MessageReaction) => { // Quand une réaction est ajoutée
                switch (reaction.emoji.name) {
                    case EMOJIS.XEMOJI:
                        collector.stop('xemoji');
                        break;
                    case EMOJIS.OKEMOJI:
                        collector.stop('okemoji');
                        break;
                    default:
                    // rien mais on le met quand même
                };
            });

            collector.on('end', async (collected: Collection<string, MessageReaction>, reason: string) => {
                let msgContent: string = "";

                switch (reason) {
                    case 'okemoji':
                        if (collected.size == 1) { msgContent = `${EMOJIS.WARNINGEMOJI} **Vous n'avez choisi aucun bot. Si vous souhaitez réavoir ce menu, faites la commande \`cbc\` sur le serveur.**`; break; }
                        // Si la taille est égale à 1 ça veut dire qu'il n'y a que l'émoji OK

                        msgContent.concat(`${EMOJIS.OKEMOJI} **Je vais vous créer les salons pour les bots:**`);
                        collected.delete(EMOJIS.OKEMOJI); // On retire le OK

                        var userCategory: CategoryChannel = <CategoryChannel>member.guild.channels.cache
                            .filter(c => c.type == 'category'
                                && !c.permissionsFor(member.guild.roles.everyone).has("VIEW_CHANNEL")
                                && c.permissionsFor(member).has(["STREAM", "USE_VAD", "PRIORITY_SPEAKER"]))
                            .first(); // On filtre les salons en gardant que les catégories

                        if (!userCategory)
                            await member.guild.channels.create(member.user.username, { // Si il n'a pas de catégorie on la crée
                                type: 'category',
                                reason: `Catégorie inexistante pour création des salons de bots de ${member.user.username}.`,
                                permissionOverwrites: [
                                    {
                                        id: member, // Pour l'utilisateur
                                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'STREAM', 'USE_VAD', 'PRIORITY_SPEAKER']
                                    },
                                    {
                                        id: member.guild.roles.everyone, // Pour everyone
                                        deny: ['VIEW_CHANNEL']
                                    }
                                ]
                            }).then(c => {
                                userCategory = c;
                                member.user.send(`${EMOJIS.OKEMOJI} **Votre catégorie a été créée. ${EMOJIS.WARNINGEMOJI} Le bot détermine quelle catégorie est la votre grâce aux permissions de celles-ci, merci donc de ne pas les modifier.**`).catch();
                            }).catch(e => {
                                member.user.send(`${EMOJIS.XEMOJI} **Une erreur est survenue...\nEnvoyez une capture d'écran de ce message à** ${bot.users.cache.get(bot.config.ownerId)}:\`\`\`${e}\`\`\``).catch();
                                return;
                            });

                        collected.forEach(async (_, key: string) => {
                            var selectedBotId: string = botsListDb.list.find((x: string[]) => x[1] == key)[0]; // On prend le bot correspondant à l'émoji

                            if (selectedBotId && bot.users.cache.get(selectedBotId)) {
                                let selectedBot: User = bot.users.cache.get(selectedBotId);
                                msgContent.concat(` \`${selectedBot.username}\``);

                                await member.guild.channels.create(selectedBot.username, {
                                    type: 'text',
                                    topic: `Salon créé pour ${member}`,
                                    reason: `L'utilisateur ${member.user.username} a choisi ce bot.`,
                                    parent: userCategory // On l'ajoute à la catégorie
                                }).catch(e => { member.user.send(`${EMOJIS.XEMOJI} **Une erreur est survenue...\nEnvoyez une capture d'écran de ce message à** ${bot.users.cache.get(bot.config.ownerId)}:\`\`\`${e}\`\`\``).catch(); return; });
                            };
                        });
                        msgContent = `${EMOJIS.OKEMOJI} **Vos salons ont bien été créés. Si vous ne les voyez pas, merci de contacter un administrateur.**`;
                        break;
                    case 'xemoji':
                        msgContent = `${EMOJIS.XEMOJI} **Vous avez annulé votre action.**`;
                        break;
                    default:
                        msgContent = `${EMOJIS.WARNINGEMOJI} **Temps imparti de 5 minutes dépassé.**`;
                };

                msg.channel.send(msgContent).catch();

                (await msg.suppressEmbeds().catch())
                    .delete().catch();
            });
        }).catch(() => {
            (<TextChannel>member.guild.channels.cache.get('705851074921234432'))
                .send(`${EMOJIS.WARNINGEMOJI} ${member} **Je n'arrive pas à vous envoyer un message privé. Changez vos paramètres puis faites la commande \`${bot.config.prefix}cbc\` pour que je vous renvoie le message et que vous puissiez choisir vos salons.**`).catch();
            return;
        });
    // Si il y a une erreur c'est sûrement que le bot n'arrive pas à envoyer un MP à la personne
    // <TextChannel> me permet de caster (changer le type)

    updateStatus();
}

export async function onGuildMemberLeft(member: GuildMember): Promise<void> {
    if (member.permissions.any(['ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_ROLES'])) return;

    var categ = getMemberCategory(member);
    if (categ && !categ.name.startsWith('duo -')) {
        categ.children.forEach(child =>
            child.delete(`Suppression automatique des salons de ${member.user.tag}.`).catch());
        categ.delete(`Suppression automatique des salons de ${member.user.tag}.`).catch();
    };

    updateStatus();
}

export async function onReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
    var em = botsListDb.reactionRoles.list.filter(x => x[1] == reaction.emoji.name)[0]
    if (!reacTest(reaction)
        || bot.guilds.cache.first().member(user).roles.cache.has(em[0])) return;
    bot.guilds.cache.first().member(user).roles
        .add(bot.guilds.cache.first().roles.cache.get(em[0])).catch();
}

export async function onReactionRemove(reaction: MessageReaction, user: User): Promise<void> {
    var em = botsListDb.reactionRoles.list.filter(x => x[1] == reaction.emoji.name)[0]
    if (!reacTest(reaction)
        || !bot.guilds.cache.first().member(user).roles.cache.has(em[0])) return;
    bot.guilds.cache.first().member(user).roles
        .remove(bot.guilds.cache.first().roles.cache.get(em[0])).catch();
}

const reacTest = (reaction: MessageReaction) =>
    reaction.message.channel.type === 'text'
    && reaction.message.id === botsListDb.reactionRoles.messageId
    && botsListDb.reactionRoles.list.map(x => x[1]).includes(reaction.emoji.name);

/**
 * Actualise le statut du bot
 */
export function updateStatus(): void {
    bot.user.setActivity(`${bot.config.prefix}help, ${bot.guilds.cache.first().channels.cache.size} salons pour ${bot.guilds.cache.first().memberCount} membres`, { type: "WATCHING" }); // Configurer le "Joue à"
}

function decCooldownWarn(u: User) {
    let temp = bot.cooldown.warns.get(u.id);
    temp === 1 ? bot.cooldown.warns.delete(u.id) : bot.cooldown.warns.set(u.id, temp - 1);
}