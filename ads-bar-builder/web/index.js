// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
console.warn(process.cwd());
// import shopify from "./shopify.js";
import shopify from "./snippetShopify.js";
import productCreator from "./product-creator.js";
import GDPRWebhookHandlers from "./gdpr.js";
// import ApplyMyApiEndpoints from "./middleware/myApi.js";
import ApplySnippetApiEndpoints from "./middleware/snippetApi.js";
// import { SnippetCore } from "./middleware/snippetCore.js";
import { billingConfig } from "./billing.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();



// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  
  async (req, res, next) => {
    const plans = Object.keys(billingConfig);
    const session = res.locals.shopify.session;

    const hasPayment = await shopify.api.billing.check({
      session,
      plans: plans,
      isTest: true,
    });

    if (hasPayment) {
      next();
    } else {
      res.redirect(
        await shopify.api.billing.request({
          session,
          plan: plans[0],
          isTest: true,
        })
      );
    }
  },
  
  shopify.redirectToShopifyOrAppRoot()

);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());
// app.use("/snippet/*", shopify.validateAuthenticatedSession());

app.use(express.json());


app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

// ApplyMyApiEndpoints(app);
ApplySnippetApiEndpoints(app);


app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
