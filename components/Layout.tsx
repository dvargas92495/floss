import React, { FunctionComponent, useContext } from "react";
import Head from "next/head";
import { AppBar } from "@dvargas92495/ui";
import MuiLink from "@material-ui/core/Link";
import Logo from "./Logo";
import GitHub from "@material-ui/icons/GitHub";
import Avatar from "@material-ui/core/Avatar";
import UserContext from "./UserContext";
import Container from "@material-ui/core/Container";

type Props = {
  title?: string;
};

const Layout: FunctionComponent<Props> = ({ children, title = "Floss" }) => {
  const { user } = useContext(UserContext);
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
          <MuiLink
            href={`https://github.com/login/oauth/authorize?scope=user:email&client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}`}
            color="inherit"
          >
            <Avatar>
              <GitHub />
            </Avatar>
          </MuiLink>
        )}
      </AppBar>
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
