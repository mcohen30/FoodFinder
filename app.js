'use strict';

// ======================================
//   DEPENDENCIES
// ======================================
const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const router = express.Router();
var mongourl = "mongodb://localhost:27017/";

// from https://www.yelp.com/developers/v3/manage_app
// https://github.com/mstill3/yelp-fusion-api
const YELP_API_KEY = "4dIx9HKv-klKh_nvUWaHAZqe_a-wQqi49uoJICQIfxdWFj0VS-8uw1TfrFoe2CVsKJeX7BRv0nntSA4svU-G_qiSkfHxYIfk_D83YWoAjRMfuz21UMnzT5_PPA53XHYx";
const yelp_fusion = require('yelp-fusion');
const yelper = yelp_fusion.client(YELP_API_KEY);


// ======================================
//   ROUTING
// ======================================
router.get('/',function(request, response)
{
  response.sendFile(path.join(__dirname + '/html/index.html'));
});
router.get('/about',function(request, response)
{
    response.sendFile(path.join(__dirname + '/html/about.html'));
});
router.get('/create',function(request, response)
{
    response.sendFile(path.join(__dirname + '/html/create.html'));
});
router.get('/login',function(request, response)
{
    response.sendFile(path.join(__dirname + '/html/login.html'));
});
router.get('/news',function(request, response)
{
    response.sendFile(path.join(__dirname + '/html/news.html'));
});
router.get('/contact',function(request, response)
{
    response.sendFile(path.join(__dirname + '/html/contact.html'));
});
// router.get('/*', function(request, response) // else
// {
//     response.sendFile(path.join(__dirname + '/html/404.html'));
// });


//make all resources avaliable on same level
app.use(express.static(__dirname + '/html/'));
app.use(express.static(__dirname + '/js/angularjs/'));
app.use(express.static(__dirname + '/js/angularjs/controllers/'));
app.use(express.static(__dirname + '/js/backstretch/'));
app.use(express.static(__dirname + '/js/cors/'));
app.use(express.static(__dirname + '/js/mine/'));
app.use(express.static(__dirname + '/images/'));
app.use(express.static(__dirname + '/css/'));

app.use('/', router);


// ======================================
//   USER ACCOUNTS URL REQUESTS
// ======================================

app.get('/loginaccount', function (request, resp)
{
    var email = request.query.email;
    var password = request.query.password;

    var username = "";
    var locs = [];

    // cut off quotes
    email = email.substring(1, email.length - 1);
    password = password.substring(1, password.length - 1);

    // pull account where email = account.email
    pullaccount(email, function (account)
    {

        if(account)
        {
            // and password == account.password
            cryptPassword(password, function(error, hash)
            {
                comparePassword(password, account.password, function(error, isPasswordMatch)
                {
                    if(isPasswordMatch)
                        resp.send({valid: true, email: account.email, username: account.username, favorites: account.favorites});
                    else
                        resp.send({valid: false, email: null, username: null, favorites: null});
                });
            });
        }
        else
        {
            resp.send({valid: false, email: null, username: null, favorites: null});
        }

    });

});

app.get('/createaccount', function (request, resp)
{
    var email = request.query.email;
    var username = request.query.username;
    var password = request.query.password;

    // cut off quotes
    email = email.substring(1, email.length - 1);
    username = username.substring(1, username.length - 1);
    password = password.substring(1, password.length - 1);

    // encryption
    cryptPassword(password, function(error, hash)
    {
        pushaccount({email: email, username: username, password: hash, favorites: []});
        resp.send(true);  // catch if bad!!!
    });

});


// ======================================
//   MAIN URL REQUESTS
// ======================================

// sends off yelp data on params passed in
app.get('/yelp', function (request, resp)
{

  var args = {
    term: request.query.term,
    location: request.query.location
    // latitude: 39.3938317, 
    // longitude: -76.6074833,

    // radius: 20000,
    // categories: 'bars',
    // locale: 'en_US',
    // limit: 1,
    // offset: 0,
    // sort_by: "rating",
    // price: "1,2,3",
    // open_now: false,
    // open_at: 0,
    // attributes: "hot"
  }

  yelp(args, function callback(bizs)
  {
      var biz = bizs[0];
    //   console.log(biz);
      resp.send(biz);
  });
});

// sends off yelp data on params passed in
app.get('/places', function (request, resp)
{

    var args = {
        term: 'food',
        // location: loc,
        latitude: request.query.lat, 
        longitude: request.query.long,
    
        radius: request.query.range
        // categories: 'bars',
        // locale: 'en_US',
        // limit: 1,
        // offset: 0,
        // sort_by: "rating",
        // price: "1,2,3",
        // open_now: false,
        // open_at: 0,
        // attributes: "hot"
    }

  yelp(args, function callback(bizs)
  {
        resp.send(bizs);
  });
});


// GET method route pushes to mongo
app.get('/favorite', function (request, resp)
{
  var email = request.query.email;
  var term = request.query.term;
  var location = request.query.location;

  var args = {
    term: term,
    location: location,
    // latitude: request.query.lat, 
    // longitude: request.query.long,
    // radius: request.query.range
    // categories: 'bars',
    // locale: 'en_US',
    // limit: 1,
    // offset: 0,
    // sort_by: "rating",
    // price: "1,2,3",
    // open_now: false,
    // open_at: 0,
    // attributes: "hot"
}

  yelp(args, function callback(bizs)
  {
      pullfavorites(email, function callback2(favorites)
      {
        //   console.log("F: " + JSON.stringify(favorites));
          // make sure not in there
          var alreadySaved = false;
          var yelpData = bizs[0];
        //   console.log("FAVS: " + favorites);
          for (var i = 0; i < favorites.length; i++)
          {
              var fav = favorites[i];
            //   console.log("One:"  + JSON.stringify(fav.name) + "   Two: " + JSON.stringify(yelpData.name));
              if(fav.name == yelpData.name &&
                 fav.city == yelpData.location.city &&
                 fav.state == yelpData.location.state)
              {
                  console.log("already saved");
                  alreadySaved = true;
              }
          }
          if(!alreadySaved) // favorite
          {
              addfavorite(email, {"name": yelpData.name, "city": yelpData.location.city, "state": yelpData.location.state, "lat": yelpData.coordinates.latitude, "long": yelpData.coordinates.longitude});
          }
          else // unfavorite
          {
              removefavorite(email, {"name": yelpData.name, "city": yelpData.location.city, "state": yelpData.location.state, "lat": yelpData.coordinates.latitude, "long": yelpData.coordinates.longitude});
          }
          resp.send([alreadySaved, yelpData]);
      });
  });
});


// db.data.insert({email: "stillwell006@gmail.com", username: "matt", password: "goose", favorites: [{name: "Ginos", city: "Towson", state: "MD", lat: 20, long: 30}, {name: "Nandos", city: "Towson", state: "MD", lat: 40, long: 30}] })
// ***********************************
//  foodfinder
//  data
//  {
//    * email:      STRING
//      username:   STRING
//      password:   STRING
//
//      favorites:  ARRAY
//      [
//         * name:   STRING
//         * city:   STRING
//         * state   STRING
//         * lat:    FLOAT
//         * long:   FLOAT
//      ]
//  }
// ***********************************

// ======================================
//   MONGO USER ACCOUNTS
// ======================================
function pushaccount(json)
{
    var database = "foodfinder";
    var collection = "data";
    MongoClient.connect(mongourl, { useNewUrlParser: true }, function(err, db)
    {
        if (err)
            throw err;
        var dbo = db.db(database);
        dbo.collection(collection).insertOne(json, function(err, res)
        {
            if (err)
                throw err;
            console.log("mongo account pushed");
            db.close();
        });
    });
}

function pullaccount(email, callback)
{
    var database = "foodfinder";
    var collection = "data";
    MongoClient.connect(mongourl, { useNewUrlParser: true }, function(err, db)
    {
        if (err)
            throw err;
        var dbo = db.db(database);
        var query = { email: email };
        dbo.collection(collection).find(query).toArray(function(err, resp)
        {
            if (err)
                throw err;
            const account = resp[0];
            console.log("mongo account pulled");
            db.close();
            callback(account);
        });
    });
}


// ===========================
//  JS Fav Array Manipulation
// ===========================
function removeit(json, arr)
{
    var success = false;
    for(var i = 0; i < arr.length; i++)
    {
        var ele = arr[i];
        if (ele.name === json.name && ele.city === json.city && 
            ele.state === json.state && ele.lat === json.lat && 
            ele.long === json.long)
        {
            arr.splice(i, 1);
            success = true;
        }
    }
    return success;
}

function addit(json, arr)
{
    var exi = exists(json, arr);
    var success = false;
    if(!exi)
    {
        arr.push(json);
        success = true;
    }
    return success;
}

function exists(json, arr)
{
    var exists = false;
    for(var i = 0; i < arr.length; i++)
    {
        var ele = arr[i];
        if (ele.name === json.name && ele.city === json.city && 
            ele.state === json.state && ele.lat === json.lat && 
            ele.long === json.long)
        {
            exists = true;
        }
    }
    return exists;
}

// ======================================
//   MONGO FAVORITES
// ======================================
function pullfavorites(email, callback)
{
    pullaccount(email, function(account)
    {
        callback(account.favorites);
    });
}

function addfavorite(email, json, cb)
{
    pullfavorites(email, function(favorites)
    {
        // var favs = account.favorites;
        addit(json, favorites);
        editfavorites(email, favorites);
        console.log("1 item inserted");
    });
}

// TODO
function removefavorite(email, json)
{
    pullfavorites(email, function(favorites)
    {
        // var favs = account.favorites;
        removeit(json, favorites);
        editfavorites(email, favorites);
        console.log("1 item removed");
    });
}

function editfavorites(email, json)
{
    var database = "foodfinder";
    var collection = "data";

    MongoClient.connect(mongourl, { useNewUrlParser: true }, function(err, db) {
        if (err)
            throw err;
        var dbo = db.db(database);
        var query = { email: email };
        var newvals = { $set: { favorites: json } };
        dbo.collection(collection).updateOne(query, newvals, function(err, obj)
        {
            if (err)
                throw err;
            // console.log("1 document updated");
            db.close();
        });
    });
}


// ======================================
//   YELP API
// ======================================
function yelp(args, callmemaybe)
{
    yelper.search(args).then(response => {
        console.log("yelp data pulled");        
        const yelpData = response.jsonBody.businesses;
        callmemaybe(yelpData);
      }).catch(e => {
        console.log(e);
      });
}


// ======================================
//   ENCRYPTION
// ======================================

var bcrypt = require('bcrypt-nodejs');

var cryptPassword = function(password, callback)
{
    bcrypt.genSalt(10, function(err, salt)
    {
        if (err)
            return callback(err);

        bcrypt.hash(password, salt, null, function(err, hash)
        {
            return callback(err, hash);
        });
    });
};

var comparePassword = function(plainPass, hashword, callback)
{
   bcrypt.compare(plainPass, hashword, function(err, isPasswordMatch)
   {
        return err == null ?
            callback(null, isPasswordMatch) :
            callback(err);
    });
};


// ======================================
//   HTTPS Certificate
// ======================================

const privateKey = fs.readFileSync('/etc/letsencrypt/live/foodfinder.xyz/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/foodfinder.xyz/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/foodfinder.xyz/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};


// ======================================
//   Starting https server
// ======================================
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(443, () => {
 	console.log('HTTPS Server running on port 443');
});


// ======================================
//   Starting http server
// ======================================
// else test locally without https
const httpServer = http.createServer(app);
httpServer.listen(80, () => {
 	console.log('HTTP Server running on port 80');
});
