import { Contract } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useCallback, useState } from "react";
import { API_URL } from "../../utils/client";
import axios from "axios";
import { DataLoader, H1, H5, ExternalLink, Subtitle } from "@dvargas92495/ui";

const GithubDisplay = ({ link }: { link: string }) => {
  const [name, setName] = useState("");
  const getIssue = useCallback(
    () =>
      axios
        .get(link.replace("https://github.com", "https://api.github.com/repos"))
        .then((issue) => setName(issue.data.title)),
    [setName]
  );
  return (
    <DataLoader loadAsync={getIssue}>
      <H5>
        <ExternalLink href={link}>{name}</ExternalLink>
      </H5>
    </DataLoader>
  );
};

const ContractPage = () => {
  const [contract, setContract] = useState<Contract>();
  const getContract = useCallback(() => {
    const query = new URLSearchParams(window.location.search);
    const uuid = query.get("id");
    return axios
      .get(`${API_URL}/contract?uuid=${uuid}`)
      .then((res) => setContract(res.data));
  }, [setContract]);
  return (
    <Layout title={`Contract Detail | Floss`}>
      <DataLoader loadAsync={getContract}>
        <H1>
          ${contract?.reward} - {contract?.lifecycle?.toUpperCase()}
        </H1>
        <GithubDisplay link={contract?.link || ""} />
        <Subtitle>Due on: {contract?.dueDate}</Subtitle>
        <Subtitle>
          Created by {contract?.createdBy} on {contract?.createdDate}
        </Subtitle>
      </DataLoader>
    </Layout>
  );
};

export default ContractPage;
