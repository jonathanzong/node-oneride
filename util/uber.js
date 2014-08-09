// uber.js
var UBER_ENDPOINT = "https://cn-dc1.uber.com"

var unirest = require('unirest');
var crypto = require('crypto');

module.exports = {
  login : function(email, password, location, callback) {
    if (!(email && password && location)) {
      callback("uber", {'err' : 'Missing parameters'});
      return;
    }
    var json = {
      "password" : hashPassword(password),
      "email" : email
    };
    sendMessage('Login', location, json, function(response) {
      try {
        if (response.status === 403) {
          callback("uber", {'err' : 'Uber returned 403'});
        } else {
          var token = response.body['token'];
          callback("uber", {'token' : token});
        }
      } catch (err) {
        callback("uber", {'err' : err});
        console.error(err);
      }
    });
  },

  pickup: function() {
    
  },

  cancel: function() {

  },

  ping: function(token, location, callback) {
    if (!(token && location)) {
      callback("uber", {'err' : 'Missing parameters'});
      return;
    }
    var json = {
      'token' : token
    }
    sendMessage('PingClient', location, json, function(response) {
      try {
        if (response.status === 403) {
          callback("uber", {'err' : 'Uber returned 403'});
        } else {
          var nearbyVehicles = response.body['nearbyVehicles'];
          var drivers = [];
          var id = 0;
          for (vehicle in nearbyVehicles) {
            var paths = nearbyVehicles[vehicle]["vehiclePaths"];
            var pathEntryArray = paths[Object.keys(paths).pop()];
            var lastPathEntry = pathEntryArray[pathEntryArray.length-1];
            var ride = {
              "id" : (id++).toString(),
              "eta" : nearbyVehicles[vehicle]["minEta"].toString(),
              "lat" : lastPathEntry["latitude"].toString(),
              "lng" : lastPathEntry["longitude"].toString(),
              "name" : "Uber Driver",
              "which" : "uber"
            }
            drivers.push(ride);
          }
        }
        callback("uber", drivers);
      } catch (err) {
        callback("uber", {'err' : err});
        console.error(err);
      }
    });
  }
};

function hashPassword(password) {
  var pw = password.toString("utf8")
  var buffer = '';
  for (var i = 0, len = pw.length; i < len; i++) {
    buffer += crypto.createHash('md5').update(pw[i]).digest('hex');
  }
  return crypto.createHash('md5').update(buffer.toLowerCase()).digest('hex').toLowerCase();
}

function sendMessage(messageType, location, params, callback) {
  var json = {
      'messageType' : messageType,
      'epoch' : (new Date).getTime(),
      'version' : '2.8.17',
      'language' : 'en',
      'app' : 'client',
      'latitude' : location['lat'],
      'longitude' : location['lng'],
      'deviceModel': 'iPhone6,1',
      'deviceOS': '7.0.3',
      'device': 'iphone'
  }

  for(var key in params) {
    json[key] = params[key];
  }

  unirest.post(UBER_ENDPOINT)
    .headers({
      'Accept-Language': 'en-US',
      'User-Agent': 'client/iphone/2.8.17'
    })
    .type('json')
    .send(json)
    .end(function (response) {
      callback(response);
    });
}
