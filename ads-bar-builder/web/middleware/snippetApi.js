/*
  The custom REST API to support the app frontend.
  Handlers combine application data from qr-codes-db.js with helpers to merge the Shopify GraphQL Admin API data.
  The Shop is the Shop that the current user belongs to. For example, the shop that is using the app.
  This information is retrieved from the Authorization header, which is decoded from the request.
  The authorization header is added by App Bridge in the frontend code.
*/

import express from "express";

import shopify from "../snippetShopify.js"; 
import crypto from "crypto";
import { SnippetDb } from "../snippetDb.js";
import { SnippetCore } from "./snippetCore.js";
import { rename, existsSync, mkdir, readFile } from "fs";
import { formidable } from "formidable";
import { resolve } from "path";
// const formidable = require('formidable');
// import { path } from "path";
import { billingConfig } from "../billing.js";
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

import {
  getQrCodeOr404,
  getShopUrlFromSession,
  parseQrCodeBody,
  formatQrCodeResponse,
} from "../helpers/snippetDbHelp.js";


const billing_test = false;


const DISCOUNTS_QUERY = `
  query discounts($first: Int!) {
    codeDiscountNodes(first: $first) {
      edges {
        node {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
            ... on DiscountCodeBxgy {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
            ... on DiscountCodeFreeShipping {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default function ApplySnippetApiEndpoints(app) {
  app.use(express.json());

  // <iframe src="hosts/snippet/xxxx"></iframe>
app.get("/snippet/*", async (req, res) => {
  // google需要配置，否则报错cors error
  //res.setHeader('Access-Control-Allow-Credentials', 'true');
  // 允许的地址,http://127.0.0.1:9000这样的格式
  //res.setHeader('Access-Control-Allow-Origin', "*");
  // 允许跨域请求的方法
  /*
  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, GET, OPTIONS, DELETE, PUT'
  );
  // 允许跨域请求header携带哪些东西
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, If-Modified-Since'
  );
  */
  res.setHeader('Content-Security-Policy', "default-src 'self' style-src 'self' 'unsafe-inline'; img-src *;  *; script-src *");

  const snippet = SnippetCore();
  const html = await snippet.dealSnippet(req, res);
  res.status(200).send(html);
});

app.post("/snippetaaa/*", async (req, res) => {

  res.setHeader('Content-Security-Policy', "default-src 'self' style-src 'self' 'unsafe-inline'; img-src *;  *; script-src *");

  const html = "<h2>ssss</h2>";
  res.status(200).send(html);
});


app.post("/api/checkplan", async (req, res) => {
  console.log("checkplan");
  try {

    const plans = Object.keys(billingConfig);
    const session = res.locals.shopify.session;

    const hasPayment = await shopify.api.billing.check({
      session,
      plans: plans,
      isTest: billing_test,
    });

    const charge_url = 
        await shopify.api.billing.request({
          session,
          plan: plans[0],
          isTest: billing_test,
        });

    const ret = {
      paid: hasPayment,
      url: charge_url
    };
    
    return res.status(200).send(ret);
  }catch (error) {
    res.status(500).send(error.message);
  }
  
});



  app.post("/api/qrcodes", async (req, res) => {
    try {
      console.log("submiting in...");

      const plans = Object.keys(billingConfig);
    const session = res.locals.shopify.session;
  
    const hasPayment = await shopify.api.billing.check({
      session,
      plans: plans,
      isTest: billing_test,
    });

    if(! hasPayment){
      const charge_url = 
        await shopify.api.billing.request({
          session,
          plan: plans[0],
          isTest: billing_test,
        });
        return res.status(200).send({url: charge_url});
    
    }

      const id = await SnippetDb.create({
        ...(await parseQrCodeBody(req, res)),

        /* Get the shop from the authorization header to prevent users from spoofing the data */
        shopDomain: await getShopUrlFromSession(req, res),
      });
      console.log("submiting in 2222...");
      const response = await formatQrCodeResponse(req, res, [
        await SnippetDb.read(id),
      ]);
      console.log("submiting in 3333...");
      res.status(201).send(response[0]);
    } catch (error) {
      console.log("submit error ");
      res.status(500).send(error.message);
    }
  });

  app.post("/api/image-upload", async (req, res) => {
    try {
      console.log("upload in...");
      const ret = {status: 1};
      res.status(201).send(ret);
    } catch (error) {
      console.log("submit error ");
      res.status(500).send(error.message);
    }
  });

  app.get("/images/*", async (req, res) => {
    const mime = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
    };
    
    var dir = resolve(__dirname, "..") + "/"
    const path = dir + decodeURIComponent(req.url.replace("/images/", "")); 
    readFile(path, (err, data) => {
      if(err){
        res.statusCode = 404;
        res.end("404 Not Found");
      }else{
        const suffix = "." + req.url.split(".").pop();
        if(mime[suffix]){
          res.setHeader("Content-Type", mime[suffix]);
          res.end(data);
        }else{
          res.statusCode = 416;
          res.end("Not Supported");
        } 
      }
    });
  });

  app.post("/apis/data-request", async (req, res) => {
      const ret = {status: true};
      const hmac = req.headers["x-shopify-hmac-sha256"];

      const genHash = crypto
      .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
      // .update(String(req.body), "utf8", "hex")
      .update(JSON.stringify(req.body), "utf8", "hex")
      .digest("base64");

      console.log(hmac + "===" + genHash);

      if (genHash !== hmac) {
          return res.status(401).send("Couldn't verify incoming Webhook request!");
      }
      res.status(200).send(ret);
  });
  app.post("/apis/customers-redact", async (req, res) => {
    const ret = {status: true};
    const hmac = req.headers["x-shopify-hmac-sha256"];

      const genHash = crypto
      .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
      // .update(String(req.body), "utf8", "hex")
      .update(JSON.stringify(req.body), "utf8", "hex")
      .digest("base64");

      console.log(hmac + "===" + genHash);

      if (genHash !== hmac) {
          return res.status(401).send("Couldn't verify incoming Webhook request!");
      }
    res.status(200).send(ret);
  });
  app.post("/apis/shop-redact", async (req, res) => {
    const ret = {status: true};
    const hmac = req.headers["x-shopify-hmac-sha256"];

      const genHash = crypto
      .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
      // .update(String(req.body), "utf8", "hex")
      .update(JSON.stringify(req.body), "utf8", "hex")
      .digest("base64");

      // .update(Buffer.from(req.body))
      // .update(JSON.stringify(req.body))
      // .update(req.body.toString())

      // console.log(req);
      console.log(req.body);
      console.log(String(req.body));
      console.log(hmac + "===" + genHash);

      if (genHash !== hmac) {
          return res.status(401).send("Couldn't verify incoming Webhook request!");
      }
    res.status(200).send(ret);
  });

  app.post("/apis/image-upload", async (req, res) => {
    try {
      console.log("upload in...");
      var url = "";
      function getNum(i){
        return i < 10 ? ("0" + i) : i;
      }
      function saveFile(file, callback){
        console.log("save file");
        
         // let savePath = path.resolve(__dirname, `../static/${file.name}`)
         const date = new Date();
         const time = date.getTime();
         const year = date.getFullYear();
         const month = getNum(date.getMonth());

         var dir = resolve(__dirname, "..") + "/static";
        if(! existsSync(dir)){
          mkdir(dir, 777, function(err){
            console.log(err);
          });
        }
        url += "/static/" + year + month;
        dir += "/" + year + month;
        if(! existsSync(dir)){
          mkdir(dir, 777, function(err){
            console.log(err);
          });
        }
         let savePath = dir + "/" + time + "-" + file.originalFilename;
         url += "/" + time + "-" + file.originalFilename;
          let sourcePath = file.filepath;
          rename(sourcePath, savePath, (err) => {
            callback(err, url);
          });
      }

      const form = formidable({});
      form.parse(req, function(err, fields, files) {
          let file = files;
          saveFile(file.file[0], (err) => {
            const ts = {
              status: true,
              url: url
            };
            console.log("url");
            console.log(url);
            res.send(err || ts);
          });
      });

      // const ret = {status: 1};
      // res.status(201).send(ret);
    } catch (error) {
      console.log("submit error ");
      res.status(500).send(error.message);
    }
  });


  app.patch("/api/qrcodes/:id", async (req, res) => {
    console.log("/api/qrcodes/:id");
    const qrcode = await getQrCodeOr404(req, res);

    const plans = Object.keys(billingConfig);
    const session = res.locals.shopify.session;
  
    const hasPayment = await shopify.api.billing.check({
      session,
      plans: plans,
      isTest: billing_test,
    });

    if(! hasPayment){
      const charge_url = 
        await shopify.api.billing.request({
          session,
          plan: plans[0],
          isTest: billing_test,
        });
        return res.status(200).send({url: charge_url});
    
    }
  
  

    if (qrcode) {
      try {
        await SnippetDb.update(req.params.id, await parseQrCodeBody(req, res));
        const response = await formatQrCodeResponse(req, res, [
          await SnippetDb.read(req.params.id),
        ]);
        res.status(200).send(response[0]);
      } catch (error) {
        res.status(500).send(error.message);
      }
    }
  });

  app.get("/api/qrcodes", async (req, res) => {
    console.log("get /api/qrcodes/");
    try {
      const rawCodeData = await SnippetDb.list(
        await getShopUrlFromSession(req, res)
      );

      const response = await formatQrCodeResponse(req, res, rawCodeData);
      res.status(200).send(response);
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message);
    }
  });

  app.get("/api/qrcodes/:id", async (req, res) => {
    const qrcode = await getQrCodeOr404(req, res);
console.log("/api/qrcodes/:id ");
// console.log(qrcode);

    if (qrcode) {
      const formattedQrCode = await formatQrCodeResponse(req, res, [qrcode]);
      res.status(200).send(formattedQrCode[0]);
    }
  });

  app.delete("/api/qrcodes/:id", async (req, res) => {
    const qrcode = await getQrCodeOr404(req, res);

    if (qrcode) {
      await SnippetDb.delete(req.params.id);
      res.status(200).send();
    }
  });
}
