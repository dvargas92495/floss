import axios from "axios";
import {
  dynamo,
  getActiveContracts,
  parsePriority,
  stripe,
} from "../utils/lambda";

export const handler = () =>
  getActiveContracts().then((r) => {
    const contractsByLink = Object.fromEntries(r.map((i) => [i.link, i]));
    const reqs = r.map((i) =>
      i.link
        ? axios(i.link.replace("github.com", "api.github.com/repos"))
        : Promise.resolve({} as any)
    );
    return Promise.all(reqs)
      .then((issues) => {
        const ghIssues = issues.map((i) => ({
          link: { S: i.data.html_url },
          uuid: { S: contractsByLink[i.data.html_url].uuid },
          lifecycle: { S: i.data.state },
          priority: { S: contractsByLink[i.data.html_url].priority },
        }));
        const completions = ghIssues.filter((i) => i.lifecycle.S === "closed");
        const completionPromises = completions.map((Item) =>
          dynamo.putItem({ Item, TableName: "FlossContracts" }).promise()
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
              amount: parsePriority(c.Attributes).reward || 0,
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
