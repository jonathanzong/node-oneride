// web.js
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var uber = require('./util/uber.js');
var lyft = require('./util/lyft.js');
var sidecar = require('./util/sidecar.js');
var summon = require('./util/summon.js');

var cachedPush = Array.prototype.push;

app.use(bodyParser.json());

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

app.get('/', function (req, res) {
  res.render('index.html');
});

// facebook_token, uber_email, uber_password, lat, lng
app.post('/login', function (req, res) {
  var result = {};
  var returned = {};

  function callback(which, data) {
    result[which] = data;
    returned[which] = true;

    if (returned.lyft && returned.uber) {
      res.send(result);
    }
  }

  var location = {
    lat : parseFloat(req.body.lat),
    lng : parseFloat(req.body.lng)
  };

  lyft.login(req.body.facebook_token, callback);
  uber.login(req.body.uber_email, req.body.uber_password, location, callback);
});

// lat, lng, lyft_token
// lat, lng, summon_email, summon_password
// lat, lng, uber_token, uber_ride_id
app.post('/pickup/:which', function (req, res) {
  var which = req.params.which;
  var location = {
    lat : parseFloat(req.body.lat),
    lng : parseFloat(req.body.lng)
  };
  switch (which) {
    case 'lyft':
      lyft.pickup(req.body.lyft_token, location, function (which, data) {
        res.send(data);
      });
      break;
    case 'summon':
      summon.pickup(req.body.summon_email, req.body.summon_password, location, function (which, data) {
        res.send(data);
      });
      break;
    case 'uber':
      uber.pickup(req.body.uber_token, req.body.uber_ride_id, location, function (which, data) {
        res.send(data);
      });
      break;
    default:
      res.status(404);
  }
});

// lyft_token, ride_id, lat, lng
// summon_email, summon_password, ride_id
// uber_token, lat, lng
app.post('/cancel/:which', function (req, res) {
  var which = req.params.which;
  var location = {
    lat : parseFloat(req.body.lat),
    lng : parseFloat(req.body.lng)
  };
  switch (which) {
    case 'lyft':
      lyft.cancel(req.body.lyft_token, req.body.ride_id, location, function (which, data) {
        res.send(data);
      });
      break;
    case 'summon':
      summon.cancel(req.body.summon_email, req.body.summon_password, req.body.ride_id, function (which, data) {
        res.send(data);
      });
      break;
    case 'uber':
      uber.cancel(req.body.uber_token, location, function (which, data) {
        res.send(data)
;      });
      break;
    default:
      res.status(404);
  }
});

// lyft_token, lyft_id, lat, lng, sidecar_id, sidecar_password, dest_lat, dest_lng, uber_token
app.post('/ping', function (req, res) {
  var location = {
    lat : parseFloat(req.body.lat),
    lng : parseFloat(req.body.lng)
  };
  var lyft_token = req.body.lyft_token;
  var lyft_id = req.body.lyft_id;

  var sidecar_id = req.body.sidecar_id;
  var sidecar_password = req.body.sidecar_password;
  var destination = {
    lat : parseFloat(req.body.dest_lat),
    lng : parseFloat(req.body.dest_lng)
  };

  var summon_email = req.body.summon_email;
  var summon_password = req.body.summon_password;
  var summon_ride_id = req.body.summon_ride_id;

  var uber_token = req.body.uber_token;

  var result = {
    'rides' : []
  };
  var returned = {};

  function callback(which, data) {
    if (returned[which]) {
      return;
    }
    if (data instanceof Array) {
      cachedPush.apply(result.rides, data);
    } else {
      result[which] = data;
    }
    returned[which] = true;

    if (returned.lyft && returned.sidecar && returned.summon && returned.uber) {
      res.send(result);
    }
  }

  uber.ping(uber_token, location, callback);
  lyft.ping(lyft_id, lyft_token, location, callback);
  sidecar.ping(sidecar_id, sidecar_password, location, destination, callback);
  summon.ping(location, summon_email, summon_password, summon_ride_id, callback);
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function () {
  console.log('Listening on ' + port);
});
