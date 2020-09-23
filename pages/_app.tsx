import { AppProps } from "next/app";
import { useState } from "react";
import UserContext from "../components/UserContext";
import { User } from "../interfaces";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<User>();
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Component {...pageProps} />
    </UserContext.Provider>
  );
}
