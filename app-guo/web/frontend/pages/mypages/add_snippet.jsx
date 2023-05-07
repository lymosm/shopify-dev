import { Page } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { SnippetForm } from "../../components";

export default function ManageCode() {
  const breadcrumbs = [{ content: "blocks", url: "/" }];

  return (
    <Page>
      <TitleBar
        title="Create new snippet"
        
        primaryAction={null}
      />
        <SnippetForm />
    </Page>
  );
}
