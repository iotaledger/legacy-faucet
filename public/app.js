var app = new Vue({
      el: '#app',
      data: {
        caption: 'Please provide a valid IOTA address.',
        waiting: false,
        address: "",
        addressValid: false,
        feedback: "",
        finished: false,
        result : "",
        server: "",
        explorer:"",
        clientPoW: false,
        error : false,
        ETA: 0,
        remaining : "",
        depth: 9, 
        MWM:14,
        siteKey: '',
        ready: false
      },
      methods:{
          getTrytes: function(){
               var self = this;
               self.error = false;
               
               
               var response = grecaptcha.getResponse();
               if (response == ""){
                 this.feedback = "Please check Captcha!"
                 this.error = true;
                 return;
               }
               grecaptcha.reset();
               
               var timer = setInterval(function(){
                  self.remaining = " ETA "+self.ETA-- + " seconds";
                  if (self.ETA <= 0){
                    clearInterval(timer);
                    self.ETA = 0;
                    self.remaining = "";
                  }
               }, 1000);
               
               this.feedback = "Requesting server for fund allocation."
               if (this.clientPoW) this.feedback += " Client will do PoW. ";
               
               
               Pace.restart();
              // workaround - trim length to 81 because RPCHub doesnt accept checksum.
              var addr = this.address.substring(0, 81);
                $.ajax({url: "faucet?address="+addr+"&recaptcha="+response, success: function(result){
                  clearInterval(timer);
                  self.remaining = "";
                  if (result.type == "powRequired"){
                    self.$nextTick(function () {
                      self.doPoW(result.data);
                    });
                  }
                  else{
                    self.result = JSON.stringify(result.data, null,2);
                    self.waiting= false;
                    self.feedback = "Allocation request successfully processed. Following is the server response."
                    self.finished = true;
                    self.error = false;

                  }
                  },
                  timeout: Math.max(120000, (self.ETA+10)*1000),
                  error: function(object){
                    clearInterval(timer);
                    self.remaining = "";
                    self.feedback = "Operation failed."
                    if (object.responseJSON && object.responseJSON.error){
                      self.feedback += object.responseJSON.error.toString();
                    }
                    else{
                      self.feedback += object.statusText;
                    }
                    self.waiting= false;
                    self.finished = false;
                    self.error = true;
                  }
                });
                  
                this.waiting = true;                
          }
      },
      watch: {
        address: function (val) {
          this.address = this.address.toUpperCase();
          if (this.address.length >=81 && this.iota && this.iota.valid.isAddress(this.address) ) {
              // matches
              this.caption = "Address is valid."
              this.addressValid = true;

          } else {
              // doesn't match
              this.caption = 'Please provide a valid IOTA address.';
              this.addressValid =  false;
          }

        },

      },
      mounted: function () {
        var self = this;
          $.ajax({url: "info", success: function(info){
            Object.keys(info).forEach(item => self[item] = info[item]);
            self.iota = new IOTA({'provider': self.server});
              self.ready = true;  
          }});
                

      }      
  
});

