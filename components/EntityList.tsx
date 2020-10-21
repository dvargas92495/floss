import * as React from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Paper from "@material-ui/core/Paper";
import { H3, H4 } from "@dvargas92495/ui";

const EntityList = ({
  items,
  title,
}: {
  title: string;
  items: {
    id?: string;
    link?: string;
    icon: string;
    primary: string;
    secondary: string;
    tertiary: string;
  }[];
}) => (
  <>
    <H3>{title}</H3>
    <Paper variant={"outlined"}>
      {items.length === 0 ? (
        <H4>No Active {title}</H4>
      ) : (
        <List component="nav" aria-label={title.toLowerCase()}>
          {items.map((item) => (
            <ListItem
              key={item.id}
              button
              component="a"
              href={
                item.id
                  ? `/${title
                      .toLowerCase()
                      .substring(0, title.length - 1)}?id=${item.id}`
                  : item.link
              }
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.primary}
                secondary={
                  <>
                    {item.secondary}
                    <br />
                    {item.tertiary}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  </>
);

export default EntityList;
