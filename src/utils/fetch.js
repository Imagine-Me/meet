export const fetchApi = (url, body, method = "POST") => {
  return fetch(`${process.env.REACT_APP_BASE_URL}/${url}`, {
    method,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
};
