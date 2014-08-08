// sidecar.js

var unirest = require('unirest');

var SIDECAR_BASE_URL = "https://app.side.cr"

module.exports = {
  login : function(facebook_token, callback) {
    
  },

  pickup: function(lyft_token, location, callback) {
    
  },

  cancel: function(lyft_token, ride_id, location, callback) {
 
  },

  ping: function(userid, password, location, destination, callback) {
    unirest.post(SIDECAR_BASE_URL+"/query/getBestMatch")
    .headers({
        "Host" : "app.side.cr",
        "Proxy-Connection" : "close",
        "Accept-Encoding" : "gzip",
        "Connection" : "close"
      })
    .send("username="+parseInt(userid))
    .send("password="+password)
    .send("pLat="+location["lat"])
    .send("pLng="+location["lon"])
    .send("dLat="+destination["lat"])
    .send("dLng="+destination["lon"])
    .end(function (response) {
      try {
        response.body = JSON.parse(response.body)
        var drivers = response.body["drivers"]
        var rides = []
        for (var x=0;x<drivers.length;x++) {
          var obj = {
            "id" : drivers[x]["DriverID"],
            "name" : drivers[x]["CarColor"]+" "+
                    drivers[x]["CarMake"] +" "+ drivers[x]["CarModel"],
            "lat" : drivers[x]["Latitude"],
            "lng" : drivers[x]["Longitude"],
            "price" : drivers[x]["Price"],
            "eta" : drivers[x]["PickupETA"],
            "which" : "sidecar"
          }
          rides.push(obj)
        }
        callback("sidecar", response.body ? rides : {})
      } catch(err) {
        callback("sidecar", {})
        console.error(err)
      }
    });
  }
};