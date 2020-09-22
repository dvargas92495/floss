import React, { ReactNode, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { provider } from "web3-core";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import MuiLink from "@material-ui/core/Link";
import GitHub from "@material-ui/icons/GitHub";

declare global {
  interface Window {
    ethereum: provider & {
      enable: () => Promise<void>;
    };
  }
}

type Props = {
  children?: ReactNode;
  title?: string;
};

const Layout = ({ children, title = "Floss" }: Props) => {
  const [account] = useState("");
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            <Link href="/">
              <a>Home</a>
            </Link>
          </Typography>
          {account ? (
            <Typography variant="subtitle1">{account}</Typography>
          ) : (
            <Typography variant="subtitle1">
              <MuiLink
                href={`https://github.com/login/oauth/authorize?scope=user:email&client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}`}
                color="inherit"
              >
                <GitHub/>
              </MuiLink>
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      {children}
      <footer>
        <hr />
        <span>© {new Date().getFullYear()} Vargas Arts, LLC</span>
      </footer>
    </div>
  );
};

export default Layout;
