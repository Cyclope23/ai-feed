import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const SOURCES = [
  { name: 'Anthropic Blog', type: 'RSS' as const, url: 'https://www.anthropic.com/news/rss.xml', category: 'official' },
  { name: 'Hacker News (Claude)', type: 'RSS' as const, url: 'https://hnrss.org/newest?q=claude+OR+anthropic', category: 'community' },
  { name: 'Dev.to (claude)', type: 'RSS' as const, url: 'https://dev.to/feed/tag/claude', category: 'community' },
  { name: 'Dev.to (anthropic)', type: 'RSS' as const, url: 'https://dev.to/feed/tag/anthropic', category: 'community' },
  { name: 'Reddit r/ClaudeAI', type: 'RSS' as const, url: 'https://www.reddit.com/r/ClaudeAI/.rss', category: 'community' },
  { name: 'GitHub: topic claude', type: 'GITHUB' as const, url: 'topic:claude', category: 'tools' },
  { name: 'GitHub: topic mcp', type: 'GITHUB' as const, url: 'topic:mcp', category: 'tools' },
  { name: 'GitHub: topic claude-code', type: 'GITHUB' as const, url: 'topic:claude-code', category: 'tools' },
];

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (email && passwordHash) {
    await db.adminUser.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
    console.log('Admin user upserted:', email);
  }

  for (const s of SOURCES) {
    await db.source.upsert({
      where: { url: s.url },
      update: {},
      create: s,
    });
  }
  console.log(SOURCES.length, 'sources upserted');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
