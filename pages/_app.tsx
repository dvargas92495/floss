import { AppProps } from "next/app";
import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@dvargas92495/ui";
import UserContext from "../components/UserContext";
import { User } from "../interfaces";
import axios from "axios";
import { MDXProvider } from "@mdx-js/react";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<User>();
  useEffect(() => {
    const accessToken =
      localStorage.getItem("githubToken") ||
      process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    const twitterToken = localStorage.getItem("twitterToken");
    if (accessToken && !user) {
      axios
        .get(`https://api.github.com/user?access_token=${accessToken}`, {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        })
        .then((r) =>
          setUser({
            name: r.data.name,
            email: r.data.email,
            accessToken,
            avatar_url: r.data.avatar_url,
          })
        )
        .catch((e) => console.error(e.response?.data || e.message));
    } else if (twitterToken && !user) {
      
    }
  }, [user, setUser]);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <ThemeProvider>
        <MDXProvider components={{}}>
          <Component {...pageProps} />
        </MDXProvider>
      </ThemeProvider>
    </UserContext.Provider>
  );
}
