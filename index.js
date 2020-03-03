const express = require('express')
const bodyParser = require('body-parser')
const oauthClient = require('client-oauth2')
const  nodefetch =  require('node-fetch')
const request = require('request')
const app = express() 
const port =  process.env.PORT || 3000
app.use(bodyParser.json())
app.post('/initiatewf', async(req,res)=>{
    var division = req.body.division,
        compcode = req.body.companyCode,
        userId = req.body.userID,
        email = req.body.email,
        bunit = req.body.Bunit,
        name = req.body.name;
    
    const businessrules = async function (compcode,bunit,division){
      const body_br = {
        "RuleServiceId": "8cb1627e3afd4c508bd398357c1ca59e",
        "Vocabulary": [{"employmentInfo":
      {"compcode" : compcode,
       "businessUnit" : bunit,
       "division" : division
      }
        }
         
        ]
      };
      const  host_url = 'https://bpmruleruntime.cfapps.us10.hana.ondemand.com/rules-service/rest/v2/workingset-rule-services';
      const accessToken = await accessTokenFetch('https://sudipdev.authentication.us10.hana.ondemand.com/oauth/token','sb-clone-50f8b5bb-0dbe-430f-a287-6dd5740c803b!b4250|bpmrulebroker!b2018','3SlRJsEfsuJyF61evv6YuASmQS0=');
      const result = await nodefetch (host_url,{
          method: 'POST',
          body:    JSON.stringify(body_br),
          headers: { 'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken, 
          Accept : 'application/json' }

    });
    const output = await result.json();
    return output;

    }


    const accessTokenFetch = async function (url,clientId,clientSecret){

        var oautClient = new oauthClient({
            accessTokenUri: url,
            clientId: clientId,
            clientSecret: clientSecret,
            scopes: []
        });

        var accessToken = (await oautClient.owner.getToken('<SCP EMAIL>','<SCP Password>')).accessToken;

        return accessToken;
        



    }


const initiatetask = async function (reqbody){
    const wfbody = {
        "definitionId": "reswfs",
        "context": reqbody
      }

    const accessToken = await accessTokenFetch('https://sudipdev.authentication.us10.hana.ondemand.com/oauth/token',
    'sb-clone-fa8efa7f-c547-40aa-b99b-3584a203ae6c!b4250|workflow!b1774','XRpF365qA0mIVdq5vzF5jRBQswQ=');

    const  host_url = 'https://api.workflow-sap.cfapps.us10.hana.ondemand.com/workflow-service/rest/v1/workflow-instances';
    const result = await nodefetch (host_url,{
        method: 'POST',
        body:    JSON.stringify(wfbody),
        headers: { 'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken, 
        Accept : 'application/json' }

  });
  const output = await result.json();
    
      return output;

}

const createwfinstance = async function (reqbody){
    const brulesData = await businessrules(reqbody.companyCode,reqbody.Bunit,reqbody.division);
    const finalpayload = {
        "division": reqbody.division,
        "companyCode": reqbody.companyCode,
        "userID": reqbody.userID,
        "email": reqbody.email,
        "Bunit": reqbody.Bunit,
        "name": reqbody.Name,
        "financeApprover" : brulesData.Result[0].EmpApprovers.FinanceClearanceApprover,
        "ITApprover" : brulesData.Result[0].EmpApprovers.ITClearanceApprover,
        "AssetApprover" : brulesData.Result[0].EmpApprovers.OtherAssetClearanceApprover,
        "hrApprover":brulesData.Result[0].EmpApprovers.HrClearanceApprover
      }
    const wfinstance = await initiatetask (finalpayload);

    return wfinstance;

}


res.send(await createwfinstance (req.body) );





})



app.post('/sendcontract',(req,res)=>{

        var url = 'https://api.openconnectors.ext.hanatrial.ondemand.com/elements/api-v2/envelopes';
        var headers = {
            'authorization': 'User IXnG2ZC2lpg34sd6e2sNWCXTO0z7adZ7Vd1vXMAqldM=, Organization 927730555109ef5261b78359ba47c0d1, Element gg8vdijY0R0O7y0sBxk+OyK49mDCbhFzeMWiW/XJM50=',
         'accept': 'application/json',
         'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
        };
        var  bodyJson = {
            "compositeTemplates": [
              {
                "compositeTemplateId": "1",
                "inlineTemplates": [
                  {
                    "recipients": {
                      "carbonCopies": [
                        {
                          "email": req.body.email,
                          "name": req.body.name,
                          "recipientId": "2"
                        }
                      ],
                      "signers": [
                        {
                          "email": '<Signer Email>',
                          "name": '<Name>',
                          "recipientId": "1",
                          "roleName": "HR",
                          "tabs": {
                            "textTabs": []
                          }
                        }
                      ]
                    },
                    "sequence": "1"
                  }
                ],
                "serverTemplates": [
                  {
                    "sequence": "2",
                    "templateId": "4853187f-3b1e-4037-b867-fffaa7c83957"
                  }
                ]
              }
            ],
            "emailSubject": "Experience letter",
            "enableWetSign": "false",
            "status": "sent"
          };
        var options = { method: 'POST',
         url: url,
         headers: headers,
         formData: { envelope: JSON.stringify(bodyJson)}
         
          };
          request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
           
             res.send(body)
               
    
            }
            else {
                res.send('Error happened')
            }
        })

   
})

app.listen(port, () => { 
    console.log('Server is running on port '+port) 
  })