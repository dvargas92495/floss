import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import { v4 } from "uuid";
import {
  dynamo,
  getFlossUserByEmail,
  headers,
  sendMeEmail,
  stripe,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { code } = JSON.parse(event.body || "{}");
  return axios
    .post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    )
    .then(async (r) => {
      const accessToken = r.data.access_token as string;
      const userResponse = await axios.get(
        `https://api.github.com/user?access_token=${accessToken}`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );
      const { email, name, avatar_url } = userResponse.data;
      if (!email) {
        return sendMeEmail(
          `Floss 500 Error: github-auth/post`,
          `
  Message: Could not find email for Github User
                     
  Response: ${JSON.stringify(userResponse.data)}
          `
        ).then(() => ({
          statusCode: 500,
          body: "Could not find email for Github User",
          headers,
        }));
      }
      const dynamoResponse = await getFlossUserByEmail(email);

      if (!dynamoResponse.Items || dynamoResponse.Count === 0) {
        const client = await stripe.customers.create({
          email,
          name,
        });
        const uuid = v4();
        await dynamo
          .putItem({
            Item: {
              uuid: {
                S: uuid,
              },
              client: {
                S: client.id,
              },
              email: {
                S: email,
              },
              accessToken: {
                S: accessToken,
              },
            },
            TableName: "FlossUsers",
          })
          .promise();
      } else {
        const Item = dynamoResponse.Items[0];
        Item.accessToken.S = accessToken;
        await dynamo
          .putItem({
            Item,
            TableName: "FlossUsers",
          })
          .promise();
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ email, name, accessToken, avatar_url }),
        headers,
      };
    })
    .catch((e) =>
      sendMeEmail(
        `Floss 500 Error: github-auth/post`,
        `
Response: ${JSON.stringify(e.response)}
                   
Message: ${e.message}
        `
      ).then(() => ({
        statusCode: 500,
        body: e.response?.data || e.message,
        headers,
      }))
    );
};
