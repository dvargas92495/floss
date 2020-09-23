import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import { v4 } from "uuid";
import { dynamo, headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { code } = JSON.parse(event.body || "{}");
  return axios
    .post("https://github.com/login/oauth/access_token", {
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code,
      accept: "json",
    })
    .then(async (r) => {
      const accessToken = r.data.substring("access_token=".length);
      const userResponse = await axios.get(
        `https://api.github.com/user?access_token=${accessToken}`
      );
      const { email, name } = userResponse.data;
      const dynamoResponse = await dynamo
        .query({
          TableName: "FlossUsers",
          KeyConditionExpression: "email = :e",
          IndexName: "email-index",
          ExpressionAttributeValues: {
            ":e": {
              S: email,
            },
          },
        })
        .promise();
      if (!dynamoResponse.Items || dynamoResponse.Count === 0) {
        const client = await stripe.customers.create();
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
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ email, name }),
        headers,
      };
    })
    .catch((e) => ({
      statusCode: 500,
      body: e.response?.data || e.message,
      headers,
    }));
};
