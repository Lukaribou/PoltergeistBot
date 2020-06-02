import { bot } from "../..";
import { EMOJIS} from "../../utils/structs"

const router = require('express').Router();

router.get('/', (req, res) => {
    if(!req.query.userId) res.render("<h1>Page introuvable</h1>")
    else res.render('userMenu', {
        "bot": bot,
        "guild": bot.guilds.cache.first(),
        "memberBot": bot.guilds.cache.first().member(bot.user),
        "EMOJIS": EMOJIS
    });
});

module.exports = router;