//import the library to send emails, have to be installed via npm/yarn
const sendGridMail = require("@sendgrid/mail");
//safely import the API key
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

//create an email and send it using SendGrid v3 Mail Send API
async function sendMailViaSendgridAPI(subject="Monday board task", email, emailText) {
  //create a message object to pass for the API
  const message = {
    to: email, //extra steps like escaping malicious characters can be done here if necessary
    from: "test@example.com", // Can be changed to your Monday account name/id/other relevant email
    subject: subject, //extra steps like escaping malicious characters can be done here if necessary
    text: emailText, //extra steps like escaping malicious characters can be done here if necessary
  };

  try {
    await sendGridMail
      .send(message)
      .then((response) => {
        //any further steps with response on success
        console.log(response[0].statusCode);
        console.log(response[0].headers);
      })
      .catch((error) => {
        //any further steps with response on error
        console.error(error);

        if (error.response) {
          console.error(error.response.body);
        }
      });
  } catch (error) {
    //any further steps on failed request
    console.error(error);

    if (error.response) {
      console.error(error.response.body);
    }
  }
};

//get an information from the monday board using required params
async function fetchMondayBoardData() {
  /*Define the query to filter/search for data. 
    As per requirements, no filters provided => no query_params necessary
    Board id has to be provided accordingly to the account
    Limit of 10 was used for the testing purposes
  */
  let query = `
    query {
      boards(ids: #board_id) {
        items_page(limit: 10){
          cursor
          items {
            id
            name
            column_values(ids: ["name", "client_email", "email_content"]) {
              id
              text
            }
          }
        }
      }
    }
  `;

  //Sending a request to the API with provided query. !!->Authorization should be provided from the .env file | typed manually(not recommended)
  try {
    const response = await fetch("https://api.monday.com/v2", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.MONDAY_API_KEY,  
        "API-version": "2023-10",
      },
      body: JSON.stringify({
        query: query,
      }),
    });
    //returning a valid JS object containing information from the board
    return await response.json();
  } catch(error) {
    //any further steps on failed request
    console.error(error);

    if (error.response) {
      console.error(error.response.body);
    }
  }
}

//function to get the board information and send emails using extracted data
async function sendEmailsUsingBoardData() {
  const mondayBoard = await fetchMondayBoardData();
  mondayBoard.data?.boards[0]?.items_page?.items?.forEach(async(item) => {
    //find the necessary values and save to allow mutations if needed
    const email = item?.column_values?.find((col) => col.id === "client_email")?.text || "default@mail.com/null";
    const emailContent = item?.column_values?.find(col => col.id === "email_content")?.text || "default text";
    //send emails using extracted information
    await sendMailViaSendgridAPI(item?.name, email, emailContent);
  });
}
//invoke where/if necessary
sendEmailsUsingBoardData();

/*Railway config to run the script every 4 hours Monday-Friday*/
// {
//   "build": {
//     "command": "npm install"
//   },
//   "deploy": {
//     "command": "node monday_challenge.js"
//   },
//   "schedule": [
//     {
//       "command": "node monday_challenge.js",
//       "cron": "0 */4 * * 1-5"
//     }
//   ]
// }