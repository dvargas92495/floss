import * as React from "react";
import { Contract } from "../interfaces";
import EntityList from "./EntityList";

const IssueList = ({ items }: { items: Contract[] }) => (
  <EntityList
    title={"Issues"}
    items={items.map((i) => ({
      id: i.uuid,
      icon: `$${i.reward}`,
      primary: i.link,
      secondary: `Due on: ${i.dueDate}`,
      tertiary: `Created by ${i.createdBy} on ${i.createdDate}`,
    }))}
  />
);

export default IssueList;
