import axios from "axios";
import { dynamo, getActiveContracts } from "../utils/lambda";

export const handler = () =>
  getActiveContracts().then((r) => {
    const contractsByLink = Object.fromEntries(r.map((i) => [i.link, i]));
    const reqs = r.map((i) =>
      i.link
        ? axios(i.link.replace("github.com", "api.github.com/repos"))
        : Promise.resolve({ data: process.env.PERSONAL_ACCESS_TOKEN } as any)
    );
    return Promise.all(reqs)
      .then((issues) => {
        const ghIssues = issues.map((i) => ({
          link: { S: i.data.html_url },
          uuid: { S: contractsByLink[i.data.html_url].uuid },
          lifecycle: { S: i.data.state },
          reward: { N: contractsByLink[i.data.html_url].reward },
          dueDate: { S: contractsByLink[i.data.html_url].dueDate },
        }));
        const completions = ghIssues.filter((i) => i.lifecycle.S === "closed");
        const completionPromises = completions.map((Item) =>
          dynamo.putItem({ Item, TableName: "FlossContracts" }).promise()
        );
        return Promise.all(completionPromises);
      })
      .then((r) => console.log(`Completed ${r.length} Contracts!`));
  });
