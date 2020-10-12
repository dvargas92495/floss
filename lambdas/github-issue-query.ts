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
        const successfulCompletions = await Promise.all(completionPromises)
          .then((r) => {
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
                .then((si) => ({
                  amount: (parsePriority(c.Attributes).reward || 0) * 100,
                  currency: "usd",
                  customer: si.customer as string,
                  payment_method: si.payment_method as string,
                  off_session: true,
                  confirm: true,
                }))
            );
            return Promise.all(stripeSetups);
          })
          .then((r) =>
            Promise.all(r.map((pi) => stripe.paymentIntents.create(pi)))
          );

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
                .catch((e) => {
                  if (e.raw?.code === "charge_already_refunded") {
                    console.error(
                      `${e.raw.message} for Contract ${c.Attributes?.uuid.S}`
                    );
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
               
Successfully refunded ${successfulRefunds.length} contracts.
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
