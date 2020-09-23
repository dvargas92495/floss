import { createContext } from "react";
import { User } from "../interfaces";

const UserContext = createContext<{
  user?: User;
  setUser: (u?: User) => void;
}>({ setUser: () => {} });

export default UserContext;
