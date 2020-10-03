import axios from "axios";
import {
  dynamo,
  parsePriority,
  stripe,
} from "../utils/lambda";

export const handler = () =>
dynamo
.query({
  TableName: "FlossContracts",
  KeyConditionExpression: "priority >= :p and lifecycle = :s",
  IndexName: "lifecycle-priority-index",
  ExpressionAttributeValues: {
    ":p": {
      S: "0000-2020-10-02-2020-10-02",
    },
    ":s": {
      S: "active",
    },
  },
})
.promise()
.then((r) => {
    if(!r.Items) {
      return;
    }
    const contractsByLink = Object.fromEntries(r.Items.map((i) => [i.link.S, i]));
    const reqs = r.Items.map((i) =>
      i.link?.S
        ? axios(i.link.S.replace("github.com", "api.github.com/repos"))
        : Promise.resolve({} as any)
    );
    return Promise.all(reqs)
      .then((issues) => {
        const ghIssues = issues.map((i) => ({
          ...contractsByLink[i.data.html_url],
          link: { S: i.data.html_url },
          lifecycle: { S: i.data.state },
        }));
        const completions = ghIssues.filter((i) => i.lifecycle.S === "closed");
        const completionPromises = completions.map((Item) =>
          dynamo.putItem({ Item, TableName: "FlossContracts", ReturnValues: 'ALL_OLD' }).promise()
        );
        return Promise.all(completionPromises);
      })
      .then((r) => {
        console.log(`Completed ${r.length} contracts!`);
        const contractsToCharge = r.filter((c) =>
          c.Attributes?.stripe.S?.startsWith("seti_")
        );
        console.log(
          `Let's get paid for ${contractsToCharge.length} contracts!`
        );
        const stripeSetups = contractsToCharge.map((c) =>
          stripe.setupIntents
            .retrieve(c.Attributes?.stripe.S || "")
            .then((si) => ({
              amount: (parsePriority(c.Attributes).reward || 0)*100,
              currency: "usd",
              customer: si.customer as string,
              payment_method: si.payment_method as string,
              off_session: true,
              confirm: true,
            }))
        );
        return Promise.all(stripeSetups);
      })
      .then((r) => Promise.all(r.map((pi) => stripe.paymentIntents.create(pi))))
      .then(() => console.log("Successfully got paid!"))
      .catch((e) => console.error(e));
  });
