import { Contract, Project } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useCallback, useState } from "react";
import { API_URL } from "../../utils/client";
import axios from "axios";
import marked from "marked";
import ContractList from "../../components/ContractList";
import EntityList from "../../components/EntityList";
import CreateGithubContractDialog from "../../components/CreateGithubContractDialog";
import {
  DataLoader,
  ExternalLink,
  H5,
  H2,
  H3,
  VerticalGridContent,
} from "@dvargas92495/ui";

const ProjectPage = () => {
  const [project, setProject] = useState<Project>({
    link: "",
    title: "",
    body: "",
    state: "open",
    cards: [],
    contracts: [] as Contract[],
  });
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
        <VerticalGridContent>
          <H2>
            <ExternalLink href={project.link}>{project?.title}</ExternalLink>
          </H2>
          <H5>
            ${project?.contracts.reduce((n, c) => c.reward + n, 0)} -{" "}
            {project?.state.toUpperCase()}
          </H5>
          <div
            dangerouslySetInnerHTML={{ __html: marked(project?.body || "") }}
          />
          <ContractList items={project.contracts} />
          <CreateGithubContractDialog
            fetchContracts={fetchProject}
            buttonText={"Fund Project"}
            link={project.link}
          />
          <H3>Cards</H3>
          {project.cards.map((column) => (
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
        </VerticalGridContent>
      </DataLoader>
    </Layout>
  );
};

export default ProjectPage;
