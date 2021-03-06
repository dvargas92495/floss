import * as React from "react";
import { Contract } from "../interfaces";
import EntityList from "./EntityList";

const ProjectList = ({ items }: { items: Contract[] }) => (
  <EntityList
    title={"Projects"}
    items={items.map((i) => ({
      id: i.link.substring("https://github.com/".length),
      icon: `$${i.reward}`,
      primary: i.link,
      secondary: `Due on: ${i.dueDate}`,
      tertiary: `Created by ${i.createdBy} on ${i.createdDate}`,
    }))}
  />
);

export default ProjectList;
