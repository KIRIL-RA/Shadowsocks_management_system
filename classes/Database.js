const MongoClient = require("mongodb").MongoClient;
const Settings = require("./settings/DBSettings.json");

/**
 * Access to db information.
 */
class DBWork {
    constructor(url) {
        this.mongoClient = new MongoClient(url);
    }

    async GetCards(findFilter){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.SERVICES_COLLECTION);

        return await collection.find(findFilter).toArray();
    }

    /**
     * Update info about user in database
     * @param {*} email 
     * @param {*} userInfoToUpdate 
     */
    async UpdateUser(email, userInfoToUpdate){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.USERS_COLLECTION);

        await collection.updateOne({email: email}, {$set: userInfoToUpdate});
    }

    async UpdatePlatformUser(userId, userInfoToUpdate){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.SERVICE_USERS);

        await collection.updateOne({userId: userId}, {$set: userInfoToUpdate});
    }

    /**
     * Get info about one user
     * @param {*} email 
     */
    async GetUser(email){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.USERS_COLLECTION);
        
        let result = await collection.findOne({ email: email });

        return result;
    }
    
    /**
     * Adding new user to database
     * @param {*} userInfo 
     */
    async AddNewUser(userInfo){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.USERS_COLLECTION);

        await collection.insertOne(userInfo);
    }

    async GetFilters(){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.FILTERS_COLLECTION);

        return await collection.find().toArray();
    }

    async GetPartners(){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.PARTNERS_COLLECTION);

        return await collection.find().toArray();
    }

    async GetPartnersWithParameters(findParameters){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.PARTNERS_COLLECTION);

        return await collection.find(findParameters).toArray();
    }

    async UpdatePartners(partnerId,updatingData){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.SERVICE_USERS);

        await collection.updateOne({userId: partnerId}, updatingData);
    }

    async AddCard(cardInfo){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.SERVICES_COLLECTION);

        await collection.insertOne(cardInfo);
    }

    /**
     * Only add new fields or updating exist
     * @param {*} id 
     * @param {*} updateFields 
     */
    async UpdateCard(id, updateFields){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.SERVICES_COLLECTION);

        await collection.updateOne({id: id}, {$set: updateFields});
    }

    async AddPreviewWrite(data){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.PREVIEWS_COLLECTION);

        await collection.insertOne(data);
    }

    async AddPreviewToWrite(id, pushList){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.PREVIEWS_COLLECTION);

        await collection.updateOne({cardId: id}, {$push: {images: pushList}});
    }

    async GetCard(findFilter){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.SERVICES_COLLECTION);

        return await collection.findOne(findFilter);
    }

    async AddServiceToUser(email, cardId){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.USERS_COLLECTION);

        await collection.updateOne({email: email}, {$push: {servicesList: cardId}});
    }

    async GetCardPreviews(cardId){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.PREVIEWS_COLLECTION);

        return await collection.findOne({cardId: cardId});
    }

    async UpdateCardPreviews(cardId, updateFields){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.PREVIEWS_COLLECTION);

        await collection.updateOne({cardId: cardId}, {$set: updateFields});
    }

    async CreateCoupon(couponData){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.COUPONS_COLLECTION);

        await collection.insertOne(couponData);
    }

    async GetCoupons(){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.COUPONS_COLLECTION);

        return collection.find().toArray();
    }

    async GetServiceUsers(findFilter){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.SERVICE_USERS);

        return await collection.find(findFilter).toArray();
    }

    async DeleteCard(cardId){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.SERVICES_COLLECTION);

        collection.deleteOne({id: cardId});
    }

    async DeletePreviews(cardId){
        const datataBase = this.mongoClient.db(Settings.DB_NAME);
        const collection = datataBase.collection(Settings.PREVIEWS_COLLECTION);

        collection.deleteOne({cardId: cardId});
    }

    isConnected() {
        return !!this.mongoClient && !!this.mongoClient.topology && this.mongoClient.topology.isConnected();
    }

    /**
     * Open connection to database
     */
    async Connect() {
        if (!this.isConnected()) await this.mongoClient.connect();
    }

    /**
     * Close connection ro database
     */
    async CloseConnection() {
        await this.mongoClient.close();
    }
}

const DatabaseP = new DBWork(Settings.CONNECTION_STRING);
module.exports = { PlatformDatabase: DatabaseP, DBWork };