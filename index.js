const {program} = require('./program');
const {fetcher} = require('./program/utils/marketfetcher')
const pad = require("pad");
const colors = require("colors");
const axios = require('axios');
const _ = require('lodash')
// Start the app
//program.init();


fetcher.latest();

