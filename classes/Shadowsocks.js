const file = require('./File');
const SERVER_SETTINGS = require('./settings/SERVER.json');
const dgram = require('dgram');

class Shadowsocks {
    constructor() {
        this.managerPort = SERVER_SETTINGS.MANAGER_PORT;
        this.socketPort = SERVER_SETTINGS.SOCKET_PORT;
        this.isConnected = false;
        this.client = undefined;
        this.unreadedMessagesCount = 0;
        this.messages = [];
    }

    Connect() {
        // Initializing socket
        if (this.isConnected) throw new Error("Shadowsocks already connected");
        this.client = dgram.createSocket('udp4');

        this.client.bind(this.socketPort);
        this.client.on('message', async msg => {
            if (this.messages.length >= 1000) this.messages = [];

            const msgStr = new String(msg);
            this.messages.push({ isReaded: false, message: msgStr });
            this.unreadedMessagesCount++;
        });

        this.isConnected = true;
    }

    /**
     * Add new port to shadowsocks
     * @param {*} port 
     * @param {*} password 
     */
    async AddNewPort(port, password) {
        // Reading config
        const configFile = file.ReadVpnConfig();
        let config = JSON.parse(configFile);

        // Validating port
        if (config.port_password[String(port)] != undefined ||
            !(99999 > Number(port) && Number(port) > 1) ||
            port == 22 || port == SERVER_SETTINGS.SERVER_PORT ||
            port == SERVER_SETTINGS.MANAGER_PORT || port == SERVER_SETTINGS.SOCKET_PORT) throw new Error("Port can't be used, please choose another one");

        // Validating password
        if (!(20 >= password.length && password.length >= 8)) throw new Error("Password can't be used");

        // Adding new port
        config.port_password[String(port)] = password;
        this.client.send(`add: {"server_port":${port}, "password":"${password}"}`, this.managerPort, '127.0.0.1');
        let message = await this.ReadMessage();
        while (message != 'ok') {
            if (message == undefined) throw new Error("Some problem with shadowsocks");
            message = await this.ReadMessage();
        }

        // Updating config file
        file.UpdateVpnConfig(JSON.stringify(config));
        console.log("Ok");
    }

    /**
     * Removing port from shadowsocks
     * @param {*} port 
     */
    async RemovePort(port) {
        // Reading config
        const configFile = file.ReadVpnConfig();
        let config = JSON.parse(configFile);

        // Deleting port
        if (config.port_password[String(port)] != undefined) {
            delete config.port_password[String(port)];
            this.client.send(`remove: {"server_port":${port}}`, this.managerPort, '127.0.0.1');
            let message = await this.ReadMessage();
            while (message != 'ok') {
                if (message == undefined) throw new Error("Some problem with shadowsocks");
                message = await this.ReadMessage();
            }

            // Updating config file
            file.UpdateVpnConfig(JSON.stringify(config));
        }
    }

    /**
     * Read messages by queue
     * @returns String from first unreaded message
     */
    async ReadMessage() {
        let count = 0;

        // Waiting new message fow 1 second
        while (this.unreadedMessagesCount <= 0) {
            await new Promise(r => setTimeout(r, 100));
            count++;

            if (count > 10) return undefined;
        }

        // Reading first unreaded message
        const lastMessage = this.messages[this.messages.length - this.unreadedMessagesCount];
        const messageStr = String(lastMessage?.message);
        this.messages[this.messages.length - this.unreadedMessagesCount].isReaded = true;

        // Getting needed data from string
        let finalStr = messageStr.replace("[String: '", '');
        finalStr = finalStr.replace("']", '');

        this.unreadedMessagesCount--;

        return finalStr;
    }
}

let shadow = new Shadowsocks();
shadow.Connect();
shadow.AddNewPort('2012', "passwrosf");