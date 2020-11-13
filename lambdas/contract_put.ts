import { APIGatewayEvent } from "aws-lambda";
import Stripe from "stripe";
import { activateContractByStripeId, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    id,
    card,
  }: {
    id: string;
    card: Stripe.SetupIntentConfirmParams.PaymentMethodOptions.Card;
  } = JSON.parse(event.body || "{}");
  if (!!card) {
    await stripe.setupIntents.confirm(id, {
      payment_method_options: {
        card,
      },
    });
  }
  return activateContractByStripeId(id);
};
