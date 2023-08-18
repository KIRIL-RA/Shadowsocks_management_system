const SERVER_SETTINGS = require('./../classes/settings/SERVER.json');
const { ShadowObject } = require('./../classes/Shadowsocks');
var express = require('express');
var router = express.Router();

router.post('/', async function (req, res, next) {
    const sessionToken = req.body.token;
    const port = req.body.port;
    const password = req.body.password;

    // Check if all needeв parameters were recieved
    if (sessionToken == undefined || sessionToken == null) {
        res.status(324).send("Login data not recieved");
        return;
    }

    if(port == undefined || port == null
    || password == undefined || password == null){
        res.status(400).json({message: "Not all data were recieved"});
    }

    try {
        if(sessionToken == SERVER_SETTINGS.TOKEN){
            ShadowObject.Connect();
            await ShadowObject.AddNewPort(port, password);
            res.status(200).json({message: 'ok'});
        }

        // If login data incorrect, send messga about it
        else res.status(401).json({ message: "Login data incorrect" });
    }

    // Catching erros
    catch (e) {
        res.status(500).json({ message: e.message });
    }

});

module.exports = router;