import { bot } from "../..";

const router = require('express').Router();

router.get('/', (req, res) => {
    res.render('home', {
        "bot": bot
    });
});

module.exports = router;