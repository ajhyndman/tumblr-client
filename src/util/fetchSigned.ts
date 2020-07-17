import CryptoJS from 'crypto-js';
import OAuth from 'oauth-1.0a';

const oauth = new OAuth({
  consumer: {
    key: process.env.REACT_APP_API_KEY!,
    secret: process.env.REACT_APP_API_SECRET!,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
  },
});

const token = {
  key: process.env.REACT_APP_TOKEN!,
  secret: process.env.REACT_APP_TOKEN_SECRET!,
};

export const fetchSigned = (url: string, init?: RequestInit) => {
  const requestData: OAuth.RequestOptions = {
    url,
    method: init?.method ?? 'GET',
  }

  if (typeof init?.body === 'string') {
    requestData.data = JSON.parse(init.body);
  }

  const ouathHeader = oauth.toHeader(oauth.authorize(requestData, token));

  const options: RequestInit = {
    ...(init ?? {}),
    headers: { ...init?.headers, ...ouathHeader },
  };

  if (init?.body != null) {
    options.body = init.body;
  }

  return fetch(requestData.url, options);
};
