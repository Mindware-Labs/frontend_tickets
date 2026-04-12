export default {
  site: "https://righutsupportcenter.vercel.app",
  // Explicit URLs to audit (bypasses crawler entirely)
  urls: [
    "/login",
    "/tickets",
    "/customers",
    "/campaigns",
    "/yards",
    "/phone-lines",
    "/reports/campaigns",
    "/reports/yards",
    "/settings",
  ],
  scanner: {
    crawler: false,
    skipJavascript: false,
    samples: 1,
  },
  cookies: [
    {
      name: "auth-token",
      value:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoibGFic21pbmR3YXJlQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsIm5hbWUiOiJNaW5kd2FyZSBMYWJzIiwiaWF0IjoxNzc1OTQwMzIyLCJleHAiOjE3NzU5ODM1MjJ9.pM_bslc9sWgICSVkXg49XUqnzhP0rJbvsFhAHepMxNI",
      domain: "righutsupportcenter.vercel.app",
      path: "/",
    },
  ],
  lighthouseOptions: {
    throttlingMethod: "simulate",
  },
};
