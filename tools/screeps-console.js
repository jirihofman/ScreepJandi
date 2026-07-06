#!/usr/bin/env node

require('dotenv').config();

const { ScreepsAPI } = require('screeps-api');

const DEFAULT_HOST = 'screeps.com';
const DEFAULT_SHARD = 'shard2';
const DEFAULT_TIMEOUT = 15000;
const MARKER = '__SCREEPJANDI_CONSOLE__';
const REQUEST_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function readArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function usage(exitCode = 0) {
  const text = `
Usage:
  npm run screeps:console -- --expr "JSON.stringify(Object.keys(Game.rooms))"
  npm run screeps:creeps -- --room W14N53

Options:
  --expr <js>       JavaScript expression to run in the Screeps console.
  --room <name>     Room name for the "creeps" command.
  --shard <name>    Shard name. Defaults to ${DEFAULT_SHARD}.
  --timeout <ms>    Console result timeout. Defaults to ${DEFAULT_TIMEOUT}.
  --raw             Print the raw result wrapper.

Environment:
  SCREEPS_TOKEN     Required auth token.
  SCREEPS_USER_ID   Optional. If omitted, /api/auth/me is used to discover it.
`;

  console.log(text.trim());
  process.exit(exitCode);
}

function buildExpression() {
  const command = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'expr';

  if (command === 'creeps') {
    const room = readArg('room');
    if (!room) {
      throw new Error('Missing --room for creeps command.');
    }

    return `(() => {
      const room = Game.rooms[${JSON.stringify(room)}];
      const names = room ? room.find(FIND_CREEPS).map(creep => creep.name) : [];
      return JSON.stringify({ room: ${JSON.stringify(room)}, names });
    })()`;
  }

  const expr = readArg('expr');
  if (!expr || hasFlag('help')) {
    usage(expr ? 0 : 1);
  }
  return expr;
}

async function main() {
  if (hasFlag('help')) {
    usage();
  }

  const token = process.env.SCREEPS_TOKEN;
  if (!token) {
    throw new Error('SCREEPS_TOKEN is required. Put it in your shell env or a local .env file.');
  }

  const shard = readArg('shard', process.env.SCREEPS_SHARD || DEFAULT_SHARD);
  const timeout = Number(readArg('timeout', process.env.SCREEPS_TIMEOUT || DEFAULT_TIMEOUT));
  const expression = buildExpression();
  const wrappedExpression = `JSON.stringify({ marker: ${JSON.stringify(MARKER)}, requestId: ${JSON.stringify(REQUEST_ID)}, value: (${expression}) })`;

  const api = new ScreepsAPI({
    token,
    protocol: 'https',
    hostname: process.env.SCREEPS_HOST || DEFAULT_HOST,
    port: 443,
    path: '/',
  });
  api.token = token;

  const userId = process.env.SCREEPS_USER_ID || (await api.raw.auth.me())._id;

  await api.socket.connect();

  const timer = setTimeout(() => {
    api.socket.disconnect();
    console.error(`Timed out waiting for Screeps console result after ${timeout}ms.`);
    process.exit(1);
  }, timeout);

  await api.socket.subscribe(`user:${userId}/console`, event => {
    const data = event.data || {};
    if (data.shard !== shard) {
      return;
    }

    const results = (data.messages && data.messages.results) || [];
    for (const result of results) {
      let parsed;
      try {
        parsed = JSON.parse(result);
      } catch (_error) {
        continue;
      }

      if (!parsed || parsed.marker !== MARKER || parsed.requestId !== REQUEST_ID) {
        continue;
      }

      clearTimeout(timer);
      api.socket.disconnect();

      if (hasFlag('raw')) {
        console.log(JSON.stringify(parsed, null, 2));
      } else if (typeof parsed.value === 'string') {
        try {
          console.log(JSON.stringify(JSON.parse(parsed.value), null, 2));
        } catch (_error) {
          console.log(parsed.value);
        }
      } else {
        console.log(JSON.stringify(parsed.value, null, 2));
      }
      process.exit(0);
    }
  });

  await api.console(wrappedExpression, shard);
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
