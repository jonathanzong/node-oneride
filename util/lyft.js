// lyft.js

var unirest = require('unirest');

module.exports = {
  login : function(facebook_token, callback) {
    var json = {
      "fbToken" : facebook_token
    };

    unirest.post("https://api.lyft.com/users")
    .headers({
        "Authorization" : "fbAccessToken " + facebook_token
      })
    .type('json')
    .send(json)
    .end(function (response) {
      callback("lyft", response.body ? 
        {
          "id" : response.body["user"]["id"],
          "name" : response.body["user"]["firstName"]+" "+response.body["user"]["lastName"],
          "lyftToken" : response.body["user"]["lyftToken"]
        }
        : {})
    });
  },

  pickup: function(lyft_token, location, callback) {
    var json = {
        "startLat" : location["lat"],
        "startLng" : location["lon"]
    };

    unirest.post("https://api.lyft.com/rides")
    .headers({
        "Authorization" : "lyftToken " + lyft_token
      })
    .type('json')
    .send(json)
    .end(function (response) {
      try {
        callback("lyft", response.body)
      } catch(err) {
        callback("lyft", {})
        console.error(err)
      } 
    });
  },

  cancel: function(lyft_token, ride_id, location, callback) {
    var json = {
        "status" : "canceled",
        "lat" : location["lat"],
        "lng" : location["lon"]
    };

    unirest.put("https://api.lyft.com/rides/"+ride_id)
    .headers({
        "Authorization" : "lyftToken " + lyft_token
      })
    .type('json')
    .send(json)
    .end(function (response) {
      try {
        console.log(response.body)
        callback("lyft", response.body)
      } catch(err) {
        callback("lyft", {})
        console.error(err)
      }      
    });
  },

  ping: function(userid, lyft_token, location, callback) {
    var json = {
      "rideType" : "standard",
      "marker" : {
        "lat" : location["lat"],
        "lng" : location["lon"]
      },
      // "appInfoRevision" : "9cf7885088b367969624d8eb06717e3d"
      "locations": [{
        "recordedAt": (new Date()).toISOString(),
        "userMode": "passenger",
        "fg": true,
        "speed": 0,
        "lat": location["lat"],
        "lng": location["lon"],
        "bearing": -1,
        "accuracy": 5
      }]
    };

    unirest.put("https://api.lyft.com/users/"+userid+"/location")
    .headers({
        "Authorization" : "lyftToken " + lyft_token,
        "User-Agent" : "lyft:iOS:7.1.2:2.2.4.189",
        "User-Device" : "iPhone6,1",
        "Accept" : "application/vnd.lyft.app+json;version=14"
      })
    .type('json')
    .send(json)
    .end(function (response) {
      try {
        if (response.body["ride"]) {
          // useful for canceling manually
          console.log(response.body)
          var ride = response.body["ride"]
          delete ride["pricingModel"]
          delete ride["region"]
          delete ride["revision"]
          delete ride["rideType"]
          callback("lyft", ride)
        }
        else {
          var rideTypes = response.body["rideTypes"]
          var drivers;
          var pricing;
          for (var x=0;x<rideTypes.length;x++) {
            if (rideTypes[x]["id"] == "standard") {
              drivers = rideTypes[x]["drivers"]
              pricing = rideTypes[x]["pricing"]
            }
          }
          for (var x=0;x<drivers.length;x++) {
            drivers[x]["lat"] = drivers[x]["location"]["lat"].toString()
            drivers[x]["lng"] = drivers[x]["location"]["lng"].toString()
            delete drivers[x]["location"]
            drivers[x]["which"] = "lyft"
            drivers[x]["pricing"] = pricing
            drivers[x]["name"] = "Lyft Driver"
          }
          callback("lyft", drivers)
        }
      } catch(err) {
        callback("lyft", {})
        console.error(err)
      }
    });
  }
};