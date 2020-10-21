import { Project } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useCallback, useState } from "react";
import Typography from "@material-ui/core/Typography";
import { API_URL } from "../../utils/client";
import MuiLink from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import axios from "axios";
import marked from "marked";
import ContractList from "../../components/ContractList";
import EntityList from "../../components/EntityList";
import CreateGithubContractDialog from "../../components/CreateGithubContractDialog";
import { DataLoader } from "@dvargas92495/ui";

const ProjectPage = () => {
  const [project, setProject] = useState<Project>();
  const fetchProject = useCallback(() => {
    const query = new URLSearchParams(window.location.search);
    const link = query.get("id");
    return axios
      .get(`${API_URL}/project?link=${link}`)
      .then((project) => setProject(project.data));
  }, [setProject]);
  return (
    <Layout title={`Project Detail | Floss`}>
      <DataLoader loadAsync={fetchProject}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant={"h2"}>
              <MuiLink href={project?.link} target="_blank" rel="noopener">
                {project?.title}
              </MuiLink>
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant={"h5"}>
              ${project?.contracts.reduce((n, c) => c.reward + n, 0)} -{" "}
              {project?.state.toUpperCase()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant={"body1"}>
              <div dangerouslySetInnerHTML={{ __html: marked(project?.body|| '') }} />
            </Typography>
          </Grid>
          <ContractList items={project?.contracts || []} />
          <Grid item xs={12}>
            <CreateGithubContractDialog
              fetchContracts={fetchProject}
              buttonText={"Fund Project"}
              link={project?.link}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant={"h3"}>Cards</Typography>
            {project?.cards.map((column) => (
              <EntityList
                title={column.name}
                items={column.cards.map((card) => ({
                  link: card.link.replace(
                    "https://api.github.com/repos/",
                    "https://github.com/"
                  ),
                  icon: "",
                  primary: card.note ? "No note" : card.note,
                  secondary: card.link.substring(
                    "https://api.github.com/repos/".length
                  ),
                  tertiary: "",
                }))}
              />
            ))}
          </Grid>
        </Grid>
      </DataLoader>
    </Layout>
  );
};

export default ProjectPage;
