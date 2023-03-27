// console.warn(process.env);
var express = require("express");
var app = express();
app.use(express.static(__dirname + "/web"));

app.get("/api/products/count", async (_req, res) => {
  var countData = {"code": 2333};
  res.status(200).send(countData);
});

app.listen(3000);
