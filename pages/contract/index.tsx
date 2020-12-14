import { Contract } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useCallback, useState } from "react";
import { API_URL } from "../../utils/client";
import axios from "axios";
import { DataLoader, H1, H5, ExternalLink, Subtitle } from "@dvargas92495/ui";

const ContractPage = () => {
  const [contract, setContract] = useState<Contract>({
    reward: 0,
    link: "",
    lifecycle: "",
    dueDate: "",
    createdBy: "",
    createdDate: "",
    uuid: "",
  });
  const [name, setName] = useState("");
  const getContract = useCallback(() => {
    const query = new URLSearchParams(window.location.search);
    const uuid = query.get("uuid");
    return axios.get(`${API_URL}/contract?uuid=${uuid}`).then((res) => {
      setContract(res.data.contract);
      setName(res.data.title);
    });
  }, [setContract, setName]);
  return (
    <Layout title={`Contract Detail | Floss`}>
      <DataLoader loadAsync={getContract}>
        <H1>
          ${contract.reward} - {contract.lifecycle.toUpperCase()}
        </H1>
        <H5>
          <ExternalLink href={contract.link}>{name}</ExternalLink>
        </H5>
        <Subtitle>Due on: {contract.dueDate}</Subtitle>
        <Subtitle>
          Created by {contract.createdBy} on {contract.createdDate}
        </Subtitle>
      </DataLoader>
    </Layout>
  );
};

export default ContractPage;
