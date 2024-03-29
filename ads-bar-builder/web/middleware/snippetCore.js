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

      var trim_text = function(text, len){
        const text_arr = text.split(" ");
						const str_len = text_arr.length;
						if(len >= str_len){
							return text;
						}
						let new_arr = [];
						for(let i = 0; i < len; i++){
							new_arr.push(text_arr[i]);
						}
						return new_arr.join(" ") + "...";
      }
    

      
      const code = req.url.match(/snippet\/(\S*)/)[1];
      if(! code || code == null){
        return "";
      }
      const data = await SnippetDb.getByCode(code);
      if(data == null || typeof data == "undefined"){
        return '404 Not Found';
      }
      const product_id = data.productId;
      const variant_id = data.variantId;
      const session_id = data.session_id;
      const type = data.type;

      var html = "<!DOCTYPE html><html><head></head><body>";

      if(type == 1){
        console.log("session_id: " + session_id);
        const session = await SnippetDb.getSession(session_id);
        const session_obj = {
          session: session
        };
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

        const variant_data = await client.query({
          data: `query {
            productVariant(id: "${variant_id}") {
              title
              displayName
              createdAt
              price
            }
          }`,
        });
        const vv = variant_data.body.data.productVariant;
        pp.title = trim_text(pp.title, 12);

        html += `
          <div class="xt-product-box">
            <div class="xt-product-img">
              <img src="${pp.featuredImage.url}">
            </div>
            <div class="xt-product-right">
              <div class="xt-product-title">
                <h2>${pp.title}</h2>
              </div>
              <div class="xt-product-price">
                $${vv.price}
              </div>
              <div class="xt-product-action">
                <a class="xt-btn" target="_top" href="${url}">Shop now</a>
              </div>
            </div>
        </div>`;
      }else{
        html += `
          <div class="xt-image-box">
            <a target="_blank" href="${data.img_link}">
              <img src="/images${data.img_url}">
            </a>
          </div>
        `;
      }

html += `
      <style>
      div{
        box-sizing: border-box;
        position: relative;
      }
      .xt-product-price{
        color: #f04057;
        padding-top: 10px;
        padding-bottom: 30px;
        font-weight: bold;
      }
      .xt-image-box{
        width: 100%;
        height: 100vh;
      }
      .xt-image-box img{
        width: 100%;
      }
      .xt-product-box{
        padding-bottom: 20px;
        display: flex;
    }
    .xt-product-img{
      width: 40%;
    }
    .xt-product-right{
      width: 60%;
      padding-left: 20px;
    }
    .xt-product-img img{
        width: 100%;
    }
    .xt-product-action{
        text-align: left;
    }
    .xt-product-title{
        text-align: left;
        color: #000;
        font-weight: bold;
    }
    .xt-btn{
        text-decoration: none;
        color: #fff;
        background-color: #7635f3;
        border-radius: 4px;
        padding: 10px 60px;
    }
    </style>
      `;
      html += "</body></html>";

      return html;

    }
  };
  return obj;
};
