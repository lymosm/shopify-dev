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
      console.log(req);
      const code = "hosts/snippet/code".match(/snippet\/(\S*)/)[1];
      if(! code || code == null){
        return "";
      }
      const data = SnippetDb.getByCode(code);
      const product_id = data.productId;

      const client = new shopify.api.clients.Graphql(res.locals.shopify.session);
      const product_data = await client.query({
        data: `query {
          product(id: $product_id) {
            title
            description
            onlineStoreUrl
            images
            url
          }
        }`,
      });
      console.log(product_data);
      var html = "<!DOCTYPE html><html><head></head><body>";

      html += "</body></html>"

      return html;

    }
  };
  return obj;
};
