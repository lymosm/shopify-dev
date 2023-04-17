import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Stack,
  Link,
  EmptyState,
  Heading,
} from "@shopify/polaris";
// import { TitleBar } from "@shopify/app-bridge-react";
import { useNavigate, TitleBar, Loading } from "@shopify/app-bridge-react";

import { trophyImage } from "../assets";

import { ProductsCard, MyList} from "../components";


export default function HomePage() {

  const navigate = useNavigate();

  return (
    <Page narrowWidth>
      <TitleBar title="Blog product show" primaryAction={null} />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack
              wrap={false}
              spacing="extraTight"
              distribution="trailing"
              alignment="center"
            >
              <Stack.Item fill>
                <TextContainer spacing="loose">
                  <Heading>Blog product show readme🎉</Heading>
                  <p>
                    1. Go to theme setting blogs template
                  </p>
                  <p>
                    2. select your product. And save the blog template.{" "}
                  </p>
                  <p>
                    3. create new blog for a blog template.{" "}
                  </p>
                </TextContainer>
              </Stack.Item>
              <Stack.Item>
                <div style={{ padding: "0 20px" }}>
                  <Image
                    source={trophyImage}
                    alt="Blog product show"
                    width={120}
                  />
                </div>
              </Stack.Item>
            </Stack>
          </Card>
        </Layout.Section>
       
      </Layout>
      
    </Page>
  );
}
