/*
  This file interacts with the app's database and is used by the app's REST APIs.
*/

import sqlite3 from "sqlite3";
import path from "path";
import shopify from "./snippetShopify.js";

const DEFAULT_DB_FILE = path.join(process.cwd(), "snippetDb.sqlite");
const DEFAULT_PURCHASE_QUANTITY = 1;

export const SnippetDb = {
  qrCodesTableName: "app_snippet",
  db: null,
  ready: null,

  create: async function ({
    shopDomain,
    title,
    productId,
    variantId,
    handle,
    session_id,
    img_url,
    img_link,
    type,
    snippet,
    code,
    frame_height,
    m_frame_height,
    frame_id,
    destination,
  }) {
    await this.ready;
    const query = `
      INSERT INTO ${this.qrCodesTableName}
      (shopDomain, title, productId, variantId, handle, session_id, img_url, img_link, type, snippet, code, frame_height, m_frame_height, frame_id, destination, scans)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      RETURNING id;
    `;

    const rawResults = await this.__query(query, [
      shopDomain,
      title,
      productId,
      variantId,
      handle,
      session_id,
      img_url,
      img_link,
      type,
      snippet,
      code,
      frame_height,
      m_frame_height,
      frame_id,
      destination,
    ]);

    return rawResults[0].id;
  },

  update: async function (
    id,
    {
      title,
      productId,
      variantId,
      handle,
      session_id,
      img_url,
      img_link,
      type,
      frame_height,
      m_frame_height,
      snippet,
      destination,
    }
  ) {
    await this.ready;

    const query = `
      UPDATE ${this.qrCodesTableName}
      SET
        title = ?,
        productId = ?,
        variantId = ?,
        handle = ?,
        session_id = ?,
        img_url = ?,
        img_link = ?,
        type = ?,
        frame_height = ?,
        m_frame_height = ?,
        snippet = ?,
        destination = ?
      WHERE
        id = ?;
    `;

    await this.__query(query, [
      title,
      productId,
      variantId,
      handle,
      session_id,
      img_url,
      img_link,
      type,
      frame_height,
      m_frame_height,
      snippet,
      destination,
      id,
    ]);
    return true;
  },

  list: async function (shopDomain) {
    await this.ready;
    const query = `
      SELECT * FROM ${this.qrCodesTableName}
      WHERE shopDomain = ? order by id desc;
    `;

    const results = await this.__query(query, [shopDomain]);
    return results.map((qrcode) => this.__addImageUrl(qrcode));
  },

  getByCode: async function (code){
    await this.ready;
    const query = `select * from ${this.qrCodesTableName} where code = ?;`
    const results = await this.__query(query, [code]);
    if(! Array.isArray(results) || results?.length !== 1){
      return undefined;
    }
    return results[0];
  },

  getSession: async function (id){
    await this.ready;
    const query = `select * from shopify_sessions where id = ?;`
    const results = await this.__query(query, [id]);
    if(! Array.isArray(results) || results?.length !== 1){
      return undefined;
    }
    return results[0];
  },

  read: async function (id) {
    await this.ready;
    const query = `
      SELECT * FROM ${this.qrCodesTableName}
      WHERE id = ?;
    `;
    const rows = await this.__query(query, [id]);
    if (!Array.isArray(rows) || rows?.length !== 1) return undefined;

    return this.__addImageUrl(rows[0]);
  },

  delete: async function (id) {
    await this.ready;
    const query = `
      DELETE FROM ${this.qrCodesTableName}
      WHERE id = ?;
    `;
    await this.__query(query, [id]);
    return true;
  },

  /* The destination URL for a QR code is generated at query time */
  generateQrcodeDestinationUrl: function (qrcode) {
    return `${shopify.api.config.hostScheme}://${shopify.api.config.hostName}/qrcodes/${qrcode.id}/scan`;
  },

  /* The behavior when a QR code is scanned */
  handleCodeScan: async function (qrcode) {

    /* Log the scan in the database */
    await this.__increaseScanCount(qrcode);

    const url = new URL(qrcode.shopDomain);
    switch (qrcode.destination) {

      /* The QR code redirects to the product view */
      case "product":
        return this.__goToProductView(url, qrcode);

      /* The QR code redirects to checkout */
      case "checkout":
        return this.__goToProductCheckout(url, qrcode);

      default:
        throw `Unrecognized destination "${qrcode.destination}"`;
    }
  },

  /* Private */

  /*
    Used to check whether to create the database.
    Also used to make sure the database and table are set up before the server starts.
  */

  __hasQrCodesTable: async function () {
    const query = `
      SELECT name FROM sqlite_schema
      WHERE
        type = 'table' AND
        name = ?;
    `;
    const rows = await this.__query(query, [this.qrCodesTableName]);
    return rows.length === 1;
  },

  /* Initializes the connection with the app's sqlite3 database */
  init: async function () {

    /* Initializes the connection to the database */
    this.db = this.db ?? new sqlite3.Database(DEFAULT_DB_FILE);

    const hasQrCodesTable = await this.__hasQrCodesTable();
    if (hasQrCodesTable) {
      this.ready = Promise.resolve();

      /* Create the QR code table if it hasn't been created */
    } else {
      const query = `
        CREATE TABLE ${this.qrCodesTableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          shopDomain VARCHAR(511) NOT NULL,
          title VARCHAR(511) NOT NULL,
          productId VARCHAR(255) NOT NULL,
          variantId VARCHAR(255) NOT NULL,
          handle VARCHAR(255) NOT NULL,
          session_id VARCHAR(255) NOT NULL default "",
          img_url VARCHAR(500) NOT NULL default "",
          img_link VARCHAR(500) NOT NULL default "",
          snippet VARCHAR(500) NOT NULL,
          code VARCHAR(500) NOT NULL,
          frame_height VARCHAR(25) NOT NULL default "",
          m_frame_height VARCHAR(25) NOT NULL default "",
          frame_id VARCHAR(60) NOT NULL default "",
          type integer default 1,
          destination VARCHAR(255) NOT NULL default "",
          scans INTEGER,
          createdAt DATETIME NOT NULL DEFAULT (datetime(CURRENT_TIMESTAMP, 'localtime')),
          unique(code)
        )
      `;

      /* Tell the various CRUD methods that they can execute */
      this.ready = this.__query(query);
    }
  },

  /* Perform a query on the database. Used by the various CRUD methods. */
  __query: function (sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  },

  __addImageUrl: function (qrcode) {
    try {
      qrcode.imageUrl = this.__generateQrcodeImageUrl(qrcode);
    } catch (err) {
      console.error(err);
    }

    return qrcode;
  },

  __generateQrcodeImageUrl: function (qrcode) {
    return `${shopify.api.config.hostScheme}://${shopify.api.config.hostName}/qrcodes/${qrcode.id}/image`;
  },

  __increaseScanCount: async function (qrcode) {
    const query = `
      UPDATE ${this.qrCodesTableName}
      SET scans = scans + 1
      WHERE id = ?
    `;
    await this.__query(query, [qrcode.id]);
  },

  __goToProductView: function (url, qrcode) {
    return productViewURL({
      discountCode: qrcode.discountCode,
      host: url.toString(),
      productHandle: qrcode.handle,
    });
  },

  __goToProductCheckout: function (url, qrcode) {
    return productCheckoutURL({
      discountCode: qrcode.discountCode,
      host: url.toString(),
      variantId: qrcode.variantId,
      quantity: DEFAULT_PURCHASE_QUANTITY,
    });
  },
};

/* Generate the URL to a product page */
function productViewURL({ host, productHandle, discountCode }) {
  const url = new URL(host);
  const productPath = `/products/${productHandle}`;

  /* If this QR Code has a discount code, then add it to the URL */
  if (discountCode) {
    url.pathname = `/discount/${discountCode}`;
    url.searchParams.append("redirect", productPath);
  } else {
    url.pathname = productPath;
  }

  return url.toString();
}

/* Generate the URL to checkout with the product in the cart */
function productCheckoutURL({ host, variantId, quantity = 1, discountCode }) {
  const url = new URL(host);
  const id = variantId.replace(
    /gid:\/\/shopify\/ProductVariant\/([0-9]+)/,
    "$1"
  );

  /* The cart URL resolves to a checkout URL */
  url.pathname = `/cart/${id}:${quantity}`;

  if (discountCode) {
    url.searchParams.append("discount", discountCode);
  }

  return url.toString();
}
