//depends
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');

const app = express();

// Certificate
 const privateKey = fs.readFileSync('/etc/letsencrypt/live/foodfinder.xyz/privkey.pem', 'utf8');
 const certificate = fs.readFileSync('/etc/letsencrypt/live/foodfinder.xyz/cert.pem', 'utf8');
 const ca = fs.readFileSync('/etc/letsencrypt/live/foodfinder.xyz/chain.pem', 'utf8');

 const credentials = {
 	key: privateKey,
 	cert: certificate,
 	ca: ca
};

app.use((req, res) => {
 	res.send('Hello there !');
});

