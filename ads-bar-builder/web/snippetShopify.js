import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-01";
import { SnippetDb } from "./snippetDb.js";
import sqlite3 from "sqlite3";
import { join } from "path";
import { billingConfig } from "./billing.js";

const database = new sqlite3.Database(join(process.cwd(), "snippetDb.sqlite"));


// Initialize SQLite DB
SnippetDb.db = database;
SnippetDb.init();

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    billing: billingConfig, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new SQLiteSessionStorage(database),
});

export default shopify;
