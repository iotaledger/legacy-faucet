var IOTA = require('iota.lib.js');
var express = require('express')
var app = express()
var server = require('http').Server(app);

var basicAuth = require('express-basic-auth');
var Faucet = require('./faucet.js');
var faucet = new Faucet();
var RateLimit = require('express-rate-limit');
var reCAPTCHA = require('recaptcha2')

var site_key = process.env['SITE_KEY'];
var secret_key = process.env['SECRET_KEY'];

var recaptcha = new reCAPTCHA({
    siteKey: site_key,
    secretKey: secret_key
});

console.log(site_key, secret_key);

//app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)

var apiLimiter = new RateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    delayMs: 0,
    message: "Too many requests from this IP, please try again after some time"
});

// only apply to requests that begin with /api/
app.use('/faucet', apiLimiter);

app.use(express.static(__dirname + '/public'));


app.get('/faucet', function(req, res) {

    if (req.query.recaptcha) {
        recaptcha.validate(req.query.recaptcha).then(function() {
                if (req.query && req.query.address) {
                    var value = process.env['TOKEN_AMOUNT'] || 1000;

                    try {
                        faucet.transfer(req.query.address, value, function(err, transactions) {
                            if (err) {
                                res.status(500).json({ error: err });
                            }
                            else {
                                res.json(transactions);
                            }
                        });
                    }
                    catch (e) {
                        console.error(e);
                        res.status(500).json({ error: e.message });
                    }
                }
                else {
                    res.status(500).json({ error: 'address not present in URL.' });
                }
                return Promise.resolve(true);
            })
            .catch(function(errorCodes) {
                // invalid
                res.status(500).json({ error: recaptcha.translateErrors(errorCodes) }); // translate error codes to human readable text
            });
    }
    else {
        res.status(500).json({ error: 'captcha not present in the request' });
    }
});

app.get('/info', function(req, res) {

    faucet.info(function(err, result) {
        res.json(result);
    });
});


var port = parseInt(process.env['PORT']) || 8888;
var host = process.env['HOST'] || "0.0.0.0";

console.log("Serving IOTA Fuacet at http://" + host + ":" + port);

server.listen(port, host);