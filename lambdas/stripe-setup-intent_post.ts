import { APIGatewayEvent } from "aws-lambda";
import {
  dynamo,
  getEmailFromHeaders,
  getFlossUserByEmail,
  headers,
  stripe,
  toPriority,
} from "../utils/lambda";
import axios from "axios";
import { v4 } from "uuid";

export const handler = async (event: APIGatewayEvent) => {
  const {
    link,
    reward,
    dueDate,
    paymentMethod,
  }: {
    link: string;
    reward: number;
    dueDate: string;
    paymentMethod: string;
  } = JSON.parse(event.body || "{}");
  const reqHeaders = event.headers;
  const issue = await axios.get(
    link.replace("github.com", "api.github.com/repos")
  );
  if (issue.data.state !== "open") {
    return {
      statusCode: 400,
      body: `Issue ${link} is not open`,
      headers,
    };
  }

  const createdBy = await getEmailFromHeaders(reqHeaders.Authorization);
  const flossUser = await getFlossUserByEmail(createdBy);
  if (flossUser.Count === 0 || !flossUser.Items) {
    return {
      statusCode: 500,
      body: `Could not find Floss user for ${createdBy}`,
      headers,
    };
  }

  const customer = flossUser.Items[0].client.S || "";
  const uuid = v4();
  const putItemProps = (intentId: string) => ({
    Item: {
      uuid: {
        S: uuid,
      },
      stripe: {
        S: intentId,
      },
      link: {
        S: link,
      },
      lifecycle: {
        S: paymentMethod ? "active" : "pending",
      },
      priority: {
        S: toPriority({ reward, dueDate }),
      },
      createdBy: {
        S: createdBy,
      },
    },
    TableName: "FlossContracts",
  });
  return paymentMethod
    ? await stripe.setupIntents
        .create({
          customer,
          payment_method: paymentMethod,
        })
        .then((intent) =>
          dynamo
            .putItem(putItemProps(intent.id))
            .promise()
            .then(() => ({
              statusCode: 200,
              body: JSON.stringify({
                active: true,
              }),
              headers,
            }))
        )
    : await stripe.setupIntents
        .create({
          customer,
        })
        .then((intent) =>
          dynamo
            .putItem(putItemProps(intent.id))
            .promise()
            .then(() => ({
              statusCode: 200,
              body: JSON.stringify({
                client_secret: intent.client_secret,
                id: intent.id,
                active: false,
              }),
              headers,
            }))
        );
};
