import { useState, useCallback } from "react";
import { UploadOutlined } from '@ant-design/icons';
import { Button as ButtonAnt, message, Upload } from 'antd';
import {
  Banner,
  Card,
  Form,
  FormLayout,
  TextField,
  Tag,
  Button,
  ChoiceList,
  Select,
  Thumbnail,
  Icon,
  Stack,
  TextStyle,
  Layout,
  EmptyState,
  RadioButton,
  DropZone
} from "@shopify/polaris";
import {
  ContextualSaveBar,
  ResourcePicker,
  useAppBridge,
  useNavigate,
} from "@shopify/app-bridge-react";
import { ImageMajor, AlertMinor } from "@shopify/polaris-icons";
// import { getSessionToken } from "@shopify/app-bridge/utilities";
// import createApp from "@shopify/app-bridge";
// import shopify from "../../snippetShopify.js";



/* Import the useAuthenticatedFetch hook included in the Node app template */
import { useAuthenticatedFetch, useAppQuery } from "../hooks";

/* Import custom hooks for forms */
import { useForm, useField, notEmptyString } from "@shopify/react-form";

const NO_DISCOUNT_OPTION = { label: "No discount", value: "" };

/*
  The discount codes available in the store.

  This variable will only have a value after retrieving discount codes from the API.
*/
const DISCOUNT_CODES = {};

export function SnippetForm({ QRCode: InitialQRCode }) {
  const [QRCode, setQRCode] = useState(InitialQRCode);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(QRCode?.product);
  const navigate = useNavigate();
  const appBridge = useAppBridge();
  const fetch = useAuthenticatedFetch();
  const deletedProduct = QRCode?.product?.title === "Deleted product";
  
  /*
  const apps = createApp({
    apiKey: "cea5899eeb25a81856ce4f691daed195",
  });
  */
 // console.log(shopify);
  
// const token = getSessionToken(app);
 // console.log(token);
  const props = {
    name: 'file',
   // action: "/api/image-upload",
    action: "/apis/image-upload",
    headers: {
      Authorization: 'Bearer ',
    },
    onChange(info) {
      
      if (info.file.status !== 'uploading') {
       // console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        // console.log(info);
        message.success(`${info.file.name} file uploaded successfully`);
        console.log("upload success");
        uploadCallback(info.file.response.url);
        console.log("upload end");
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  /*
    This is a placeholder function that is triggered when the user hits the "Save" button.

    It will be replaced by a different function when the frontend is connected to the backend.
  */
  const onSubmit = useCallback(
    (body) => {
      (async () => {
        console.log("go to submit3");
        const parsedBody = body;
        parsedBody.destination = parsedBody.destination[0];
        const QRCodeId = QRCode?.id;
        /* construct the appropriate URL to send the API request to based on whether the QR code is new or being updated */
        const url = QRCodeId ? `/api/qrcodes/${QRCodeId}` : "/api/qrcodes";
        /* a condition to select the appropriate HTTP method: PATCH to update a QR code or POST to create a new QR code */
        const method = QRCodeId ? "PATCH" : "POST";
        /* use (authenticated) fetch from App Bridge to send the request to the API and, if successful, clear the form to reset the ContextualSaveBar and parse the response JSON */
        const response = await fetch(url, {
          method,
          body: JSON.stringify(parsedBody),
          headers: { "Content-Type": "application/json" },
        });
        console.log("end");
        console.log(response);
        if (response.ok) {
          makeClean();
          const QRCode = await response.json();
          console.log(QRCode);
          if(typeof QRCode.url != "undefined"){
            window.parent.location.href = QRCode.url;
            return ;
          }
          /* if this is a new QR code, then save the QR code and navigate to the edit page; this behavior is the standard when saving resources in the Shopify admin */
          if (!QRCodeId) {
            // navigate(`/qrcodes/${QRCode.id}`);
            navigate(`/mypages/${QRCode.id}`);
            /* if this is a QR code update, update the QR code state in this component */
          } else {
            setQRCode(QRCode);
          }
        }
      })();
      return { status: "success" };
    },
    [QRCode, setQRCode]
  );

  var img_url_ipt = "";
  /*
    Sets up the form state with the useForm hook.

    Accepts a "fields" object that sets up each individual field with a default value and validation rules.

    Returns a "fields" object that is destructured to access each of the fields individually, so they can be used in other parts of the component.

    Returns helpers to manage form state, as well as component state that is based on form state.
  */
  const {
    fields: {
      title,
      productId,
      variantId,
      handle,
      discountCode,
      destination,
      img_link,
      img_url,
      frame_height,
      m_frame_height,
      type,
    },
    dirty,
    reset,
    submitting,
    submit,
    makeClean,
  } = useForm({
    fields: {
      title: useField({
        value: QRCode?.title || "",
        validates: [notEmptyString("Please name your snippet")],
      }),
      /*
      productId: useField({
        value: deletedProduct ? "Deleted product" : QRCode?.product?.id || "",
        validates: [notEmptyString("Please select a product")],
      }),
      */
      variantId: useField(QRCode?.variantId || ""),
      productId: useField(QRCode?.product?.id || ""),
      handle: useField(QRCode?.handle || ""),
      destination: useField(
        QRCode?.destination ? [QRCode.destination] : ["product"]
      ),
      discountCode: useField(QRCode?.discountCode || ""),
      img_link: useField(QRCode?.img_link || ""),
      img_url: useField(QRCode?.img_url || ""),
      frame_height: useField(QRCode?.frame_height || 400),
      m_frame_height: useField(QRCode?.m_frame_height || 600),
      type: useField(QRCode?.type || 1),
    },
    onSubmit,
  });

  const QRCodeURL = QRCode
    ? new URL(`/qrcodes/${QRCode.id}/image`, location.toString()).toString()
    : null;

  /*
    This function is called with the selected product whenever the user clicks "Add" in the ResourcePicker.

    It takes the first item in the selection array and sets the selected product to an object with the properties from the "selection" argument.

    It updates the form state using the "onChange" methods attached to the form fields.

    Finally, closes the ResourcePicker.
  */
  const handleProductChange = useCallback(({ selection }) => {
    setSelectedProduct({
      title: selection[0].title,
      images: selection[0].images,
      handle: selection[0].handle,
    });
    productId.onChange(selection[0].id);
    variantId.onChange(selection[0].variants[0].id);
    handle.onChange(selection[0].handle);
    setShowResourcePicker(false);
  }, []);

  /*
    This function updates the form state whenever a user selects a new discount option.
  */
  const handleDiscountChange = useCallback((id) => {
    discountId.onChange(id);
    discountCode.onChange(DISCOUNT_CODES[id] || "");
  }, []);

  /*
    This function is called when a user clicks "Select product" or cancels the ProductPicker.

    It switches between a show and hide state.
  */
  const toggleResourcePicker = useCallback(
    () => setShowResourcePicker(!showResourcePicker),
    [showResourcePicker]
  );

  /*
    This is a placeholder function that is triggered when the user hits the "Delete" button.

    It will be replaced by a different function when the frontend is connected to the backend.
  */
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteQRCode = useCallback(async () => {
      reset();
      /* The isDeleting state disables the download button and the delete QR code button to show the user that an action is in progress */
      setIsDeleting(true);
      const response = await fetch(`/api/qrcodes/${QRCode.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    
      if (response.ok) {
        navigate(`/`);
      }
    }, [QRCode]);
    

  /*
    This function runs when a user clicks the "Go to destination" button.

    It uses data from the App Bridge context as well as form state to construct destination URLs using the URL helpers you created.
  */
  const goToDestination = useCallback(() => {
    if (!selectedProduct) return;
    const data = {
      host: appBridge.hostOrigin,
      productHandle: handle.value || selectedProduct.handle,
      discountCode: discountCode.value || undefined,
      variantId: variantId.value,
    };

    const targetURL =
      deletedProduct || destination.value[0] === "product"
        ? productViewURL(data)
        : productCheckoutURL(data);

    window.open(targetURL, "_blank", "noreferrer,noopener");
  }, [QRCode, selectedProduct, destination, discountCode, handle, variantId]);

  /*
    This array is used in a select field in the form to manage discount options.

    It will be extended when the frontend is connected to the backend and the array is populated with discount data from the store.

    For now, it contains only the default value.
  */
  const isLoadingDiscounts = true;
  const discountOptions = [NO_DISCOUNT_OPTION];

  const type_radio = (typeof QRCode != "undefined" && QRCode != null && typeof QRCode.type != "undefined" && QRCode.type == 2) ? "image_radio" : "product_radio";
  const [value, setValue] = useState(type_radio);

  let product_init_val = "block";
  let image_init_val = "none"; 

  if(type_radio == "image_radio"){
    image_init_val = "block";
    product_init_val = "none";
   }else{
    image_init_val = "none";
    product_init_val = "block";
   }
  

  /*
  const handleChange = useCallback(
    (_, newValue) => setValue(newValue),
    [],
  );
  */
 // var show_product = "block";
 //  var  show_image = "none";
 const [show_product, setProdcutShow] = useState(product_init_val);
 const [show_image, setImageShow] = useState(image_init_val);
  const handleChange = useCallback(
    (a, val) => {
      setValue(val);
      if(val == "image_radio"){
       // show_image = "block";
       // show_product = "none";
       setImageShow("block");
       setProdcutShow("none");
       type.onChange(2);
      }else{
       // show_image = "none";
       // show_product = "block";
       setImageShow("none");
       setProdcutShow("block");
       type.onChange(1);
      }
    }
  );


  /*
    These variables are used to display product images, and will be populated when image URLs can be retrieved from the Admin.
  */
  const imageSrc = selectedProduct?.images?.edges?.[0]?.node?.url;
  const originalImageSrc = selectedProduct?.images?.[0]?.originalSrc;
  const altText =
    selectedProduct?.images?.[0]?.altText || selectedProduct?.title;

  
  // image upload
  const [files, setFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const hasError = rejectedFiles.length > 0;
  const multi_file = false;

  const handleDrop = useCallback(
    (_droppedFiles, acceptedFiles, rejectedFiles) => {
      setFiles((files) => [...files, ...acceptedFiles]);
      setRejectedFiles(rejectedFiles);
    },
    [],
  );

// [img_url_ipt, setImageUrl] = useState("");
  const uploadCallback = useCallback((url) => {
    console.log("url: " + url);
   // setImageUrl(url);
   img_url.onChange(url);
    console.log("img_url: " + img_url);
  });

  const fileUpload = !files.length && <DropZone.FileUpload />;
  const uploadedFiles = files.length > 0 && (
      <div>
      {files.map((file, index) => (
          <Thumbnail
            size="small"
            alt={file.name}
            source={window.URL.createObjectURL(file)}
          />
          
      ))}
      </div>
  );

  const errorMessage = hasError && (
    <Banner
      title="The following images couldn’t be uploaded:"
      status="critical"
    >
      <List type="bullet">
        {rejectedFiles.map((file, index) => (
          <List.Item key={index}>
            {`"${file.name}" is not supported. File type must be .gif, .jpg, .png or .svg.`}
          </List.Item>
        ))}
      </List>
    </Banner>
  );

  /* The form layout, created using Polaris and App Bridge components. */
  return (
    <Stack vertical>
      {deletedProduct && (
        <Banner
          title="The product for this QR code no longer exists."
          status="critical"
        >
          <p>
            Scans will be directed to a 404 page, or you can choose another
            product for this QR code.
          </p>
        </Banner>
      )}
      <Layout>
        <Layout.Section>
          <Form>
            <ContextualSaveBar
              saveAction={{
                label: "Save",
                onAction: submit,
                loading: submitting,
                disabled: submitting,
              }}
              discardAction={{
                label: "Discard",
                onAction: reset,
                loading: submitting,
                disabled: submitting,
              }}
              visible={dirty}
              fullWidth
            />
            <FormLayout>
              <RadioButton
                label="Product"
                helpText=""
                checked={value === 'product_radio'}
                id="product_radio"
                name="type"
                onChange={handleChange}
              />
              <RadioButton
                label="Image"
                helpText=""
                id="image_radio"
                name="type"
                checked={value === 'image_radio'}
                onChange={handleChange}
              />

              <Card sectioned title="Title">
                <TextField
                  {...title}
                  label="Title"
                  labelHidden
                  helpText="a title you can remember"
                />
                <TextField
                  {...frame_height}
                  label="Frame Height"
                  labelHidden
                  helpText="a frame height in PC"
                />
                <TextField
                  {...m_frame_height}
                  label="Mobile Frame Height"
                  labelHidden
                  helpText="a frame height in mobile"
                />
                <Tag>
                Please set the height carefully, and you have to replace the latest snippet to the position of the ads bar of the page after each change.
                </Tag>
              </Card>

              
              <div id="product-box" style={{display: show_product}}>
              <Card
                title="Product"
                actions={[
                  {
                    content: productId.value
                      ? "Change product"
                      : "Select product",
                    onAction: toggleResourcePicker,
                  },
                ]}
              >
                <Card.Section>
                  {showResourcePicker && (
                    <ResourcePicker
                      resourceType="Product"
                      showVariants={false}
                      selectMultiple={false}
                      onCancel={toggleResourcePicker}
                      onSelection={handleProductChange}
                      open
                    />
                  )}
                  {productId.value ? (
                    <Stack alignment="center">
                      {imageSrc || originalImageSrc ? (
                        <Thumbnail
                          source={imageSrc || originalImageSrc}
                          alt={altText}
                        />
                      ) : (
                        <Thumbnail
                          source={ImageMajor}
                          color="base"
                          size="small"
                        />
                      )}
                      <TextStyle variation="strong">
                        {selectedProduct.title}
                      </TextStyle>
                    </Stack>
                  ) : (
                    <Stack vertical spacing="extraTight">
                      <Button onClick={toggleResourcePicker}>
                        Select product
                      </Button>
                      {productId.error && (
                        <Stack spacing="tight">
                          <Icon source={AlertMinor} color="critical" />
                          <TextStyle variation="negative">
                            {productId.error}
                          </TextStyle>
                        </Stack>
                      )}
                    </Stack>
                  )}
                </Card.Section>
                
              </Card>
              </div>

              <div id="image-link-box" style={{display: show_image}}>
              
              <Card sectioned title="Image Info">
                <Upload {...props}>
                  <ButtonAnt icon={<UploadOutlined />}>Click to Upload</ButtonAnt>
                </Upload>
                <input type="hidden" name="img_url" value={{img_url}}></input>
                
                <br/>
                <TextField
                  {...img_link}
                  label="Image Link"
                  placeholder="Image Link(https://)"
                  labelHidden
                  helpText=""
                />
              </Card>
              </div>
              
            </FormLayout>
          </Form>
        </Layout.Section>
        
        <Layout.Section>
          {QRCode?.id && (
            <Button
              outline
              destructive
              onClick={deleteQRCode}
              loading={isDeleting}
            >
              Delete Snippet
            </Button>
          )}
        </Layout.Section>
      </Layout>
    </Stack>
  );
}

/* Builds a URL to the selected product */
function productViewURL({ host, productHandle, discountCode }) {
  const url = new URL(host);
  const productPath = `/products/${productHandle}`;

  /*
    If a discount is selected, then build a URL to the selected discount that redirects to the selected product: /discount/{code}?redirect=/products/{product}
  */
  if (discountCode) {
    url.pathname = `/discount/${discountCode}`;
    url.searchParams.append("redirect", productPath);
  } else {
    url.pathname = productPath;
  }

  return url.toString();
}

/* Builds a URL to a checkout that contains the selected product */
function productCheckoutURL({ host, variantId, quantity = 1, discountCode }) {
  const url = new URL(host);
  const id = variantId.replace(
    /gid:\/\/shopify\/ProductVariant\/([0-9]+)/,
    "$1"
  );

  url.pathname = `/cart/${id}:${quantity}`;

  /* Builds a URL to a checkout that contains the selected product with a discount code applied */
  if (discountCode) {
    url.searchParams.append("discount", discountCode);
  }

  return url.toString();
}
