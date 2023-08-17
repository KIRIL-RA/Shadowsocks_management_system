class ValidatonError extends Error{
    constructor(msg){
        super(msg);
        this.name = "Validation error"
    }
}

module.exports = {ValidatonError};