import {
  DATE_FORMAT,
  dynamo,
  getActiveContracts,
  getAxiosByGithubLink,
  parsePriority,
  sendMeEmail,
  stripe,
} from "../utils/lambda";
import isAfter from "date-fns/isAfter";
import parse from "date-fns/parse";
import { DynamoDB } from "aws-sdk";
import Stripe from "stripe";

const getDueDate = (i: DynamoDB.AttributeMap) => {
  const dueDateString = parsePriority(i).dueDate;
  return dueDateString
    ? parse(dueDateString, DATE_FORMAT, new Date())
    : new Date();
};

export const handler = () =>
  getActiveContracts().then((r) => {
    if (!r.Items) {
      return;
    }
    const contractsByLink: { [key: string]: DynamoDB.AttributeMap[] } = {};
    r.Items.forEach((i) => {
      if (!i.link.S) {
        return;
      }
      if (contractsByLink[i.link.S]) {
        contractsByLink[i.link.S].push(i);
      } else {
        contractsByLink[i.link.S] = [i];
      }
    });
    const reqs = Object.keys(contractsByLink).map((i) =>
      getAxiosByGithubLink(i)
    );
    return Promise.all(reqs)
      .then(async (issues) => {
        const ghIssues = issues.flatMap((i) =>
          contractsByLink[i.html_url].map((c) => ({
            ...c,
            link: { S: i.html_url },
            lifecycle: { S: i.state },
          }))
        );
        const completions = ghIssues.filter((i) => i.lifecycle.S === "closed");
        const completionPromises = completions.map((Item) =>
          dynamo
            .putItem({
              Item,
              TableName: "FlossContracts",
              ReturnValues: "ALL_OLD",
            })
            .promise()
        );
        const successfulCompletions = await Promise.all(
          completionPromises
        ).then((r) => {
          console.log(`Completed ${r.length} contracts!`);
          const contractsToCharge = r.filter((c) =>
            c.Attributes?.stripe?.S?.startsWith("seti_")
          );
          console.log(
            `Let's get paid for ${contractsToCharge.length} contracts!`
          );
          const stripeSetups = contractsToCharge.map((c) =>
            stripe.setupIntents
              .retrieve(c.Attributes?.stripe.S || "")
              .then((si) =>
                stripe.customers
                  .retrieve(si.customer as string)
                  .then(async (cus) => {
                    if (cus.deleted) {
                      return {
                        customer: cus.id,
                        balanceAmount: 0,
                        paymentAmount: 0,
                      };
                    }
                    const customer = cus as Stripe.Customer;
                    const initialAmount =
                      (parsePriority(c.Attributes).reward || 0) * 100;
                    const balanceAmount =
                      customer.balance < 0
                        ? await stripe.customers
                            .createBalanceTransaction(customer.id, {
                              amount: Math.min(
                                -customer.balance,
                                initialAmount
                              ),
                              currency: "usd",
                              description: `Funding for ${c.Attributes?.link?.S}`,
                            })
                            .then((transaction) => transaction.amount / 100)
                        : 0;
                    const amount = initialAmount + customer.balance;
                    const paymentAmount =
                      amount > 0
                        ? await stripe.paymentIntents
                            .create({
                              amount,
                              currency: "usd",
                              customer: si.customer as string,
                              payment_method: si.payment_method as string,
                              off_session: true,
                              confirm: true,
                            })
                            .then((pi) => pi.amount / 100)
                        : 0;
                    return {
                      customer: customer.id,
                      balanceAmount,
                      paymentAmount,
                    };
                  })
              )
          );
          return Promise.all(stripeSetups);
        });

        const today = new Date();
        const overdues = ghIssues.filter(
          (i) => i.lifecycle.S === "open" && isAfter(today, getDueDate(i))
        );
        const overduePromises = overdues.map((Item) =>
          dynamo
            .putItem({
              Item: {
                ...Item,
                lifecycle: {
                  S: "overdue",
                },
              },
              TableName: "FlossContracts",
              ReturnValues: "ALL_OLD",
            })
            .promise()
        );
        const successfulRefunds = await Promise.all(overduePromises).then(
          (r) => {
            console.log(`${r.length} contracts were overdue.`);
            const contractsToRefund = r.filter((c) =>
              c.Attributes?.stripe.S?.startsWith("pi_")
            );
            console.log(
              `Need to refund ${contractsToRefund.length} contracts.`
            );
            const stripeRefunds = contractsToRefund.map((c) =>
              stripe.refunds
                .create({
                  payment_intent: c.Attributes?.stripe.S,
                })
                .then((sr) =>
                  stripe.paymentIntents.retrieve(sr.payment_intent as string)
                )
                .then((pi) => ({
                  amount: pi.amount / 100,
                  customer: pi.customer,
                }))
                .catch((e) => {
                  if (e.raw?.code === "charge_already_refunded") {
                    console.error(
                      `${e.raw.message} for Contract ${c.Attributes?.uuid.S}`
                    );
                    return { amount: 0, customer: "" };
                  } else {
                    throw new Error(e);
                  }
                })
            );
            return Promise.all(stripeRefunds);
          }
        );
        await sendMeEmail(
          `Floss Nightly Summary`,
          `
Successfully closed ${successfulCompletions.length} contracts.
${successfulCompletions.map(
  (completion) =>
    ` - Customer https://dashboard.stripe.com/customers/${completion.customer} paid ${completion.paymentAmount} and debited ${completion.balanceAmount}`
)}

Successfully refunded ${successfulRefunds.length} contracts.
${successfulRefunds.map(
  (refund) =>
    ` - Customer https://dashboard.stripe.com/customers/${refund.customer} refunded ${refund.amount}`
)}
              `
        );
      })
      .catch((e) =>
        sendMeEmail(
          `Floss 500 Error: github-issue-query`,
          `
Response: ${JSON.stringify(e.response)}
                 
Message: ${e.message}
                `
        )
      );
  });
