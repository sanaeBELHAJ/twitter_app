var express = require('express')
app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  ent = require('ent'); // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)

app.use("/searching", express.static(__dirname + '/searching'));

//TWITTER
var Twit = require('twit'),
  config = require('./config'),
  T = new Twit(config);


T.get('account/verify_credentials', {
    skip_status: true
  }) //Vérification des identifiants de l'API
  .catch(function (err) {
    console.log('------------- Caught error -------------', err.stack)
  })
  .then(function (result) {
    // `result` is an Object with keys "data" and "resp".
    // `data` and `resp` are the same objects as the ones passed to the callback.
    // See https://github.com/ttezel/twit#tgetpath-params-callback for details.
    //console.log('data', result.data);
  });


//BDD
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/twitter');
var conn = mongoose.connection;

/* ******************** */

// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/searching/index.html');
});

io.sockets.on('connection', function (socket) {

  //Recherche
  socket.on('search', async function (datas) {
    var params = {};

    params.q = datas.keyword;

    if (datas.date_pub != "")
      params.q += " since:" + datas.date_pub;

    if (datas.quantity != "")
      params.count = datas.quantity;

    if (datas.type != "")
      params.result_type = datas.type;

    console.log(params);

    // get is the function to search the tweet which three parameters 'search/tweets',params and a callback function.
    //T.get('search/tweets', params, searchedData);

    socket.emit('search', {});
  });
});


// searchedData function is a callback function which returns the data when we make a search
function searchedData(err, data, response) {
  //Insertion des tweets en BDD
  data.statuses.forEach(function (element) {
    element._id = element.id;
    //element.keyword = ;
    //conn.collection('tweet').insert(element);
    console.log(element);
  });
}

server.listen(8080);