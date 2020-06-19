import { bot } from './index';
import { Message, GuildMember, MessageEmbed, TextChannel, MessageReaction, EmojiResolvable, Collection, User, CategoryChannel, ReactionCollector } from 'discord.js';
import { Command, botsListDb, EMOJIS } from './utils/structs';

export function onReady(): void {
    console.log(`Connecté sur ${bot.guilds.cache.first()}, ${bot.guilds.cache.first().memberCount} membres et ${bot.guilds.cache.first().channels.cache.size} salons.`);
    updateStatus();
};

// async + Promise<void> = fonction asynchrone (async: où on peut attendre qlq chose avec await) qui ne retourne rien (void)
export async function onMessage(message: Message): Promise<void> {
    if (message.author.bot) return; // Si l'auteur du message est un bot
    if (!["text", "news", "shop"].includes(message.channel.type)) return; // Si le message est ailleurs que dans un salon texte sur un serveur en gros
    if (message.content.trim() === `<@!${bot.user.id}>`) { message.channel.send(`${EMOJIS.RIGHTARROW} \`${bot.config.prefix}help\``); return; };
    if (!message.content.startsWith(bot.prefix)) return; // Si le message ne commence pas par le prefix

    const command: string = message.content.split(" ")[0].substring(bot.prefix.length); // exemple: p!eval je suis con => command = test
    const args: string[] = message.content.split(" ").slice(1); // exemple: p!eval je suis con => args = ["je", "suis", "con"]

    if (bot.commands.has(command) || bot.aliases.has(command)) {
        const comm: Command = bot.commands.get(command) || bot.aliases.get(command);
        comm.execute({ args: args, message: message, bot: this })
            .catch()
            .then(() => message.fetch()
                .catch()
                .then(m => m.delete()));
    };
};

export async function onGuildMemberJoin(member: GuildMember): Promise<void> { // \n = retour à la ligne
    /**
     * Renvoie l'émoji à partir de son id
     * @param {string} e id de l'émoji
     */
    const emf = (e: string): EmojiResolvable => isNaN(parseInt(e)) ? e : bot.emojis.cache.get(e); // Façon de déclarer une fonction sur une ligne | opérateur ternaire =   condition ? true : false
    // parseInt(): convertit l'argument en nombre, si il ne réussit pas il renvoie NaN

    updateStatus()

    let em: MessageEmbed = new MessageEmbed().setColor(0x0000FF).setDescription(`Cliquez sur les réactions pour choisir quels bots vous souhaitez utiliser.\n${EMOJIS.WARNINGEMOJI} Si le salon existe déjà, il est possible qu'il soit dupliqué.\n\n${EMOJIS.OKEMOJI} pour valider, ${EMOJIS.XEMOJI} pour annuler.`); // 0x0000FF = #0000FF = 0, 0, 255 = bleu
    botsListDb.list.forEach((e: [string, string]) => em.addField(`**__${member.guild.member(e[0]).user.username}__**`, emf(e[1]), true)); // e[0] = id, e[1] = émoji
    member.send(em)
        .then(async msg => { // Une fois que le message a été envoyé, on le récupère
            const collector: ReactionCollector = msg.createReactionCollector((_, user: User) => user.id == member.user.id, { time: 3e5 }); // On ne prend que les réactions de l'utilisateur | 3e5 ms = 5 minutes
            botsListDb.list.forEach(async (e: [string, string]) => await msg.react(emf(e[1])).catch()); // Pour chaque entrée on réagit avec l'émoji donné
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

                        var userCategory: CategoryChannel = <CategoryChannel>member.guild.channels.cache.filter(c => c.type == 'category' && !c.permissionsFor(member.guild.roles.everyone).has("VIEW_CHANNEL") && c.permissionsFor(member).has(["STREAM", "USE_VAD", "PRIORITY_SPEAKER"])).first(); // On filtre les salons en gardant que les catégories

                        if (!userCategory) await member.guild.channels.create(member.user.username, { // Si il n'a pas de catégorie on la crée
                            type: 'category',
                            reason: `Catégorie inexistante pour création des salons de bots de ${member.user.username}.`,
                            permissionOverwrites: [
                                {
                                    id: member, // Pour l'utilisateur
                                    allow: ['MANAGE_CHANNELS', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'STREAM', 'USE_VAD', 'PRIORITY_SPEAKER']
                                },
                                {
                                    id: member.guild.roles.everyone, // Pour everyone
                                    deny: ['VIEW_CHANNEL']
                                },
                                {
                                    id: member.guild.roles.cache.get('706783593040445482'), // Pour Muted
                                    deny: ['SEND_MESSAGES', 'ADD_REACTIONS', 'SPEAK']
                                }
                            ]
                        }).then(c => {
                            userCategory = c;
                            member.send(`${EMOJIS.OKEMOJI} **Votre catégorie a été créée. ${EMOJIS.WARNINGEMOJI} Le bot détermine quelle catégorie est la votre grâce aux permissions de celles-ci, merci donc de ne pas les modifier.**`);
                        }).catch(e => { member.send(`${EMOJIS.XEMOJI} **Une erreur est survenue...\nEnvoyez une capture d'écran de ce message à** ${bot.users.cache.get(bot.config.ownerId)}:\`\`\`${e}\`\`\``); return; });

                        collected.forEach(async (_, key: string) => {
                            var selectedBotId: string = botsListDb.list.find((x: string[]) => x[1] == key)[0]; // On prend le bot correspondant à l'émoji
                            if (selectedBotId && bot.users.cache.get(selectedBotId)) { // get() renvoie undefined si il n'a rien trouvé, undefined vaut false dans une condition
                                let selectedBot: User = bot.users.cache.get(selectedBotId);
                                msgContent.concat(` \`${selectedBot.username}\``);
                                await member.guild.channels.create(selectedBot.username, {
                                    type: 'text',
                                    topic: `Salon créé pour ${member}`,
                                    reason: `L'utilisateur ${member.user.username} a choisi ce bot.`,
                                    parent: userCategory // On l'ajoute à la catégorie
                                }).catch(e => { member.send(`${EMOJIS.XEMOJI} **Une erreur est survenue...\nEnvoyez une capture d'écran de ce message à** ${bot.users.cache.get(bot.config.ownerId)}:\`\`\`${e}\`\`\``); return; });
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
                msg.delete().then(() => msg.channel.send(msgContent)).catch();
            });
        })
        .catch(() => (<TextChannel>member.guild.channels.cache.get('705851074921234432')).send(`${EMOJIS.WARNINGEMOJI} ${member} **Je n'arrive pas à vous envoyer un message privé. Changez vos paramètres puis faites la commande \`cbc\` pour que je vous renvoie le message et que vous puissiez choisir vos salons.**`));
    // Si il y a une erreur c'est sûrement que le bot n'arrive pas à envoyer un MP à la personne
    // <TextChannel> me permet de caster (changer le type)
};

export async function onGuildMemberLeft(member: GuildMember): Promise<void> {
    updateStatus()
    if (member.permissions.any(['ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_ROLES'])) return;
    member.guild.channels.cache.filter(c => c.type === 'category').forEach(c => {
        if (c.permissionsFor(member).has(['MANAGE_CHANNELS', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'STREAM', 'USE_VAD', 'PRIORITY_SPEAKER']) && !c.permissionsFor(member.guild.roles.everyone).has('VIEW_CHANNEL')) {
            c.delete(`Suppression automatique des salons de ${member.user.tag}.`).catch();
            (c as CategoryChannel).children.forEach(child => child.delete(`Suppression automatique des salons de ${member.user.tag}.`).catch());
        };
    });
};

/**
 * Actualise le statut du bot
 */
export function updateStatus(): void {
    bot.user.setActivity(`${bot.config.prefix}help, ${bot.guilds.cache.first().channels.cache.size} salons pour ${bot.guilds.cache.first().memberCount}`, { type: "WATCHING" }); // Configurer le "Joue à"
}