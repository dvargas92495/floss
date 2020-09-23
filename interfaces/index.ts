export type Issue = {
  dueDate: string;
  lifecycle: string;
  link: string;
  reward: number;
  uuid: string;
};

export type User = {
  name: string;
  email: string;
  accessToken: string;
  avatar_url: string;
};
