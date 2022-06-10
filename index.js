var express = require("express");
const sqlite3 = require("sqlite3");
var app = express();
require("dotenv").config();

var useToken = false;
var token = "";

if (process.env.TOKEN) {
  useToken = true;
  token = process.env.TOKEN;
}

var db = new sqlite3.Database("database.db", (err) => {
  if (err) {
    console.log("Could not connect to database", err);
  } else {
    console.log("Connected to database");
  }
});

const sql = `CREATE TABLE IF NOT EXISTS dynlinks (
    name TEXT, 
    url TEXT, 
    deepurl TEXT)`;
db.run(sql, [], (err) => {
  if (err) {
    console.log(err);
  }
});

var port = 80;

if (process.env.PORT) {
  port = process.env.PORT;
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get("/link/:url", (req, res) => {
  db.all("SELECT url, deepurl FROM dynlinks", (err, rows) => {
    var redirecturl = "";
    rows.forEach((row) => {
      if (row.url == req.params.url) {
        redirecturl = row.deepurl;
      }
    });
    if (redirecturl != "") {
      res.redirect(redirecturl);
    } else {
      res.sendStatus(404);
    }
  });
});

app.get("/create", (req, res) => {
  if (useToken) {
    if (req.query.token == token) {
      var dbrun = db.prepare(`INSERT INTO dynlinks VALUES (?, ?, ?)`);

      dbrun.run(req.query.name, req.query.url, req.query.deepurl);
      dbrun.finalize();
      res.json({
        status: "SUCCESS",
        name: req.query.name,
        url: `https://${req.get("host")}/link/${req.query.url}`,
        deepurl: req.query.deepurl,
      });
    } else {
      res.json({
        status: "FAIL",
        error: "INCORRECT TOKEN",
      });
    }
  } else {
    var dbrun = db.prepare(`INSERT INTO dynlinks VALUES (?, ?, ?)`);

    dbrun.run(req.query.name, req.query.url, req.query.deepurl);
    dbrun.finalize();
    res.json({
      status: "SUCCESS",
      name: req.query.name,
      url: `https://${req.get("host")}/link/${req.query.url}`,
      deepurl: req.query.deepurl,
    });
  }
});

app.get("/edit", (req, res) => {
  if (useToken) {
    if (req.query.token == token) {
      db.all("SELECT name FROM dynlinks", (err, rows) => {
        var redirecturl = "";
        rows.forEach((row) => {
          if (row.name == req.query.name) {
            redirecturl = row.name;
          }
        });
        if (redirecturl != "") {
          var dbrun = db.prepare(
            "UPDATE dynlinks SET deepurl = ? WHERE name = ?"
          );
          dbrun.run(req.query.deepurl, req.query.name);
          dbrun.finalize();
          res.json({
            status: "SUCCESS",
            name: req.query.name,
            deepurl: req.query.deepurl,
          });
        } else {
          res.sendStatus(404);
        }
      });
    } else {
      res.json({
        status: "FAIL",
        error: "INCORRECT TOKEN",
      });
    }
  } else {
    db.all("SELECT name FROM dynlinks", (err, rows) => {
      var redirecturl = "";
      rows.forEach((row) => {
        if (row.name == req.query.name) {
          redirecturl = row.name;
        }
      });
      if (redirecturl != "") {
        var dbrun = db.prepare(
          "UPDATE dynlinks SET deepurl = ? WHERE name = ?"
        );
        dbrun.run(req.query.deepurl, req.query.name);
        dbrun.finalize();
        res.json({
          status: "SUCCESS",
          name: req.query.name,
          deepurl: req.query.deepurl,
        });
      } else {
        res.sendStatus(404);
      }
    });
  }
});

app.get("/list", (req, res) => {
  db.all("SELECT name, url, deepurl FROM dynlinks", (err, rows) => {
    res.json({ rows });
  });
});
