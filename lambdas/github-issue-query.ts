import axios from "axios";
import { getActiveContracts } from "./contracts_get";

export const handler = () => getActiveContracts().then(r => {
  const uuidsByLink = Object.fromEntries(r.map(i => [i.link, i.uuid]))
  const reqs = r.map(i => i.link ? axios(i.link.replace("github.com", "api.github.com/repos")) : Promise.resolve({} as any));
  return Promise.all(reqs).then(issues => {
    const ghIssues = issues.map(i => ({link: i.data.html_url, uuid: uuidsByLink[i.data.html_url],lifecycle: i.data.state}));
    const completions = ghIssues.filter(i => i.lifecycle === 'closed');
    const actives = ghIssues.filter(i => i.lifecycle === 'open');
    console.log("Contracts to Complete:");
    console.log(completions);
    console.log("Contracts that are still active:");
    console.log(actives);
  });
})
