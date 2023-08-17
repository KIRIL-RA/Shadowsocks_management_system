const fs = require('fs');
const path = require('path');

const configPathFile = './settings/SHADOWSOCKS.json';

/**
 * Reading config file
 * @returns Readed configuration file
 */
function ReadVpnConfig(){
    const readedData = fs.readFileSync(path.join(configPathFile));
    return readedData;
}

/**
 * Write new info in config file
 */
function UpdateVpnConfig(newFileData){
    fs.writeFileSync(path.join(configPathFile), newFileData);
}

module.exports = {ReadVpnConfig, UpdateVpnConfig};