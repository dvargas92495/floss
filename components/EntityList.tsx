import * as React from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";

const EntityList = ({
  items,
  title,
}: {
  title: string;
  items: {
    id: string;
    icon: string;
    primary: string;
    secondary: string;
    tertiary: string;
  }[];
}) => (
  <Grid item xs={12}>
    <Typography variant="h3">{title}</Typography>
    <Paper variant={"outlined"}>
      {items.length === 0 ? (
        <Typography variant="h4">No Active {title}</Typography>
      ) : (
        <List component="nav" aria-label={title.toLowerCase()}>
          {items.map((item) => (
            <ListItem
              key={item.id}
              button
              component="a"
              href={`/${title
                .toLowerCase()
                .substring(0, title.length - 1)}?id=${item.id}`}
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
  </Grid>
);

export default EntityList;
