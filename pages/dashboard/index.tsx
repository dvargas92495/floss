import Layout from "../../components/Layout";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { API_URL } from "../../utils/client";
import IssueList from "../../components/IssueList";
import ProjectList from "../../components/ProjectList";
import CreateGithubContractDialog from "../../components/CreateGithubContractDialog";
import {
  DataLoader,
  H1,
  Subtitle,
  VerticalGridContent,
} from "@dvargas92495/ui";

const Dashboard = () => {
  const [message, setMessage] = useState("");
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const fetchContracts = useCallback(
    () =>
      axios.get(`${API_URL}/contracts`).then((res) => {
        setProjects(res.data.projects);
        setIssues(res.data.issues);
      }),
    [setIssues, setProjects]
  );
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      setMessage(
        "Contract created! You will receive an email confirmation and see your contract below."
      );
    }
    if (query.get("cancel")) {
      setMessage("Contract cancel");
    }
  }, [setMessage]);
  return (
    <Layout title="Dashboard | Floss">
      <VerticalGridContent>
        <H1>Dashboard</H1>
        <Subtitle>{message}</Subtitle>
        <DataLoader loadAsync={fetchContracts}>
          <ProjectList items={projects} />
          <IssueList items={issues} />
        </DataLoader>
        <CreateGithubContractDialog
          fetchContracts={fetchContracts}
          buttonText={"Create Contract"}
        />
      </VerticalGridContent>
    </Layout>
  );
};

export default Dashboard;
