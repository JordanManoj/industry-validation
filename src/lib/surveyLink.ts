// Set in the browser on submit; the survey entry page shows the thank-you
// message instead of the survey while it exists. Shared by server and client.
export function submittedCookieName(token: string) {
  return `iv_submitted_${token}`;
}
