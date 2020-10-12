import React, {
  FunctionComponent,
  useCallback,
  useContext,
  useState,
} from "react";
import Head from "next/head";
import { AppBar } from "@dvargas92495/ui";
import MuiLink from "@material-ui/core/Link";
import Logo from "./Logo";
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

type Props = {
  title?: string;
};

const Layout: FunctionComponent<Props> = ({ children, title = "Floss" }) => {
  const { user } = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <AppBar homeIcon={<Logo size={2} />} pages={["about", "dashboard"]}>
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
      <Container maxWidth={"lg"}>
        <>{children}</>
      </Container>
      <footer>
        <hr />
        <span>© {new Date().getFullYear()} Vargas Arts, LLC</span>
      </footer>
    </div>
  );
};

export default Layout;
