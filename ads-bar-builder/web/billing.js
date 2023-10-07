import { BillingInterval } from "@shopify/shopify-api";

export const billingConfig = {
  "Simple Plan": {
    amount: 3.99,
    currencyCode: "USD",
    trialDays: 7,
    interval: BillingInterval.Every30Days,
    usageTerms: "Trial free 7 days and 3.99 dollar per month after",
  },
};
