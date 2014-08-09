// sidecar.js

var unirest = require('unirest');

var SIDECAR_BASE_URL = 'https://app.side.cr';

module.exports = {
  login : function (facebook_token, callback) {
    // TODO
  },

  pickup: function (lyft_token, location, callback) {
    // TODO
  },

  cancel: function (lyft_token, ride_id, location, callback) {
    // TODO
  },

  ping: function (user_id, password, location, destination, callback) {
    if (!(user_id && password && location && destination)) {
      callback('sidecar', {'err' : 'Missing parameters'});
      return;
    }
    unirest.post(SIDECAR_BASE_URL + '/query/getBestMatch')
      .headers({
        'Host' : 'app.side.cr',
        'Proxy-Connection' : 'close',
        'Accept-Encoding' : 'gzip',
        'Connection' : 'close'
      })
      .send('username=' + parseInt(user_id, 10))
      .send('password=' + password)
      .send('pLat=' + location.lat)
      .send('pLng=' + location.lng)
      .send('dLat=' + destination.lat)
      .send('dLng=' + destination.lng)
      .end(function (response) {
        try {
          response.body = JSON.parse(response.body);
          var drivers = response.body.drivers;
          var rides = [];
          for (var x = 0; x < drivers.length; x++) {
            var obj = {
              'id' : drivers[x].DriverID,
              'name' : drivers[x].CarColor + ' ' +
                      drivers[x].CarMake + ' ' + drivers[x].CarModel,
              'lat' : drivers[x].Latitude,
              'lng' : drivers[x].Longitude,
              'price' : drivers[x].Price,
              'eta' : drivers[x].PickupETA,
              'which' : 'sidecar'
            };
            rides.push(obj);
          }
          callback('sidecar', rides);
        } catch (err) {
          callback('sidecar', {'err' : err});
          console.error(err);
        }
      });
  }
};
