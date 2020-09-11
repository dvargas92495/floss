import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import Web3 from "web3";
import { provider } from "web3-core";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

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
  const [account, setAccount] = useState("");
  useEffect(() => {
    const web3 = window.ethereum
      ? new Web3(window.ethereum)
      : new Web3("ws://localhost:7545");
    window.ethereum
      .enable()
      .then(() => web3.eth.getAccounts())
      .then((accounts) => {
        setAccount(accounts[0]);
        /*
        const IssueContract = TruffleContract(contract);
        IssueContract.setProvider(web3.currentProvider);
        return IssueContract.deployed();
      })
      .then((instance) => instance.issueUrl())
    .then(console.log*/
      });
  }, [setAccount]);
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{flexGrow: 1}}>
            <Link href="/">
              <a>Home</a>
            </Link>
          </Typography>
          <Typography variant="subtitle1">{account}</Typography>
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
