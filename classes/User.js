const { GlaweDatabse, DBWork } = require("./Database");
const { SendOnlyTextMail } = require('./Emailer');
const { CardInfo } = require("../classes/ServiceCard");
const ServerSettings = require('./settings/SERVER.json');
var fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const JWTSecret = "cg2$6Haji(2uI"; // Secret key for gennearting jwt session tokens 
const tokenExpirationTime = (30 * 24 * 60 * 60 * 1000); // Time in ms, for while tokens stay alive

class User {
    /**
     * User object constructor
     * @param {DBWork} DBWork 
     */
    constructor(DBWork, email) {
        this.database = DBWork;
        this.isLogined = false;
        this.email = email;
    }

    GetTokenExpirationTime() { return tokenExpirationTime; }

    /**
     * Generating new session token for next user interactions
     * @returns session token
     */
    async GenerateSessionToken() {
        const userInfo = await this.database.GetUser(this.email);

        // Generating JWT token
        const nowDate = new Date();
        return GenerateJwtToken(nowDate.getTime() + tokenExpirationTime, userInfo.passwordHash, this.email);
    }

    /**
     * Forming link for login without password. If secret not recieved, generating new secret
     * @param {String} secret Secret for login without password
     * @returns secret, if we getting new secret. True or false if secret recieved
     */
    async LoginWithoutPassword(secret) {
        // Getting info about user
        const userInfo = await this.database.GetUser(this.email);
        if (userInfo == null || userInfo == undefined) throw new Error("User not found");

        // Check what we need to do
        if (secret == undefined || secret == null) {
            // Return secret
            return userInfo.passwordHash;
        }
        else {
            this.isLogined = (userInfo.passwordHash == secret);
            return this.isLogined;
        }
    }

    /**
     * Sending recovery password link
     */
    async SendRestorePasswordLink() {
        // Forming needed strings
        const secret = await this.LoginWithoutPassword();
        const recoveryLink = `${ServerSettings.SERVER_IP}/loginwithoutpassword?secret=${secret}&email=${this.email}`;

        // Sending email
        await SendOnlyTextMail(this.email, `<p>Recovery link: http://${recoveryLink}</p> <p>If you see this message, but don't want restore password, just ignore.</p>`, "Password recovery");
    }
}

/**
 * Use only for generate session token, or registry new user
 */
class UserWithPassword extends User {
    /**
     * User object constructor for authentication with passwordHash
     * @param {*} DBWork 
     * @param {*} email 
     * @param {*} password
     */
    constructor(DBWork, email, password) {
        super(DBWork, email);
        this.password = password;
    }

    /**
     * Check is email and password are correct
     * @returns true or false
     */
    async Login() {
        // Request needed information
        const userInfo = await this.database.GetUser(this.email);
        const passwordHash = crypto.createHash('sha256').update(this.password).digest('hex');

        // Check login data
        if (userInfo == null || userInfo == undefined || userInfo.passwordHash != passwordHash) return false;

        this.isLogined = true;
        return true;
    }

    /**
     * Generating new session token for next user interactions
     * @returns session token
     */
    async GenerateSessionToken() {
        const sessionToken = await super.GenerateSessionToken();
        return sessionToken;
    }

    /**
     * Registrate new user
     * @param {*} phone 
     * @param {*} email
     */
    async Registrate(phone) {
        // Request needed information
        let userInfo = await this.database.GetUser(this.email);
        if (userInfo != null || userInfo != undefined) throw new Error("email already exist");
        if (phone == undefined || phone == null) throw new Error("FSL name doesn't recieved");

        // Add new user to databse
        await this.database.AddNewUser({
            email: this.email,
            phone: phone,
            userId: crypto.randomBytes(10).toString('hex'),
            passwordHash: crypto.createHash('sha256').update(this.password).digest('hex'),
        });
    }
}

/** 
 * Use this class for further work with user info
 */
class UserWithToken extends User {
    constructor(DBWork, sessionToken) {
        super(DBWork, undefined);
        this.parsedToken = ParseJwt(sessionToken);
        this.email = this.parsedToken.email;
        this.sessionToken = sessionToken;
    }

    /**
     * Check is email and password are correct
     * @returns true or false
     */
    async Login() {

        // Request needed information
        const userInfo = await this.database.GetUser(this.email);
        const nowDate = new Date();

        // Validate session token
        if (nowDate.getTime() > this.parsedToken.expiresAt) return false;
        if (userInfo === null || userInfo === undefined) return false;
        const generatedToken = GenerateJwtToken(this.parsedToken.expiresAt, userInfo.passwordHash, this.parsedToken.email);
        if (generatedToken != this.sessionToken) return false;
        this.isLogined = true;

        // Formatting user info
        this.FormatUserData(userInfo);

        return this.isLogined;
    }

    /**
     * Save needed fields in this object
     * @param {*} userInfo
     */
    FormatUserData(userInfo) {
        // Check is user logined
        if (!this.isLogined) throw new Error("User not logined");

        this.phone = userInfo.phone;
        this.userId = userInfo.userId;
    }


    /**
     * Get all needed information about user
     * @returns info about user
     */
    async GetUserInfo() {
        return {
            email: this.email,
            phone: this.phone
        }
    }

    /**
     * Edit user info
     * @param {*} param0 
     */
    async Edit({email, password, phone}){
        // Check is user logined
        if (!this.isLogined) throw new Error("User not logined");

        let newUserData = {};
        let isNeedUpdateToken = false;

        // Generate object with all updating data
        newUserData.email = email;
        newUserData.password = password;
        newUserData.phone = phone;
        isNeedUpdateToken = (password != undefined && password!= null) || (email != undefined && email!= null);

        // Delete all null fields
        Object.keys(newUserData).forEach(key => {
            if (newUserData[key] === null || newUserData[key] === undefined) delete newUserData[key];
          });

        // Update password hash
        if(password != undefined && password!= null) newUserData.passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        // Update user data in database
        await this.database.UpdateUser(this.email, newUserData);

        // Update this object fields
        this.email = email == undefined ? this.email : email;
        this.phone = phone == undefined ? this.phone : phone;

        return {
            isNeedUpdateToken: isNeedUpdateToken,
            newToken: isNeedUpdateToken ? await this.GenerateSessionToken(newUserData.passwordHash) : undefined
        };
    }
}

/**
 * Generate jwt token
 * @param {*} expirationDateInMs 
 * @param {*} passwordHash 
 * @param {*} email 
 * @returns 
 */
function GenerateJwtToken(expirationDateInMs, passwordHash, email) {
    const SuperSecret = `${passwordHash}${JWTSecret}`;
    const header = { alg: "HS256", typ: "JWT" };
    const payload = { email: email, expiresAt: expirationDateInMs };
    const unsignedToken = Base64EncodeString(header) + '.' + Base64EncodeString(payload);
    const signature = crypto.createHmac('sha256', SuperSecret).update(unsignedToken).digest('hex');
    const token = Base64EncodeString(header) + '.' + Base64EncodeString(payload) + '.' + Base64EncodeString(signature);

    return token;
}

/**
 * Forming from object base64 data
 * @param {*} object 
 * @returns 
 */
function Base64EncodeString(object) {
    return Buffer.from(JSON.stringify(object)).toString('base64');
}

/**
 * Parsing jwt token
 * @param {*} token 
 * @returns 
 */
function ParseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

/**
 * Function to encode file data to base64 encoded string
 * @param {*} file 
 * @returns 
 */
function Base64Encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer.from(bitmap).toString('base64');
}

module.exports = { UserWithPassword, UserWithToken, User }
