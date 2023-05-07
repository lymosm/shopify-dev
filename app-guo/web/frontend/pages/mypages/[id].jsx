import { Card, Page, Layout, SkeletonBodyText } from "@shopify/polaris";
import { Loading, TitleBar } from "@shopify/app-bridge-react";
import { SnippetForm } from "../../components";
import { useParams } from "react-router-dom";
import { useAppQuery } from "../../hooks";

export default function QRCodeEdit() {
  const breadcrumbs = [{ content: "Snippet", url: "/" }];

  /*
     These are mock values.
     Set isLoading to false to preview the page without loading markup.
  */
 /*
  const isLoading = true;
  const isRefetching = false;
  const QRCode = {
    createdAt: "2022-06-13",
    destination: "checkout",
    title: "My first QR code",
    product: {}
  };
  */
  const { id } = useParams();
  /*
  Fetch the QR code.
  useAppQuery uses useAuthenticatedQuery from App Bridge to authenticate the request.
  The backend supplements app data with data queried from the Shopify GraphQL Admin API.
*/
const {
  data: QRCode,
  isLoading,
  isRefetching,
} = useAppQuery({
  url: `/api/qrcodes/${id}`,
  reactQueryOptions: {
    /* Disable refetching because the QRCodeForm component ignores changes to its props */
    refetchOnReconnect: false,
  },
});
console.log("333333");
console.log(QRCode);
  /* Loading action and markup that uses App Bridge and Polaris components */
  if (isLoading || isRefetching) {
    return (
      <Page>
        <TitleBar
          title="Edit Snippet"
          breadcrumbs={breadcrumbs}
          primaryAction={null}
        />
        <Loading />
        <Layout>
          <Layout.Section>
            <Card sectioned title="Title">
              <SkeletonBodyText />
            </Card>
            <Card title="Product">
              <Card.Section>
                <SkeletonBodyText lines={1} />
              </Card.Section>
              <Card.Section>
                <SkeletonBodyText lines={3} />
              </Card.Section>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar
        title="Edit Snippet"
        breadcrumbs={breadcrumbs}
        primaryAction={null}
      />
      <SnippetForm QRCode={QRCode} />
    </Page>
  );
}
