var express = require("express");
(app = express()),
  (server = require("http").createServer(app)),
  (io = require("socket.io").listen(server)),
  (ent = require("ent")); // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)

app.use("/searching", express.static(__dirname + "/searching"));

//TWITTER
var Twit = require("twit"),
  config = require("./config"),
  T = new Twit(config);

T.get("account/verify_credentials", {
  skip_status: true
}) //Vérification des identifiants de l'API
  .catch(function(err) {
    console.log("------------- Caught error -------------", err.stack);
  })
  .then(function(result) {
    // `result` is an Object with keys "data" and "resp".
    // `data` and `resp` are the same objects as the ones passed to the callback.
    // See https://github.com/ttezel/twit#tgetpath-params-callback for details.
    //console.log('data', result.data);
  });

//BDD
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const dbName = "twitter";

/* ******************** */

// Chargement de la page index.html
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/searching/index.html");
});

io.sockets.on("connection", function(socket) {
  //Recherche
  socket.on("search", async function(datas) {
    var params = {};
    params.q = datas.keyword;
    if (datas.date_pub != "") params.q += " since:" + datas.date_pub;
    if (datas.quantity != "") params.count = datas.quantity;
    if (datas.type != "") params.result_type = datas.type;
    //console.log(params);

    try {
      // Récupération des tweets de l'API
      await T.get("search/tweets", params, async function(err, data, response) {
        //ID de clé primaire = ID du tweet
        data.statuses.forEach(function(element) {
          element._id = element.id;
        });

        //Connexion à la BDD
        await MongoClient.connect(url, function(err, client) {
          const db = client.db(dbName);
          const collection = db.collection("tweet");
          //Insertion des tweets en BDD
          collection.insertMany(data.statuses);

          //Affichage des tweets de la BDD
          collection
            .find({
              text: new RegExp(datas.keyword)
            })
            .project({
              _id: 0,
              lang: 1,
              retweet_count: 1
            })
            .toArray(function(err, result) {
              if (err) throw err;
              result.forEach(function(data) {
                data.name = data.lang;
                delete data.lang;
                data.value = data.retweet_count;
                delete data.retweet_count;
              });
              console.log(result);
              socket.emit("search", result);
            });
          collection
            .find({
              text: new RegExp(datas.keyword)
            })
            .project({
              _id: 0,
              lang: 1,
              retweet_count: 1
            })
            .toArray(function(err, result) {
              if (err) throw err;
              result.forEach(function(data) {
                data.name = data.lang;
                delete data.lang;
                //data.value = data.retweet_count;
                // delete data.retweet_count;
              });
              console.log(result);
              socket.emit("search", result);
            });
          collection.distinct(
            "lang",
            { text: new RegExp(datas.keyword) },
            function(err, result) {
              if (err) throw err;
              result.forEach(function(data) {
                //data.name = data.lang;
                //delete data.lang;
                //data.value = data.retweet_count;
                // delete data.retweet_count;
                collection.count(
                  {
                    $and: [
                      { lang: data.lang },
                      { text: new RegExp(datas.keyword) }
                    ]
                  },
                  function(err, count) {
                    if (err) throw err;
                    data.name = data.lang;
                    delete data.lang;
                    console.log(count);

                    data.value = count;
                    delete count;
                  }
                );
                console.log(data);
              });
            }
          );
          client.close();
        });
      });
    } catch (er) {
      console.log("error: " + cont);
      return er;
    }
  });
});

server.listen(8080);
