//HTML
var app = require('express')(),
    server = require('http').createServer(app),
    ent = require('ent'); // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)

//TWITTER
var Twit = require('twit'); // this is how we import the twit package
var config = require('./config') //this is we import the config file which is a js file which contains the keys ans tokens
var T = new Twit(config); //this is the object of twit which will help us to call functions inside it


T.get('account/verify_credentials', { skip_status: true }) //Vérification des identifiants de l'API
  .catch(function (err) {
    console.log('caught error', err.stack)
  })
  .then(function (result) {
    // `result` is an Object with keys "data" and "resp".
    // `data` and `resp` are the same objects as the ones passed to the callback.
    // See https://github.com/ttezel/twit#tgetpath-params-callback
    // for details.
 
    //console.log('data', result.data);
});


//BDD
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/twitter');
const Cat = mongoose.model('Cat', { name: String });
//const kitty = new Cat({ name: 'Zildjian' });
//kitty.save().then(() => console.log('meow'));



/* ******************** */



// Chargement de la page index.html
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/searching/index.html');
});




var params = { // this is the param variable which will have key and value, the key is the keyword which we are interested in searching and count is the count of it
    q: 'voiture',
    count: 2,
    //lang: eu,
    //result_type: mixed/recent/popular //Filtre des tweets récents et/ou populaires
    //until: 2015-07-18,
} 

// get is the function to search the tweet which three parameters 'search/tweets',params and a callback function.
T.get('search/tweets', params,searchedData); 

// searchedData function is a callback function which returns the data when we make a search
function searchedData(err, data, response) {
    console.log(data);
}




server.listen(8080);