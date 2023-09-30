import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Stack,
  Link,
  Button,
  EmptyState,
  Heading,
} from "@shopify/polaris";
// import { TitleBar } from "@shopify/app-bridge-react";
import { useNavigate, TitleBar, Loading } from "@shopify/app-bridge-react";

import { trophyImage } from "../assets";
import shopify from "../../snippetShopify.js";

import { MyList, ProductsCard, SnippetList} from "../components";
import { useAppQuery } from "../hooks";
import { useCallback } from "react";
import { billingConfig } from "../../billing.js";


export default function HomePage() {

  const navigate = useNavigate();
  /*
  const list1 = [
    {
      createdAt: "2022-06-13",
      destination: "checkout",
      title: "My first QR code",
      id: 1,
      discountCode: "SUMMERDISCOUNT",
      product: {
        title: "Faded t-shirt",
      }
    },
    {
      createdAt: "2022-06-13",
      destination: "product",
      title: "My second QR code",
      id: 2,
      discountCode: "WINTERDISCOUNT",
      product: {
        title: "Cozy parka",
      }
    },
    {
      createdAt: "2022-06-13",
      destination: "product",
      title: "QR code for deleted product",
      id: 3,
      product: {
        title: "Deleted product",
      }
    },
  ];
  */
 /* useAppQuery wraps react-query and the App Bridge authenticatedFetch function */
const {
  data: list1,
  isLoading,

  /*
    react-query provides stale-while-revalidate caching.
    By passing isRefetching to Index Tables we can show stale data and a loading state.
    Once the query refetches, IndexTable updates and the loading state is removed.
    This ensures a performant UX.
  */
  isRefetching,
} = useAppQuery({
  url: "/api/qrcodes",
});

  /* Use Polaris Card and EmptyState components to define the contents of the empty state */
  const emptyStateMarkup =
    !isLoading && !MyList?.length ? (
      <Card sectioned>
        <EmptyState
          heading="Create unique QR codes for your product"
          /* This button will take the user to a Create a QR code page */
          action={{
            content: "Create QR code",
            onAction: () => navigate("/qrcodes/new"),
          }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>
            Allow customers to scan codes and buy products using their phones.
          </p>
        </EmptyState>
      </Card>
    ) : null;

console.log(list1); 
var myListHtml = "";
if(typeof list1 != "undefined"){
  myListHtml = (<SnippetList QRCodes={list1} loading={false} />);
}

const checkPlan = useCallback( async () => {
	const plans = Object.keys(billingConfig);
    const session = shopify.session;
	console.log(session);
    const hasPayment = await shopify.api.billing.check({
      session,
      plans: plans,
      isTest: true,
    });

	console.log(hasPayment);

}, []);

const addSubscription = useCallback(async () => {
	const client = new shopify.clients.Graphql({session});
	const name = "Super Duper Recurring Plan";
	const returnUrl = "http://super-duper.shopifyapps.com/";
	const  lineItems = [
		{
			"plan": {
			  "appRecurringPricingDetails": {
				"price": {
				  "amount": 10,
				  "currencyCode": "USD"
				},
				"interval": "EVERY_30_DAYS"
			  }
			}
		  }
	];
	const data = await client.query({
	data: {
		"query": `mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!) {
		appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems) {
			userErrors {
			field
			message
			}
			appSubscription {
			id
			}
			confirmationUrl
		}
		}`,
		"variables": {
		"name": "Super Duper Recurring Plan",
		"returnUrl": "http://super-duper.shopifyapps.com/",
		"lineItems": [
			{
			"plan": {
				"appRecurringPricingDetails": {
				"price": {
					"amount": 10.0,
					"currencyCode": "USD"
				},
				"interval": "EVERY_30_DAYS"
				}
			}
			}
		]
		},
	},
	});

	console.log(data);

}, []);
  
  return (
    <Page fullWidth>
      <TitleBar
        title="code snippet"
        primaryAction={{
          content: "Add Snippet",
          onAction: () => navigate("/mypages/add_snippet"),
        }}
      />
      
      <Layout>
        <Layout.Section>
        <Button onClick={() => { addSubscription(); }}>Add Plan</Button>
		<Button onClick={() => { checkPlan(); }}>Check Plan</Button>
        {myListHtml}
        {emptyStateMarkup}
        </Layout.Section>
       
      </Layout>
      
    </Page>
  );
}
