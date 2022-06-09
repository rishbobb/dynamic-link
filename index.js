var express = require("express");
const sqlite3 = require("sqlite3");
var app = express();

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

app.listen(3000, () => {
  console.log("Server running on port 3000");
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
  var dbrun = db.prepare(`INSERT INTO dynlinks VALUES (?, ?, ?)`);

  dbrun.run(req.query.name, req.query.url, req.query.deepurl);
  dbrun.finalize();
  res.json({
    status: "SUCCESS",
    name: req.query.name,
    url: `https://${req.get("host")}/link/${req.query.url}`,
    deepurl: req.query.deepurl,
  });
});
