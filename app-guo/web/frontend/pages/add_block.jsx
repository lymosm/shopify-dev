import { Page } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { MyForm } from "../components";

export default function ManageCode() {
  const breadcrumbs = [{ content: "blocks", url: "/" }];

  return (
    <Page>
      <TitleBar
        title="Create new block"
        breadcrumbs={breadcrumbs}
        primaryAction={null}
      />
        <MyForm />
    </Page>
  );
}
