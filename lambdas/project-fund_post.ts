import { APIGatewayEvent } from "aws-lambda";
import { dynamo, headers, stripe, verifyFlossClient } from "../utils/lambda";
import { Stripe } from "stripe";
import { v4 } from "uuid";

export const handler = async (event: APIGatewayEvent) => {
  const {
    uuid,
    name,
    funding,
    customer,
    successPath = "checkout?success=true",
    cancelPath = "checkout?cancel=true",
  }: {
    uuid: string;
    name: string;
    funding: number;
    customer?: string;
    successPath?: string;
    cancelPath?: string;
  } = JSON.parse(event.body || "{}");
  const reqHeaders = event.headers;
  if (!verifyFlossClient(reqHeaders.Authorization)) {
    return {
      statusCode: 401,
      body: "Unauthorized",
      headers,
    };
  }
  const origin = reqHeaders.Origin || reqHeaders.origin;
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

  const childUuid = v4();
  const amount = funding * 100;
  return payment_method && customer
    ? stripe.paymentIntents
        .create({
          customer,
          amount,
          payment_method,
          currency: "usd",
        })
        .then((p) => stripe.paymentIntents.confirm(p.id))
        .then(() =>
          dynamo
            .getItem({ TableName: "FlossProjects", Key: { uuid: { S: uuid } } })
            .promise()
            .then((r) =>
              dynamo
                .putItem({
                  TableName: "FlossProjects",
                  Item: {
                    link: { S: `floss_${uuid}` },
                    uuid: { S: childUuid },
                    funding: { N: `${funding}` },
                    customer: { S: customer },
                    tenant: { S: r.Item?.tenant?.S },
                  },
                })
                .promise()
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
          payment_intent_data: {
            setup_future_usage: "off_session",
          },
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: amount,
                product_data: {
                  name,
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            project: uuid,
          },
          success_url: `${origin}/${successPath}`,
          cancel_url: `${origin}/${cancelPath}`,
        })
        .then((session) => ({
          statusCode: 200,
          body: JSON.stringify({ id: session.id, active: false }),
          headers,
        }))
        .catch((e) => ({
          statusCode: 500,
          body: e.errorMessage || e.message,
          headers,
        }));
};
