// web/billing.js
import { BillingInterval } from "@shopify/shopify-api";

export const billingConfig = {
  "My plan": {
    amount: 3.99,
    currencyCode: "USD",
    interval: BillingInterval.Usage,
    // usageTerms: "One dollar per button click",
  },
};
