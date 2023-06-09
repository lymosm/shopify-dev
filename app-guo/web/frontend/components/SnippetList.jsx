import { useNavigate } from "@shopify/app-bridge-react";
import copy from "copy-to-clipboard";
import {
  Card,
  Icon,
  IndexTable,
  Button,
  Stack,
  TextStyle,
  Thumbnail,
  UnstyledLink,
  Frame,
  Toast
} from "@shopify/polaris";
import { DiamondAlertMajor, ImageMajor } from "@shopify/polaris-icons";

/* useMedia is used to support multiple screen sizes */
import { useMedia } from "@shopify/react-hooks";
import {useState, useCallback} from 'react';

/* dayjs is used to capture and format the date a QR code was created or modified */
import dayjs from "dayjs";

/* Markup for small screen sizes (mobile) */
function SmallScreenCard({
  id,
  title,
  product,
  discountCode,
  scans,
  createdAt,
  navigate,
}) {
  return (
    <UnstyledLink onClick={() => navigate(`/mypages/${id}`)}>
      <div
        style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #E1E3E5" }}
      >
        <Stack>
          <Stack.Item>
            <Thumbnail
              source={product?.images?.edges[0]?.node?.url || ImageMajor}
              alt="placeholder"
              color="base"
              size="small"
            />
          </Stack.Item>
          <Stack.Item fill>
            <Stack vertical={true}>
              <Stack.Item>
                <p>
                  <TextStyle variation="strong">
                    {truncate(title, 35)}
                  </TextStyle>
                </p>
                <p>{truncate(product?.title, 35)}</p>
                <p>{dayjs(createdAt).format("MMMM D, YYYY")}</p>
              </Stack.Item>
              <div style={{ display: "flex" }}>
                <div style={{ flex: "3" }}>
                  <TextStyle variation="subdued">Discount</TextStyle>
                  <p>{discountCode || "-"}</p>
                </div>
                <div style={{ flex: "2" }}>
                  <TextStyle variation="subdued">Scans</TextStyle>
                  <p>{scans}</p>
                </div>
              </div>
            </Stack>
          </Stack.Item>
        </Stack>
      </div>
    </UnstyledLink>
  );
}

export function SnippetList({ QRCodes, loading }) {
  const navigate = useNavigate();

  const [active, setActive] = useState(false);

  const toggleActive = useCallback((sta) => setActive(sta), []);

  const toastMarkup = active ? (
    <Toast content="copied" onDismiss={toggleActive} />
  ) : null;

  /* Check if screen is small */
  const isSmallScreen = useMedia("(max-width: 640px)");

  var copyTo =  function(txt){
    copy(txt);
    // Toast("copied", "", false);
    toggleActive(true);
    setTimeout(function(){
      toggleActive(false);
    }, 2000);
  }

  /* Map over QRCodes for small screen */
  const smallScreenMarkup = QRCodes.map((QRCode) => (
    <SmallScreenCard key={QRCode.id} navigate={navigate} {...QRCode} />
  ));

  const resourceName = {
    singular: "Snippet",
    plural: "Snippet",
  };

  const rowMarkup = QRCodes.map(
    ({ id, title, product, snippet, scans, createdAt, type }, index) => {
    //  const deletedProduct = product.title.includes("Deleted product");

      /* The form layout, created using Polaris components. Includes the QR code data set above. */
      return (
        <IndexTable.Row
          id={id}
          key={id}
          position={index}
        >
          <IndexTable.Cell>
            
              {truncate(id, 25)}
          </IndexTable.Cell>
          <IndexTable.Cell>
  
              {truncate(title, 25)}
          </IndexTable.Cell>
          <IndexTable.Cell>
  
              {type == 2 ? "Image" : "Product"}
          </IndexTable.Cell>
          <IndexTable.Cell>
              <Button onClick={() => copyTo(snippet)}>Copy Snippet</Button>            
          </IndexTable.Cell>
          
          <IndexTable.Cell>
            {dayjs(createdAt).format("MMMM D, YYYY")}
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Button onClick={() => { navigate(`/mypages/${id}`); }}>Edit</Button>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    }
  );

  /* A layout for small screens, built using Polaris components */
  return (
    <Card>
      {isSmallScreen ? (
        smallScreenMarkup
      ) : (
        <IndexTable
          resourceName={resourceName}
          itemCount={QRCodes.length}
          headings={[
            { title: "ID"},
            { title: "Title" },
            { title: "Type" },
            { title: "Snippet" },

            { title: "Date created" },
            { title: "Action" },
          ]}
          selectable={false}
          loading={loading}
        >
          {rowMarkup}
        </IndexTable>
      )}
      <Frame>
      {toastMarkup}
    </Frame>
    </Card>
    
  );
}

/* A function to truncate long strings */
function truncate(str, n) {
  return str.length > n ? str.substr(0, n - 1) + "…" : str;
}
