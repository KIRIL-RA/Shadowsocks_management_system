const { UserWithPassword} = require("./../classes/User");
const { PlatformDatabase } = require("./../classes/Database");
var express = require('express');
var router = express.Router();

router.post('/', async function (req, res, next) {
    const body = req.body;
    const password = body.password;
    const phone = body.phone;
    const email = body.email;
    const companyName = body.companyName;
    const companyDescription = body.companyDescription;
    
    // Setting up default response headers
    res.setHeader('Accept-Encoding', 'gzip, deflate, br');
    res.setHeader('Accept-Language', 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7');
    res.setHeader('Content-Type', 'application/json');

    // Check, is all parameters were recieved
    if (password == undefined || password == null
        || phone == undefined || phone == null
        || email == undefined || email == null
        || companyName == undefined || companyName == null
        || companyDescription == undefined || companyDescription == null) {
        res.status(400).json({message: "Not all data were recieved"});
        return;
    }

    try{
        // Trying connect to database
        await PlatformDatabase.Connect();

        // Trying registrate new user
        const user = new UserWithPassword(PlatformDatabase, email, password);
        await user.Registrate(phone, companyName, companyDescription);

        res.status(200).json({status: "ok"});
    }

    // Catching erros
    catch (e) {
        res.status(500).json({message: e.message});
    }

});

module.exports = router;