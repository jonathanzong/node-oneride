// summon.js

var unirest = require('unirest');

var SUMMON_BASE_URL = "https://www.instantcab.com"

module.exports = {
  login : function(facebook_token, callback) {
    
  },

  pickup: function(email, password, location, callback) {
    if (!(email && password && location)) {
      callback("summon", {'err' : 'Missing parameters'});
      return;
    }
    unirest.post(SUMMON_BASE_URL+"/request/add")
    .headers({
        "Host" : "www.instantcab.com",
        "Accept-Encoding" : "gzip",
        "Connection" : "Keep-Alive"
      })
    .send("from_lat="+location["lat"])
    .send("from_lng="+location["lng"])
    .send("username="+encodeURIComponent(email))
    .send("password="+encodeURIComponent(password))
    .send("driver_type=3")
    .end(function (response) {
      try {
        callback("summon", response.body)
      } catch(err) {
        callback("summon", {'err' : err});  
        console.error(err);
      }
    });
  },

  cancel: function(email, password, ride_id, callback) {
    if (!(email && password && ride_id)) {
      callback("summon", {'err' : 'Missing parameters'});
      return;
    }
    unirest.post(SUMMON_BASE_URL+"/request/user_cancel")
    .headers({
        "Host" : "www.instantcab.com",
        "Accept-Encoding" : "gzip",
        "Connection" : "Keep-Alive"
      })
    .send("username="+encodeURIComponent(email))
    .send("password="+encodeURIComponent(password))
    .send("id="+ride_id)
    .end(function (response) {
      try {
        callback("summon", response.body);
      } catch(err) {
        callback("summon", {'err' : err});
        console.error(err);
      }
    });
  },

  ping: function(location, email, password, ride_id, callback) {
    if (!location) {
      callback("summon", {'err' : 'Missing parameters'});
      return;
    }
    if (email && password && ride_id) {
      unirest.get(SUMMON_BASE_URL+"/api/v1/trips/"+ride_id)
      .headers({
          "Host" : "www.instantcab.com",
          "Accept-Encoding" : "gzip",
          "Connection" : "Keep-Alive"
        })
      .auth({
        user: email,
        pass: password,
        sendImmediately: true
      })
      .end(function (response) {
        try {
          callback("summon", {
            "accepted" : response.body["accepted_at"] ? true : false
          })
        } catch(err) {
          callback("summon", {'err' : err});  
          console.error(err);
        }
      });
    }
    else {
      unirest.post(SUMMON_BASE_URL+"/maps/service_pro_positions/")
      .headers({
          "Host" : "www.instantcab.com",
          "Accept-Encoding" : "gzip",
          "Connection" : "Keep-Alive"
        })
      .send("lat="+location["lat"])
      .send("lng="+location["lng"])
      .send("with_eta=1")
      .send("with_traffic=1")
      .send("driver_type=3")
      .send("accuracy=0.0")
      .send("app_opened=1")
      .end(function (response) {
        try {
          var rides = response.body["service_pro_details"]
          for (var x=0;x<rides.length;x++) {
            rides[x]["which"] = "summon"
            rides[x]["eta"] = rides[x]["eta"].toString()
            rides[x]["id"] = rides[x]["id"].toString()
            rides[x]["name"] = rides[x]["providerName"]
            delete rides[x]["time_taken"]
            delete rides[x]["driver_type"]
            delete rides[x]["include_eta"]
            delete rides[x]["distance"]
            delete rides[x]["providerName"]
          }
          callback("summon", rides)
        } catch(err) {
          callback("summon", {'err' : err}); 
          console.error(err);
        }
      });
    }    
  }
};