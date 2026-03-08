const UPSTREAM = "https://rdyson--7ddb868a18ad11f18c9d42dde27851f2.web.val.run";
const PRIMARY = "https://showdown.run";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Redirect legacy domain → primary
    if (url.hostname === "showdown.rdyson.dev") {
      return Response.redirect(PRIMARY + url.pathname + url.search, 301);
    }

    const upstreamUrl = UPSTREAM + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.set("Host", "rdyson--7ddb868a18ad11f18c9d42dde27851f2.web.val.run");

    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "manual",
    });

    const newHeaders = new Headers(response.headers);
    newHeaders.delete("set-cookie");

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  },
};
