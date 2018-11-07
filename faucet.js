var IOTA = require('iota.lib.js');
//const remoteCurl = require('@iota/curl-remote')
var Promise = require('promise');

var srcAddress = [];

const srcSeed = process.env['SEED'];
var clientPoW = process.env['CLIENT_POW']==='1' ? true : false;
const provider = process.env['PROVIDER'] || 'https://nodes.devnet.iota.org';
const explorer = process.env['EXPLORER'] || "https://devnet.thetangle.org/";
const hubAddress = process.env['HUB_ADDRESS'] || "0.0.0.0:50051";
const depth = parseInt(process.env['DEPTH']) || 9;
const MWM = parseInt(process.env['MWM']) || 14;
const site_key = process.env['SITE_KEY'];
const seeduser = process.env['HUB_SEED_USER']|| "HUBSEEDUSERIOTA123";

var PROTO_PATH = './proto/hub.proto';
var fs = require('fs');
var path = require('path');
var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
    
    
// IOTA node and powbox are separate servers
// Create an IOTA object as usual
const iota = new IOTA({ provider })

// Monkeypatch `attachToTangle` to use the powbox
//remoteCurl(iota, powbox)

var iriInfo = {};
var eta = 0;

function Faucet() {
    
    this.hubOK = false;
    var self = this;
    
    iota.api.getNodeInfo(function(error, success) {
        if (error) {
            console.error(error);
        }
        else {
            //console.log(success);
            iriInfo = success;
        }
    });
    var routeguide = grpc.loadPackageDefinition(packageDefinition).hub.rpc;
    
    self.hubClient = new routeguide.Hub(hubAddress,
                                       grpc.credentials.createInsecure());



    self.hubClient.GetBalance({userId: seeduser}, function(err, result){
    
    if (err){
        console.log(err);
    }
    if (err || result.available == 0){
        
      console.log("Hub Seed user is not found or balance empty. Initiated funding");
       self.hubClient.CreateUser({userId: seeduser}, function(err, result){
           
            self.hubClient.GetDepositAddress({userId: seeduser}, function(err, result){
                var dstAddress = result.address;
               
                iota.api.getAccountData(srcSeed, function(err, transactions) {
                    var available = transactions.balance;
                    
                    console.log("Transferring balance of ", available, " from the seed to the Hub address", dstAddress);
                    const transfers = [{
                        'address': dstAddress,
                        'value': available
                    }];
    
                    iota.api.sendTransfer(srcSeed, depth, MWM, transfers, {}, function(err, transactions) {
                        if (err) {
                            // handle error
                            console.log(err)
                        }
                        else{
                             console.log("Transfer initiated to the Hub balance. Please check for the deposit confirmation for address", dstAddress);
                             console.log("Restart faucet and RPC Hub once deposit is successful");
                             process.exit(0);
                        }
                    });
                });
                
            });
        });
    }
    else {
        console.log("Hub Balance in the seed account is ", result.available);
        console.log("✔✔✔ We are good to go ✔✔✔");
        
        self.hubOK = true;
    }
    
    
});    
    
}




Faucet.prototype.info = function(cb) {
    cb(null, {
        server: provider,
        explorer: explorer,
        clientPoW: clientPoW,
        iriInfo: iriInfo,
        ETA: eta,
        depth: depth,
        MWM: MWM,
        siteKey: site_key
    });
};


Faucet.prototype.transfer = function(dstAddress, amount, cb) {

    if (!this.hubOK){
        return cb("Hub is not ready to transfer", {}); 
    }
    
    var startTime = process.hrtime();


    this.hubClient.UserWithdraw( { 
        userId: seeduser, 
        payoutAddress:dstAddress,
        amount:amount,
        tag: "FAUCETWITHDRAWL",
        validateChecksum: false
    }, function(err, result){
        if (err) {
            console.error(err);
            return cb(err, {});
        }
        var endTime = process.hrtime(startTime);
        eta = endTime[0];
        cb(err, { data: "Your allocation request has been successfully processed with "+result.uuid +". Please check your balance in a while." });            
    });
}


module.exports = Faucet;
