export type Issue = {
  dueDate: string;
  lifecycle: string;
  link: string;
  reward: number;
  uuid: string;
  createdDate: string;
  createdBy: string;
};

export type User = {
  name: string;
  email: string;
  accessToken: string;
  avatar_url: string;
};
