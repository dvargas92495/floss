import { Issue, Contract } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useCallback, useState } from "react";
import { API_URL } from "../../utils/client";
import axios from "axios";
import marked from "marked";
import ContractList from "../../components/ContractList";
import CreateGithubContractDialog from "../../components/CreateGithubContractDialog";
import {
  DataLoader,
  ExternalLink,
  H2,
  H5,
  VerticalGridContent,
} from "@dvargas92495/ui";

const IssuePage = () => {
  const [issue, setIssue] = useState<Issue>({
    link: "",
    title: "",
    body: "",
    state: "open",
    contracts: [] as Contract[],
  });
  const fetchIssue = useCallback(() => {
    const query = new URLSearchParams(window.location.search);
    const link = query.get("id");
    return axios
      .get(`${API_URL}/issue?link=${link}`)
      .then((issue) => setIssue(issue.data as Issue));
  }, [setIssue]);
  return (
    <Layout title={`Issue Detail | Floss`}>
      <DataLoader loadAsync={fetchIssue}>
        <VerticalGridContent>
          <H2>
            <ExternalLink href={issue.link}>{issue.title}</ExternalLink>
          </H2>
          <H5>
            ${issue.contracts.reduce((n, c) => c.reward + n, 0)} -{" "}
            {issue.state.toUpperCase()}
          </H5>
          <div dangerouslySetInnerHTML={{ __html: marked(issue.body) }} />
          <ContractList items={issue.contracts} />
          <CreateGithubContractDialog
            fetchContracts={fetchIssue}
            buttonText={"Fund Issue"}
            link={issue.link}
          />
        </VerticalGridContent>
      </DataLoader>
    </Layout>
  );
};

export default IssuePage;
