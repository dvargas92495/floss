export type Contract = {
  dueDate: string;
  lifecycle: string;
  link: string;
  reward: number;
  uuid: string;
  createdDate: string;
  createdBy: string;
};

export type Issue = {
  title: string;
  body: string;
  link: string;
  state: "open" | "closed";
  contracts: Contract[];
};

export type User = {
  name: string;
  email: string;
  accessToken: string;
  avatar_url: string;
};
