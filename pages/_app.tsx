import { AppProps } from "next/app";
import { useEffect, useState } from "react";
import UserContext from "../components/UserContext";
import { User } from "../interfaces";
import axios from "axios";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<User>();
  useEffect(() => {
    const accessToken = localStorage.getItem("githubToken");
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
        );
    }
  }, [user, setUser]);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Component {...pageProps} />
    </UserContext.Provider>
  );
}
