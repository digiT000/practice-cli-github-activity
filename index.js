const { stdin: input, stdout: output } = require("node:process");
const readline = require("node:readline");

// GITHUB API CLI
const EVENT_MESSAGES = {
  PushEvent: (count, repo) => `- Pushed ${count} commit(s) to ${repo}`,
  PullRequestEvent: (count, repo) =>
    `- Opened/updated ${count} pull request(s) in ${repo}`,
  CreateEvent: (count, repo) => `- Created branch/tag in ${repo}`,
  IssuesEvent: (count, repo) =>
    `- Opened/commented on ${count} issue(s) in ${repo}`,
  WatchEvent: (count, repo) => `- Starred ${repo}`,
  ForkEvent: (count, repo) => `- Forked ${repo}`,
};

const rl = readline.createInterface({
  input,
  output,
});

// Create Fetch Process
async function fetchUserEvent(username) {
  if (!username) {
    console.error("Must provide username");
  }
  const URL = `https://api.github.com/users/${username}/events`;

  try {
    const response = await fetch(URL, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (response.status !== 200) {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch user event : ", error);
    return null;
  }
}

// CLI Start
rl.question("Enter Github username : ", async (username) => {
  try {
    const data = await fetchUserEvent(username);
    if (!data) {
      throw new Error("No data found");
    }
    const eventByRepo = processData(data);
    printResult(eventByRepo);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed to fetch user event : ", error.message);
    } else {
      console.error("Failed : ", error);
    }
  } finally {
    rl.close();
  }
});

function processData(data) {
  const eventByRepo = new Map();

  for (const event of data) {
    const { id: repoId, name: repoName } = event.repo;

    if (!eventByRepo.has(repoId)) {
      eventByRepo.set(repoId, { name: repoName, events: [] });
    }

    const repo = eventByRepo.get(repoId);
    repo.events[event.type] = (repo.events[event.type] || 0) + 1;
  }

  const uniqueRepo = new Map();

  data.forEach((event) => {
    uniqueRepo.set(event.repo.id, event.repo.name);
  });

  return eventByRepo;
}

function printResult(eventByRepo) {
  if (eventByRepo.size === 0) {
    console.error("No data found");
    return;
  }

  console.log("\nRecent GitHub Activity:\n");

  for (const [repoId, { name, events }] of eventByRepo) {
    for (const [eventType, count] of Object.entries(events)) {
      const formatter = EVENT_MESSAGES[eventType];

      if (formatter) {
        console.log(formatter(count, name));
      } else {
        console.log(`- ${eventType}: ${count} time(s) in ${name}`);
      }
    }
  }
}
