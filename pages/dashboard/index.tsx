import Layout from "../../components/Layout";
import Typography from "@material-ui/core/Typography";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { API_URL } from "../../utils/client";
import Grid from "@material-ui/core/Grid";
import IssueList from "../../components/IssueList";
import ProjectList from "../../components/ProjectList";
import CreateGithubContractDialog from "../../components/CreateGithubContractDialog";
import { DataLoader } from "@dvargas92495/ui";

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
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h1">Dashboard</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle1">{message}</Typography>
        </Grid>
        <DataLoader loadAsync={fetchContracts}>
          <ProjectList items={projects} />
          <IssueList items={issues} />
        </DataLoader>
        <Grid item xs={12}>
          <CreateGithubContractDialog
            fetchContracts={fetchContracts}
            buttonText={"Create Contract"}
          />
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Dashboard;
