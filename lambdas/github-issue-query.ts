import {
  DATE_FORMAT,
  dynamo,
  getActiveContracts,
  getAxiosByGithubLink,
  parsePriority,
  sendMeEmail,
  ses,
  stripe,
} from "../utils/lambda";
import isAfter from "date-fns/isAfter";
import parse from "date-fns/parse";
import { DynamoDB } from "aws-sdk";
import Stripe from "stripe";
import { differenceInDays } from "date-fns";

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
        const ghIssuesByLink = Object.fromEntries(
          issues.map((i) => [i.html_url, i])
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
              .retrieve(c.Attributes?.stripe.S || "", {
                expand: ["payment_method.customer"],
              })
              .then(async (si) => {
                const paymentMethod = si.payment_method as Stripe.PaymentMethod;
                const customer = paymentMethod.customer as Stripe.Customer;
                const initialAmount =
                  (parsePriority(c.Attributes).reward || 0) * 100;
                const customerBalance =
                  parseInt(customer.metadata.balance || "0") / 100;
                const balanceAmount = Math.min(customerBalance, initialAmount);
                if (balanceAmount > 0) {
                  await stripe.customers.update(customer.id, {
                    metadata: {
                      balance: customerBalance - balanceAmount,
                    },
                  });
                }
                try {
                  const amount = initialAmount + customer.balance;
                  const paymentAmount =
                    amount > 0
                      ? await stripe.paymentIntents
                          .create({
                            amount,
                            currency: "usd",
                            customer: si.customer as string,
                            payment_method: paymentMethod.id,
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
                } catch (e) {
                  console.error(e);
                  const stripeError = e as Stripe.StripeError;
                  if (stripeError.type === "StripeCardError") {
                    return {
                      customer: customer.id,
                      balanceAmount,
                      paymentAmount: 0,
                      error: stripeError.message,
                    };
                  }
                  return {
                    customer: customer.id,
                    balanceAmount,
                    paymentAmount: 0,
                    error: "Unknown Error",
                  };
                }
              })
          );
          return Promise.all(stripeSetups);
        });

        const today = new Date();
        const openIssues = ghIssues.filter((i) => i.lifecycle.S === "open");
        const overduePromises = openIssues
          .filter((i) => isAfter(today, getDueDate(i)))
          .map((Item) =>
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
        const { successfulRefunds, overduedContracts } = await Promise.all(
          overduePromises
        ).then((r) => {
          console.log(`${r.length} contracts were overdue.`);
          const overduedContracts = r.map((oc) =>
            ses
              .sendEmail({
                Destination: {
                  ToAddresses: [
                    oc.Attributes?.createdBy?.S || "dvargas92495@gmail.com",
                  ],
                },
                Message: {
                  Body: {
                    Text: {
                      Charset: "UTF-8",
                      Data: `The funding for project ${
                        ghIssuesByLink[oc.Attributes?.link?.S || ""].title
                      } has expired because the due date was today and it was not completed. We're really sorry, but inbound is really high right now.
                        
If you would like to fund the issue on RoamJS again with a new due date, visit https://roamjs.com/queue/${
                        (oc.Attributes?.link?.S || "").split(/\//g).slice(-1)[0]
                      }.

If you would like to work more individually with RoamJS on this project, reach out to support@roamjs.com about our freelancing rates.`,
                    },
                  },
                  Subject: {
                    Charset: "UTF-8",
                    Data: `Project Funding Expired for ${
                      ghIssuesByLink[oc.Attributes?.link?.S || ""].title
                    }`,
                  },
                },
                Source: "no-reply@floss.davidvargas.me",
              })
              .promise()
              .then(() => ({
                link: oc.Attributes?.link?.S,
                name: ghIssuesByLink[oc.Attributes?.link?.S || ""].title,
                by: oc.Attributes?.createdBy?.S,
                amount: parsePriority(oc.Attributes).reward,
              }))
          );
          const contractsToRefund = r.filter((c) =>
            c.Attributes?.stripe.S?.startsWith("pi_")
          );
          console.log(`Need to refund ${contractsToRefund.length} contracts.`);
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
                customer: pi.customer as string,
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
          return Promise.all([
            Promise.all(stripeRefunds),
            Promise.all(overduedContracts),
          ]).then(([successfulRefunds, overduedContracts]) => ({
            successfulRefunds,
            overduedContracts,
          }));
        });
        await sendMeEmail(
          `Floss Nightly Summary`,
          `
Successfully closed ${successfulCompletions.length} contracts.
${successfulCompletions
  .map(
    (completion) =>
      ` - Customer https://dashboard.stripe.com/customers/${
        completion.customer
      } ${
        completion.error
          ? `failed to pay due to ${completion.error}`
          : `paid ${completion.paymentAmount}`
      } and debited ${completion.balanceAmount}`
  )
  .join("\n")}

Successfully emailed ${overduedContracts.length} overdued contracts.
${overduedContracts.map(
  (oc) =>
    `- Customer ${oc.by}'s project [${oc.name}](${oc.link}) expired $${oc.amount} of funding.`
)}

Successfully refunded ${successfulRefunds.length} contracts.
${successfulRefunds.map(
  (refund) =>
    ` - Customer https://dashboard.stripe.com/customers/${refund.customer} refunded ${refund.amount}`
)}

Open Issues:
${openIssues
  .map((c) => ({ ...parsePriority(c), link: c.link.S }))
  .map((c) => ({
    ...c,
    dueDate: c.dueDate ? new Date(c.dueDate) : today,
    reward: c.reward || 0,
  }))
  .sort(({ dueDate: a, reward: ar }, { dueDate: b, reward: br }) =>
    a === b ? br - ar : new Date(a).valueOf() - new Date(b).valueOf()
  )
  .map(
    (c) =>
      `- Issue ${c.link} Expires $${c.reward} In ${differenceInDays(
        c.dueDate,
        today
      )} Days.`
  )
  .join("\n")}
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
