### IOTA Faucet service
Faucet is a web based service which allocates funds to a requested address. The server runs with a master seed and allocates funds to a RPCHub seed user. 
Further addresses distribution is done via RPCHub. 

### Install 
`npm install`

### Run

You should have RPC Hub server up and running with database. Specify the address in configuration parameter. 

You could run simply as a standalone node js service

`node index.js`

or via pm2

`pm2 start ecosystem.config.js`

Check the environment params in ecosystem.config.js for configurable options-

### DoS prevention
The application uses captcha in browser and express-rate-limit on server to prevent against DoS attacks. 


