import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import Stripe from "stripe";
import { v4 } from "uuid";
import {
  activateContract,
  dynamo,
  headers,
  sendMeEmail,
  stripe,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    data: {
      object: {
        payment_intent,
        mode,
        metadata,
        customer,
        setup_intent,
        subscription,
        amount_total,
      },
    },
  }: { data: { object: Stripe.Checkout.Session } } = JSON.parse(
    event.body || "{}"
  );
  const payment_method =
    mode === "payment"
      ? await stripe.paymentIntents
          .retrieve(payment_intent as string)
          .then((s) => s.payment_method as string)
      : mode === "setup"
      ? await stripe.setupIntents
          .retrieve(setup_intent as string)
          .then((s) => s.payment_method as string)
      : mode === "subscription"
      ? await stripe.subscriptions
          .retrieve(subscription as string)
          .then((s) => s.default_payment_method as string)
      : "";
  const funding = (amount_total || 0) / 100;
  if (customer) {
    const customerId = customer as string;
    const customerObj = await stripe.customers
      .retrieve(customer as string)
      .then((c) => c as Stripe.Customer);
    const updateObj = {
      ...(customerObj.name
        ? {}
        : {
            name: await stripe.paymentMethods
              .retrieve(payment_method)
              .then((p) => p.billing_details.name || ""),
          }),
      ...(customerObj.invoice_settings.default_payment_method
        ? {}
        : {
            invoice_settings: {
              default_payment_method: payment_method,
            },
          }),
    };
    if (Object.keys(updateObj).length) {
      await stripe.customers.update(customerId, updateObj);
    }
    if (metadata?.project) {
      const uuid = v4();
      return dynamo
        .getItem({ TableName: "FlossProjects", Key: { uuid: { S: metadata.project } } })
        .promise()
        .then((r) =>
          dynamo
            .putItem({
              TableName: "FlossProjects",
              Item: {
                link: { S: `floss_${metadata.project}` },
                uuid: { S: uuid },
                funding: { N: `${funding}` },
                createdBy: { S: customerId },
                tenant: { S: r.Item?.tenant?.S },
              },
            })
            .promise()
        )
        .then(() =>
          sendMeEmail(
            "New Checkout Suceeded",
            `Customer ${
              customerObj.name || updateObj.name
            } just paid $${funding} for project ${metadata.project}!`
          ).then(() => ({
            statusCode: 204,
            body: JSON.stringify({}),
            headers,
          }))
        );
    }
  }
  if (metadata?.skipCallback === "true") {
    return sendMeEmail(
      "New Checkout Suceeded",
      `Customer https://dashboard.stripe.com/customers/${customer} just paid $${funding} from ${
        metadata?.source || "an unknown source"
      }!`
    ).then(() => ({
      statusCode: 204,
      body: JSON.stringify({}),
      headers,
    }));
  }
  switch (mode) {
    case "setup":
      return activateContract({
        id: setup_intent as string,
        payment_method,
        customer,
      });
    case "payment":
      return activateContract({
        id: payment_intent as string,
        payment_method,
        customer,
      });
    case "subscription":
      const { url, ...data } = metadata || {};
      return axios.post(url, data).then((r) => ({
        statusCode: r.status,
        body: JSON.stringify(r.data),
        headers: r.headers,
      }));
  }
};
