import { APIGatewayEvent } from "aws-lambda";
import {
  activateContract,
  dynamo,
  getStripeCustomer,
  headers,
  stripe,
  toPriority,
  validateGithubLink,
} from "../utils/lambda";
import { v4 } from "uuid";
import { Stripe } from "stripe";

export const handler = async (event: APIGatewayEvent) => {
  const {
    link,
    reward,
    dueDate,
    name = "Github Issue",
  }: {
    link: string;
    reward: number;
    dueDate: string;
    name?: string;
  } = JSON.parse(event.body || "{}");
  const response = await validateGithubLink(link);
  if (response.body) {
    return response;
  }

  const reqHeaders = event.headers;
  const origin = reqHeaders.Origin || reqHeaders.origin;
  const customer = await getStripeCustomer(reqHeaders.Authorization);
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
        S: "pending",
      },
      priority: {
        S: toPriority({ reward, dueDate }),
      },
    },
    TableName: "FlossContracts",
  });
  const payment_method =
    customer &&
    (await stripe.customers
      .retrieve(customer)
      .then((c) => c as Stripe.Customer)
      .then((c) =>
        c.invoice_settings.default_payment_method
          ? (c.invoice_settings.default_payment_method as string)
          : undefined
      ));

  return payment_method
    ? stripe.setupIntents
        .create({
          customer,
          payment_method,
        })
        .then((intent) =>
          dynamo
            .putItem(putItemProps(intent.id))
            .promise()
            .then(() =>
              activateContract({
                id: intent.id,
                payment_method,
                customer: customer as string,
              })
            )
        )
        .then(() => ({
          statusCode: 200,
          body: JSON.stringify({
            active: true,
          }),
          headers,
        }))
        .catch((e) => ({
          statusCode: 500,
          body: e.errorMessage || e.message,
          headers,
        }))
    : stripe.checkout.sessions
        .create({
          customer,
          payment_method_types: ["card"],
          mode: "setup",
          line_items: [],
          success_url: `${origin}/checkout?success=true`,
          cancel_url: `${origin}/checkout?cancel=true`,
        })
        .then((session) =>
          dynamo
            .putItem(
              putItemProps(
                (session.payment_intent || session.setup_intent) as string
              )
            )
            .promise()
            .then(() => ({
              statusCode: 200,
              body: JSON.stringify({ id: session.id, active: false }),
              headers,
            }))
        )
        .catch((e) => ({
          statusCode: 500,
          body: e.errorMessage || e.message,
          headers,
        }));
};
