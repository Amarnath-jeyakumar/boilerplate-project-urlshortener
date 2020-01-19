'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
//mongoose.connect(process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).catch(err=>console.log(err));

let urlSchema = new mongoose.Schema({
  oldUrl: String,
  newUrl: Number
});
  
let urlModel = mongoose.model('urlModel', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/shorturl/:new", (req, res) => {
  let shortUrl = {newUrl: req.params.new};
  
  urlModel.findOne(shortUrl)
    .then((data) => res.redirect(data.oldUrl))
    .catch(() => res.json({"error":"invalid URL"}));
});

app.post("/api/shorturl/new", (req, res) => {
  let urlInput = {oldUrl: req.body.url};
  let newUrl, trimmedUrl;
  let regexWithS = /https/;
  let regex = /http/;
  
  if(regexWithS.test(urlInput.oldUrl)) {
    trimmedUrl = urlInput.oldUrl.substring(8);
  } else if(regex.test(urlInput.oldUrl)) {
    trimmedUrl = urlInput.oldUrl.substring(7);
  }
  
  dns.lookup(trimmedUrl, (err, address) => {
    if(err) {
      res.json({error: 'invalid URL'});
    } else {
      urlModel.findOne(urlInput)
        .then((data) => {
          res.json({original_url:data.oldUrl, short_url: data.newUrl});
        })
        .catch(() => {
          newUrl = Math.floor((Math.random() * 1000) + 1);
        
          var finalObject = new urlModel({
            oldUrl: urlInput.oldUrl,
            newUrl: newUrl
          });
        
          finalObject.save()
            .then(data => {
              res.json({original_url:data.oldUrl, short_url: data.newUrl});
            })
            .catch(err=>console.log(err));
        });
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
