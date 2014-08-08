// web.js
var express = require("express");
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

app.get('/', function(req, res) {
  res.render('index.html');
});

// facebook_token, uber_email, uber_password
app.post('/login', function(req, res) {
  var result = {};
  var returned = {}

  function callback(which, data) {
    result[which] = data;
    returned[which] = true;

    if(returned["lyft"] && returned["uber"]) {
      res.send(result)
    }
  }

  var location = {
    lat : parseFloat(req.body.lat),
    lon : parseFloat(req.body.lon)
  }

  lyft.login(req.body.facebook_token, callback);
  uber.login(req.body.uber_email, req.body.uber_password, location, callback);
});

// lat, lon, lyft_token
// lat, lon, summon_email, summon_password
app.post('/pickup/:which', function(req, res) {
  var which = req.params.which;
  var location = {
    lat : parseFloat(req.body.lat),
    lon : parseFloat(req.body.lon)
  }
  if (which == "lyft") {
    lyft.pickup(req.body.lyft_token, location, function(which, data) {
      res.send(data);
    });
  }
  else if (which == "summon") {
    summon.pickup(req.body.summon_email, req.body.summon_password, location, function(which, data) {
      res.send(data);
    });
  }
});

// lyft_token, ride_id, lat, lon
// summon_email, summon_password, ride_id
app.post('/cancel/:which', function(req, res) {
  var which = req.params.which;
  var location = {
    lat : parseFloat(req.body.lat),
    lon : parseFloat(req.body.lon)
  }
  if (which == "lyft") {
    lyft.cancel(req.body.lyft_token, req.body.ride_id, location, function(which, data) {
      res.send(data);
    });
  }
  else if (which == "summon") {
    summon.cancel(req.body.summon_email, req.body.summon_password, req.body.ride_id, function(which, data) {
      res.send(data);
    });
  }
});

// lyft_token, lyft_id, lat, lon, sidecar_id, sidecar_password, dest_lat, dest_lon
app.post('/ping', function(req, res) {
  var lyft_token = req.body.lyft_token;
  var lyft_id = req.body.lyft_id;
  var sidecar_id = req.body.sidecar_id;
  var sidecar_password = req.body.sidecar_password;
  var location = {
    lat : parseFloat(req.body.lat),
    lon : parseFloat(req.body.lon)
  }
  var destination = {
    lat : parseFloat(req.body.dest_lat),
    lon : parseFloat(req.body.dest_lon)
  }

  var summon_email = req.body.summon_email;
  var summon_password = req.body.summon_password;
  var summon_ride_id = req.body.summon_ride_id;

  var result = {
    "rides" : []
  }
  var returned = {}

  function callback(which, data) {
    if (data instanceof Array) {
      cachedPush.apply(result["rides"], data);
    }
    else {
      result[which] = data;
    }
    returned[which] = true;

    if(returned["lyft"] && returned["sidecar"] && returned["summon"]) {
      res.send(result)
    }
  }

  // uber.ping(uber_token, location, callback);
  lyft.ping(lyft_id, lyft_token, location, callback);
  sidecar.ping(sidecar_id, sidecar_password, location, destination, callback);
  summon.ping(location, summon_email, summon_password, summon_ride_id, callback);
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

