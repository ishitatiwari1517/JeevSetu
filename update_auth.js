const { spawn } = require('child_process');

const child = spawn('cmd.exe', ['/c', 'amplify update auth'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

const responses = [
  { match: /What do you want to do/i, send: "\x1B[B\r" }, // Walkthrough all the auth configurations (down arrow)
  { match: /Select the authentication.authorization clients that you want to use/i, send: "\r" }, // User Sign-Up, Sign-In, connected with AWS IAM controls
  { match: /Please provide a friendly name/i, send: "\r" },
  { match: /Please enter a name for your identity pool/i, send: "\r" },
  { match: /Allow unauthenticated logins/i, send: "n\r" },
  { match: /Do you want to enable 3rd party authentication/i, send: "y\r" },
  { match: /Select the third party identity providers/i, send: "\r" }, // Assuming Google is first or we might need space to select. Actually, Hosted UI is different.
];

// Let's use a simpler approach: update the auth configuration using headless payload or just directly editing the CLI inputs.

