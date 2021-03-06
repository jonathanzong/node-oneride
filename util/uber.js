// uber.js

var unirest = require('unirest');
var crypto = require('crypto');

module.exports = {
  login : function (email, password, location, callback) {
    if (!(email && password && location)) {
      callback('uber', {'err' : 'Missing parameters'});
      return;
    }
    var json = {
      'password' : hashPassword(password),
      'email' : email
    };
    sendMessage('Login', location, json, function (response) {
      try {
        if (response.status === 403) {
          callback('uber', {'err' : 'Uber returned 403'});
        } else {
          console.log(response.status);
          var token = response.body.token;
          callback('uber', {'token' : token});
        }
      } catch (err) {
        callback('uber', {'err' : err});
        console.error(err);
      }
    });
  },

  pickup: function (token, ride_id, location, callback) {
    if (!(token && ride_id && location)) {
      callback('uber', {'err' : 'Missing parameters'});
      return;
    }
    var json = {
      'token' : token,
      'pickupLocation': {
        'latitude' : location.lat, // perhaps could be another param
        'longitude' : location.lng
      },
      'useCredits' : true,
      'vehicleViewId' : parseInt(ride_id, 10),
    };
    sendMessage('Pickup', location, json, function (response) {
      try {
        callback('uber', response.body.trip);
      } catch (err) {
        callback('uber', {'err' : err});
        console.error(err);
      }
    });
  },

  cancel: function (token, location, callback) {
    if (!token) {
      callback('uber', {'err' : 'Missing parameters'});
      return;
    }
    var json = {
      'token' : token
    };
    sendMessage('PickupCanceledClient', location, json, function (response) {
      try {
        callback('uber', response.body);
      } catch (err) {
        callback('uber', {'err' : err});
        console.error(err);
      }
    });
  },

  ping: function (token, location, callback) {
    if (!(token && location)) {
      callback('uber', {'err' : 'Missing parameters'});
      return;
    }
    var json = {
      'token' : token
    };
    sendMessage('PingClient', location, json, function (response) {
      try {
        if (response.body.trip) {
          callback('uber', response.body.trip);
        } else {
          var nearbyVehicles = response.body.nearbyVehicles;
          var vehicleViews = response.body.city.vehicleViews;
          var drivers = [];
          for (var vehicle in nearbyVehicles) {
            var paths = nearbyVehicles[vehicle].vehiclePaths;
            var pathEntryArray = paths[Object.keys(paths).pop()];
            var lastPathEntry = pathEntryArray[pathEntryArray.length-1];

            var pricing = vehicleViews[vehicle].fare;
            delete pricing.id;
            if (vehicleViews[vehicle].surge) {
              pricing = vehicleViews[vehicle].surge;
              delete pricing.fareId;
              delete pricing.webView;
            }

            var ride = {
              'id' : vehicle, // this is non-unique -- uber ride ids are functionally an enum of types
              'eta' : nearbyVehicles[vehicle].minEta.toString(),
              'lat' : lastPathEntry.latitude.toString(),
              'lng' : lastPathEntry.longitude.toString(),
              'name' : vehicleViews[vehicle].displayName,
              'pricing' : pricing,
              'which' : 'uber'
            }
            drivers.push(ride);
          }
        }
        callback('uber', drivers);
      } catch (err) {
        callback('uber', {'err' : err});
        console.error(err);
      }
    });
  }
};

function hashPassword(password) {
  var pw = password.toString('utf8')
  var buffer = '';
  for (var i = 0, len = pw.length; i < len; i++) {
    buffer += crypto.createHash('md5').update(pw[i]).digest('hex');
  }
  return crypto.createHash('md5').update(buffer.toLowerCase()).digest('hex').toLowerCase();
}

function sendMessage(messageType, location, params, callback) {
  var json = {
    'messageType' : messageType,
    'epoch' : (new Date()).getTime(),
    'version' : '2.8.17',
    'language' : 'en',
    'app' : 'client',
    'latitude' : location.lat,
    'longitude' : location.lng,
    'deviceModel': 'iPhone6,1',
    'deviceOS': '7.0.3',
    'device': 'iphone'
  };

  if (params) {
    for (var key in params) {
      json[key] = params[key];
    }
  }

  var num = Math.floor(Math.random() * 10 + 1);

  unirest.post('https://cn' + num + '.uber.com')
    .headers({
      'Host' : 'cn' + num + '.uber.com',
      'Accept-Language': 'en-US',
      'User-Agent': 'client/iphone/2.8.17'
    })
    .type('json')
    .send(json)
    .end(function (response) {
      callback(response);
    });
}
