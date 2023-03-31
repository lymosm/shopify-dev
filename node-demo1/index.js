// console.warn(process.env);
// var express = require("express");
import express from "express";
// var https = require("https");
import https from "https";
import '@shopify/shopify-api/adapters/node';
import {shopifyApi, LATEST_API_VERSION} from '@shopify/shopify-api'


var app = express();
// app.use(express.static(__dirname + "/web"));

const shopify = shopifyApi({
  // The next 4 values are typically read from environment variables for added security
  apiKey: '81e84554845475320e0f5b917eedf851',
  apiSecretKey: '22d60231db3372bc162256397cd6aad9',
  scopes: ['read_products'],
  hostName: 'ngrok-tunnel-address'
  // ...
});
// console.log(shopify);

app.get("/api/products/count", async (_req, res) => {
  var countData = {"code": 2333};
  res.status(200).send(countData);
});
app.get("/", async(_req, res) => {
  // console.warn(_req);
  let shop = _req.query.shop;
  let timestamp = _req.query.timestamp;
  let host = _req.query.host;
  let hamc = _req.query.hmac;
  let session = _req.query.session;
  let client_id = "81e84554845475320e0f5b917eedf851";
  let scopes = "read_products";
  // let redirect = "http://localhost:3000/install/callback";
  let redirect = "https://www.xtoool.com/app/install/callback";

  let access_mode = "offline";
  let state = "338dsjdkjdyuds";
  // 
  let url = "https://" + shop + "/admin/oauth/authorize?client_id=" + client_id + "&scope=" + scopes + "&redirect_uri=" + redirect + "&state=" + state + "&grant_options[]=" + access_mode;
  if(session == "" || session == null){
    res.redirect(url);
  }else{
    res.status(200).send("hello world!peng");
  }
  
});

app.get("/install/callback", function(_req, res){
 //  console.log(_req);
  let shop = _req.query.shop;
  let timestamp = _req.query.timestamp;
  let host = _req.query.host;
  let hamc = _req.query.hmac;
  let code = _req.query.code;
  let state = _req.query.state;
  getAccessToken(code, shop, _req, res);
  // res.status(200).send('<h2>callback</h2>');
});

var getAccessToken = async function (code, shop, req, ress){
 // console.log("get access token");
  let client_id = "81e84554845475320e0f5b917eedf851";
  let client_secret = "22d60231db3372bc162256397cd6aad9";
  let url = "https://" + shop + "/admin/oauth/access_token?client_id=" + client_id + "&client_secret=" + client_secret + "&code=" + code;
  /*
  const ret = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  console.warn(ret);
  console.warn(ret.json());
  */
  var options = {
    hostname: shop,
    post: 443,
    path: "/admin/oauth/access_token?client_id=" + client_id + "&client_secret=" + client_secret + "&code=" + code,
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  };
  let post_data = "";
  let reqs = https.request(options, res => {
    let status_code = res.statusCode;
    if(status_code == 200){

    }
    res.on("data", async d =>  {
     // console.log(`${d}`);
      let ret = `${d}`;

      if(req.query.embedded !== 1){
        const embeddedUrl = await shopify.auth.getEmbeddedAppUrl({
          rawRequest: req,
          rawResponse: ress,
        });
     //   console.log(embeddedUrl);
        ress.redirect(embeddedUrl);
        // ress.redirect(embeddedUrl + req.path);
      }else{
        const host = req.query.host;
        return ress.redirect(`/?shop=${session.shop}&host=${encodeURIComponent(host)}`);
      }
    });
    res.on("end", function(){

    });
   //  console.warn(res);
  });
  reqs.on("error", error => {
    console.error(error);
  });
  reqs.write(post_data);
  reqs.end();
};
app.listen(3000);
