import { parseArgs } from 'node:util';
import Bot from 'bsky-rss-bot';

const HASHTAGS = '#WebPlatform #WebFeatures #Baseline';

const FEEDS = {
  'newly-available': {
    url: 'https://web-platform-dx.github.io/web-features-explorer/newly-available.xml',
    cacheFile: '.bsky-rss-bot/newly-available-cache.json',
    heading: '🟦 Baseline newly available',
  },
  'widely-available': {
    url: 'https://web-platform-dx.github.io/web-features-explorer/widely-available.xml',
    cacheFile: '.bsky-rss-bot/widely-available-cache.json',
    heading: '🟩 Baseline widely available',
  },
};

function parseNonNegativeInteger(value, name) {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`--${name} must be a non-negative integer`);
  }

  return number;
}

function parseCLIArgs() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      feed: { type: 'string' },
      'initial-post-limit': { type: 'string', default: '5' },
      'post-limit': { type: 'string', default: '5' },
      'dry-run': { type: 'boolean', default: false },
      'populate-cache': { type: 'boolean', default: false },
    },
    strict: true,
  });

  if (!values.feed || !Object.hasOwn(FEEDS, values.feed)) {
    throw new Error(`--feed must be one of: ${Object.keys(FEEDS).join(', ')}`);
  }

  return {
    feed: values.feed,
    initialPostLimit: parseNonNegativeInteger(values['initial-post-limit'], 'initial-post-limit'),
    postLimit: parseNonNegativeInteger(values['post-limit'], 'post-limit'),
    dryRun: values['dry-run'],
    populateCache: values['populate-cache'],
  };
}

function extractDescription(content) {
  if (typeof content !== 'string') {
    return '';
  }

  const paragraph = content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '';

  return paragraph.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
}

function createPostText(heading, item) {
  return [heading, item.title, item.description, HASHTAGS].join('\n\n');
}

function getEntries(feed) {
  return (feed?.feed?.entry ?? []).map((entry) => ({
    title: entry.title ?? '',
    description: extractDescription(entry.content?.['#text']),
    link: entry.link?.['@_href'] ?? '',
    updated: entry.updated ?? '',
  }));
}

async function main() {
  const options = parseCLIArgs();
  const config = FEEDS[options.feed];

  const bot = new Bot({
    feedUrl: config.url,
    account: {
      identifier: process.env.BSKY_IDENTIFIER,
      password: process.env.BSKY_PASSWORD,
    },
    getEntries,
    postText: (item) => createPostText(config.heading, item),
  });

  await bot.run(options);
}

function fatalError(error, label) {
  console.error(`[bsky-rss-bot] ${label}:`, error);
  process.exit(1);
}

process.on('unhandledRejection', (error) => {
  fatalError(error, 'Unhandled rejection');
});

process.on('uncaughtException', (error) => {
  fatalError(error, 'Uncaught exception');
});

await main().catch((error) => fatalError(error, 'Fatal error'));
