import { APIGatewayEvent } from "aws-lambda";
import {
  dynamo,
  getStripeCustomer,
  headers,
  stripe,
  toPriority,
  validateGithubLink,
} from "../utils/lambda";
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
  const response = await validateGithubLink(link);
  if (response.body) {
    return response;
  }

  const { customer, email: createdBy} = await getStripeCustomer(reqHeaders.Authorization);
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
