/*
  The custom REST API to support the app frontend.
  Handlers combine application data from qr-codes-db.js with helpers to merge the Shopify GraphQL Admin API data.
  The Shop is the Shop that the current user belongs to. For example, the shop that is using the app.
  This information is retrieved from the Authorization header, which is decoded from the request.
  The authorization header is added by App Bridge in the frontend code.
*/

import express from "express";

import shopify from "../snippetShopify.js";
import { SnippetDb } from "../snippetDb.js";


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

export function SnippetCore() {
  const obj = {
    dealSnippet: async function(req, res){
      
      const code = req.url.match(/snippet\/(\S*)/)[1];
      console.log(code);
      if(! code || code == null){
        return "";
      }
      const data = await SnippetDb.getByCode(code);
      const product_id = data.productId;
      const session_id = data.session_id;
      console.log("session_id: " + session_id);
      const session = await SnippetDb.getSession(session_id);
      const session_obj = {
        session: session
      };
      console.log(session_obj);

     // const client = new shopify.api.clients.Graphql(res.locals.shopify.session);
      const client = new shopify.api.clients.Graphql(session_obj);
      const product_data = await client.query({
        data: `query {
          product(id: "${product_id}") {
            title
            description
            onlineStoreUrl
            onlineStorePreviewUrl
            featuredImage {
              url
            }
            onlineStoreUrl
          }
        }`,
      });
      const pp = product_data.body.data.product;
      var url = pp.onlineStoreUrl ?? pp.onlineStorePreviewUrl;
      console.log(pp);
      var html = "<!DOCTYPE html><html><head></head><body>";
      html += `
      <div class="xt-product-box">
  <div class="xt-product-img">
    <img src="${pp.featuredImage.url}">
  </div>
  <div class="xt-product-title">
    <h2>${pp.title}</h2>
  </div>
  <div class="xt-product-action">
    <a class="xt-btn" href="${url}">Shop now</a>
  </div>
</div>
      
      <style>
      div{
        box-sizing: border-box;
        position: relative;
      }
      .xt-product-box{
        width: 25%;
        max-width: 230px;
        min-width: 230px;
        padding-bottom: 20px;
        border: 1px solid #ccc;
    }
    .xt-product-img img{
        width: 100%;
    }
    .xt-product-action{
        text-align: center;
    }
    .xt-product-title{
        text-align: center;
        color: #000;
        font-weight: bold;
    }
    .xt-btn{
        text-decoration: none;
        color: #fff;
        background-color: blue;
        border-radius: 10px;
        padding: 4px 10px;
    }
    </style>
      `;
      html += "</body></html>";

      return html;

    }
  };
  return obj;
};
