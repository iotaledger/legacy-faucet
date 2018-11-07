module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    // First application
    {
      name      : 'IOTA Faucet',
      script    : 'index.js',
      instances : 1,
      exec_mode  : "cluster",
      env: {
        HOST: '0.0.0.0',
        PORT: 8080,
        //Put your megaseed here
        SEED: "",
        CLIENT_POW: 1,
        PROVIDER: 'https://nodes.devnet.iota.org:443',
        EXPLORER: 'https://devnet.thetangle.org/',
        //recaptcha
        SITE_KEY: '',
        SECRET_KEY: '',
        HUB_ADDRESS:  "0.0.0.0:50051", //Address of RPCHub
        HUB_SEED_USER: "", // Any random key representing seed user in the hub
        DEPTH: '9',
        MWM: '14',
        TOKEN_AMOUNT: 1000,
      },
      env_production : {
        NODE_ENV: 'production'
      }
    },

  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    },
    dev : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/development',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env dev',
      env  : {
        NODE_ENV: 'dev'
      }
    }
  }
};
