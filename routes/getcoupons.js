const { UserWithToken } = require("./../classes/User");
const { PlatformDatabase } = require("./../classes/Database");
const { GetCoupons } = require("./../classes/Coupons");
var express = require('express');
var router = express.Router();

router.get('/', async function (req, res, next) {
    // Getting session info
    const sessionToken = req.cookies.sessionToken;
    const page = req.query.page == undefined ||  req.query.page < 1 ? 1 : req.query.page;

    // Check if all neede parameters were recieved
    if (sessionToken == undefined || sessionToken == null) {
        res.status(324).send("Login data not recieved");
        return;
    }

    try {
        // Trying connect to database
        await PlatformDatabase.Connect();

        const user = new UserWithToken(PlatformDatabase, sessionToken);
        // If user logined successfully, send card list
        if (await user.Login()){
            res.status(200).json(await GetCoupons(PlatformDatabase, page));
        }

        // If login data incorrect, send messga about it
        else res.status(401).json({message: "Login data incorrect"});

        return;
    }

    // Catching errors
    catch (e) {
        res.status(500).json({ message: e.message });
    }

});

module.exports = router;