import React, {
  FunctionComponent,
  useCallback,
  useContext,
  useState,
} from "react";
import Head from "next/head";
import { AppBar } from "@dvargas92495/ui";
import MuiLink from "@material-ui/core/Link";
import FlossLogo from "./FlossLogo";
import GitHub from "@material-ui/icons/GitHub";
import Twitter from "@material-ui/icons/Twitter";
import Avatar from "@material-ui/core/Avatar";
import UserContext from "./UserContext";
import Container from "@material-ui/core/Container";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import List from "@material-ui/core/List";
import Button from "@material-ui/core/Button";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Typography from "@material-ui/core/Typography";

type Props = {
  title?: string;
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  main: {
    marginTop: theme.spacing(8),
    marginBottom: theme.spacing(2),
  },
  footer: {
    padding: theme.spacing(3, 2),
    marginTop: 'auto',
  },
}));

const Layout: FunctionComponent<Props> = ({ children, title = "Floss" }) => {
  const { user } = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <AppBar homeIcon={<FlossLogo size={2} />} pages={["about", "dashboard"]}>
        {user ? (
          <Avatar alt={user.name} src={user.avatar_url} />
        ) : (
          <Button
            variant="outlined"
            color="primary"
            onClick={open}
            style={{ minWidth: 84 }}
          >
            Log In
          </Button>
        )}
      </AppBar>
      <Dialog onClose={close} open={isOpen}>
        <DialogTitle>Log In</DialogTitle>
        <List>
          <MuiLink
            href={`https://github.com/login/oauth/authorize?scope=user:email&client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}`}
            color="inherit"
          >
            <ListItem autoFocus button>
              <ListItemAvatar>
                <Avatar>
                  <GitHub />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Log In With GitHub" />
            </ListItem>
          </MuiLink>
          <MuiLink
            href={`https://github.com/login/oauth/authorize?scope=user:email&client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}`}
            color="inherit"
          >
            <ListItem button onClick={() => {}}>
              <ListItemAvatar>
                <Avatar>
                  <Twitter />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Log In With Twitter" />
            </ListItem>
          </MuiLink>
        </List>
      </Dialog>
      <Container maxWidth={"lg"} component={"main"} className={classes.main}>
        <>{children}</>
      </Container>
      <footer className={classes.footer}>
        <hr />
        <Typography variant="body2" color="textSecondary">© {new Date().getFullYear()} Vargas Arts, LLC</Typography>
      </footer>
    </div>
  );
};

export default Layout;
