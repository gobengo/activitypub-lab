import { RequestListener } from "http";

/**
 * HTTP RequestListener that does `name/resolve` over HTTP.
 * Used to demo/test the name service as a sample 'data plane'.
 */
export function HttpNameResolver(): RequestListener {
  return (_req, res) => {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        message: "Welcome to HttpNameResolver",
      })
    );
  };
}

export const HttpNameResolverUrls = {
  index(baseUrl: URL) {
    return new URL("/", baseUrl);
  },
};
