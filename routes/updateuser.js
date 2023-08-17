const { UserWithToken } = require("./../classes/User");
const { PlatformDatabase } = require("./../classes/Database");
const { EditUser } = require('./../classes/ServiceUsers');
var express = require('express');
var router = express.Router();

router.post('/', async function (req, res, next) {
    const sessionToken = req.cookies.sessionToken;
    const body = req.body;
    const userId = body.userId;
    const fslName = body.fslName;
    const birthDate = body.birth;
    const password = body.password;
    const phone = body.phone;
    const email = body.email;

    // Setting up default response headers
    res.setHeader('Accept-Encoding', 'gzip, deflate, br');
    res.setHeader('Accept-Language', 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7');
    res.setHeader('Content-Type', 'application/json');

    // Check if all neede parameters were recieved
    if (sessionToken == undefined || sessionToken == null) {
        res.status(324).send("Login data not recieved");
        return;
    }

    try {
        // Trying connect to database
        await PlatformDatabase.Connect();

        const user = new UserWithToken(PlatformDatabase, sessionToken);
        // If user logined successfully, update user info
        if (await user.Login()) {

            // If user want to update yourself
            if (userId == undefined) {
                const updateResult = await user.Edit({ password: password, phone: phone, email: email });

                // Update sessionn token
                if (updateResult.isNeedUpdateToken) res.cookie("sessionToken", updateResult.newToken, { req, res, maxAge: user.GetTokenExpirationTime(), httpOnly: true });
            }
            // If user want update another user
            else{
                await EditUser(PlatformDatabase, userId, { password: password, phone: phone, email: email, fslName: fslName, birthDate: birthDate });
            }

            res.status(200).json({ status: "ok" });
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