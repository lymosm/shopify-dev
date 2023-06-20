import shopify from "../snippetShopify.js";
import { SnippetDb } from "../snippetDb.js";

var guid_str = "";

/*
  The app's database stores the productId and the discountId.
  This query is used to get the fields the frontend needs for those IDs.
  By querying the Shopify GraphQL Admin API at runtime, data can't become stale.
  This data is also queried so that the full state can be saved to the database, in order to generate QR code links.
*/
const QR_CODE_ADMIN_QUERY = `
  query nodes($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        handle
        title
        images(first: 1) {
          edges {
            node {
              url
            }
          }
        }
      }
      ... on ProductVariant {
        id
      }
      ... on DiscountCodeNode {
        id
      }
    }
  }
`;

export async function getQrCodeOr404(req, res, checkDomain = true) {
  try {
    const response = await SnippetDb.read(req.params.id);
    if (
      response === undefined ||
      (checkDomain &&
        (await getShopUrlFromSession(req, res)) !== response.shopDomain)
    ) {
      res.status(404).send();
    } else {
      return response;
    }
  } catch (error) {
    res.status(500).send(error.message);
  }

  return undefined;
}

export async function guid  (req) { 

  if(typeof req.params.id != "undefined" && req.params.id){
    const old = await SnippetDb.read(req.params.id);
    if(typeof old.code != "undefined" && old.code){
      guid_str = old.code;
      return guid_str;
    }
  }
  guid_str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { 
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); 
      return v.toString(16); 
  }); 
}

export function getSessionId(res){
  return res.locals.shopify.session.id;
}

export function genSnippet(req){
  const body = req.body;
  if(guid_str == ""){
    guid(req);
  }
  console.log("88888");
      console.log(guid_str);
  var html = '<iframe class="xt-snippet-frame" id="a-' + guid_str + '" width="100%" frameborder="0" scrolling="no" src="https://app.xtoool.com/snippet/' + guid_str + '"></iframe>';
  html += '<style> #a-' + guid_str + '{ height: ' + body.frame_height + 'px; } @media screen and(max-width: 768px){ #a-' + guid_str + '{ height: ' + body.m_frame_height + 'px; } } </style>';
  return html;
}

export function getSnippetType(){

}

export async function getShopUrlFromSession(req, res) {
  return `https://${res.locals.shopify.session.shop}`;
}

/*
Expect body to contain
title: string
productId: string
variantId: string
handle: string
discountId: string
discountCode: string
destination: string
*/
export async function parseQrCodeBody(req, res) {
  await guid(req);
  return {
    title: req.body.title,
    productId: req.body.productId,
    variantId: req.body.variantId,
    handle: req.body.handle,
    session_id: getSessionId(res),
    snippet: genSnippet(req),
    img_url: req.body.img_url,
    img_link: req.body.img_link,
    type: req.body.type,
    code: guid_str,
    frame_height: req.body.frame_height,
    m_frame_height: req.body.m_frame_height,
    frame_id: guid_str,
    destination: "",
  };
}

/*
  Replaces the productId with product data queried from the Shopify GraphQL Admin API
*/
export async function formatQrCodeResponse(req, res, rawCodeData) {
  const ids = [];
  
if(typeof rawCodeData[0] != "undefined"){
  if(rawCodeData[0].productId == "" || ! rawCodeData[0].productId){
    return rawCodeData;
  }
}

  /* Get every product, variant and discountID that was queried from the database */
  rawCodeData.forEach(({ productId, discountId, variantId }) => {
    if(productId == "" || ! productId){
      return ;
    }
    ids.push(productId);
    ids.push(variantId);

    if (discountId) {
      ids.push(discountId);
    }
  });
  /* Instantiate a new GraphQL client to query the Shopify GraphQL Admin API */
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  /* Query the Shopify GraphQL Admin API */
  const adminData = await client.query({
    data: {
      query: QR_CODE_ADMIN_QUERY,

      /* The IDs that are pulled from the app's database are used to query product, variant and discount information */
      variables: { ids },
    },
  });

  /*
    Replace the product, discount and variant IDs with the data fetched using the Shopify GraphQL Admin API.
  */
  const formattedData = rawCodeData.map((qrCode) => {
    const product = adminData.body.data.nodes.find(
      (node) => qrCode.productId === node?.id
    ) || {
      title: "Deleted product",
    };

    const discountDeleted =
      qrCode.discountId &&
      !adminData.body.data.nodes.find((node) => qrCode.discountId === node?.id);

    /*
      A user might create a QR code with a discount code and then later delete that discount code.
      For optimal UX it's important to handle that edge case.
      Use mock data so that the frontend knows how to interpret this QR Code.
    */
    if (discountDeleted) {
      QRCodesDB.update(qrCode.id, {
        ...qrCode,
        discountId: "",
        discountCode: "",
      });
    }

    /*
      Merge the data from the app's database with the data queried from the Shopify GraphQL Admin API
    */
    const formattedQRCode = {
      ...qrCode,
      product,
      discountCode: discountDeleted ? "" : qrCode.discountCode,
    };

    /* Since product.id already exists, productId isn't required */
    delete formattedQRCode.productId;
    return formattedQRCode;
  });
  
  return formattedData;
}
