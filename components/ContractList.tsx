import * as React from "react";
import { Issue } from "../interfaces";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";

type Props = {
  items: Issue[];
};

const ContractList = ({ items }: Props) => (
  <List component="nav" aria-label="contracts">
    {items.map((item) => (
      <ListItem key={item.uuid} button component="a" href={`/contracts/${item.uuid}`}>
        <ListItemIcon>${item.reward}</ListItemIcon>
        <ListItemText primary={item.link} secondary={`Due on: ${item.dueDate}`}/>
      </ListItem>
    ))}
  </List>
);

export default ContractList;
