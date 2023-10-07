import { Page, EmptyState, Button } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback } from "react";
import { useAuthenticatedFetch, useAppQuery } from "../../hooks";

export default function ManageCode() {
  const breadcrumbs = [{ content: "blocks", url: "/" }];
  const fetch = useAuthenticatedFetch();
  var charge_url = "";

  var has_checked = false;

  const [paid_status, setPaidStatus] = useState("Loading...");
  const handlePaidChange = useCallback((a, val) => {
    setPaidStatus(a);
  });
  const [btnSub, setBtnSub] = useState(null);
  const handleBtnSub = useCallback((a, val) => {
    setBtnSub(a);
  });


  const onPlan = useCallback(async () => {
        console.log("check plan");
        const parsedBody = {ppp: "oooo"};
        const url = "/api/checkplan";
        const method = "POST";
        const response = await fetch(url, {
          method,
          body: JSON.stringify(parsedBody),
          headers: { "Content-Type": "application/json" },
        });
        console.log(response);
        if (response.ok) {
          has_checked = true;
         // makeClean();
          const ret = await response.json();
          console.log(ret);
          if(typeof ret.url != "undefined"){
            charge_url = ret.url
          }

          if(ret.paid){
            handlePaidChange("Status: Paid");
          }else{
            handlePaidChange("Status: Not Paid");
            handleBtnSub({content: 'Subscribe', onAction: goToPay});
          }


          /* if this is a new QR code, then save the QR code and navigate to the edit page; this behavior is the standard when saving resources in the Shopify admin */
        
            // navigate(`/qrcodes/${QRCode.id}`);
           // navigate(`/mypages/${QRCode.id}`);
            /* if this is a QR code update, update the QR code state in this component */
        
            // setQRCode(QRCode);
          
        }
      }, []);

if(! has_checked){
  onPlan();
}


const goToPay = useCallback(async() => {
  if(charge_url != ""){
    window.parent.location.href = charge_url;
  }
    
});



  return (
    <Page>
      <TitleBar
        title="My Subscription"
        
        primaryAction={null}
      />
        <EmptyState
          heading="Simple Plan"
          action={btnSub}
          secondaryAction={{
            content: paid_status,
            url: '',
          }}
        >
          <p>Plan info will be showed there.</p>
        </EmptyState>
      
    </Page>
  );
}
