require('dotenv').config();

const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    supportBigInt: true
});

// These override and add extra functionality to the discord.js module
const Discord = require('discord.js-commands')(require('discord.js'));

// Import the other bots and their commands/data
const anilist = require('floorbot-anilist')(pool);
const weather = require('floorbot-weather')(pool);
const magick = require('floorbot-magick')();
const booru = require('floorbot-booru')();

const { Client, Intents } = Discord;
const client = new Client({
    token: process.env.DISCORD_TOKEN,
    publicKey: process.env.DISCORD_PUBLIC_KEY,
    intents: Intents.ALL,

    handlers: Object.assign({
        markov: { class: require('./handlers/markov/markov'), options: { pool: pool } },
        define: { class: require('./handlers/define/define') },
        utils: { class: require('./handlers/utils/utils') },

        logger: { class: require('./handlers/logger/logger') },
        presence: { class: require('./handlers/presence/presence') },
    }, anilist.handlers, booru.handlers, magick.handlers, weather.handlers)
});

client.login();
