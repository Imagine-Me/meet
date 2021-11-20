import { RouteProps } from 'react-router';

export default function useQuery(location : RouteProps['location']) {
  return new URLSearchParams(location?.search);
}
