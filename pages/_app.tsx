import { AppProps } from 'next/app';
import { useState } from 'react';
import { User } from '../interfaces';

export default function MyApp({
  Component,
  pageProps,
}:AppProps) {
  const [userObj, setUserObj] = useState<User>();
  return <Component {...pageProps} userObj={userObj} setUserObj={setUserObj} />;
}
