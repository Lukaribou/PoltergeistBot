import { bot } from "../..";
import { EMOJIS} from "../../utils/structs"

const router = require('express').Router();

router.get('/', (req, res) => {
    res.render('home', {
        "bot": bot,
        "guild": bot.guilds.cache.first(),
        "memberBot": bot.guilds.cache.first().member(bot.user),
        "EMOJIS": EMOJIS
    });
});

module.exports = router;