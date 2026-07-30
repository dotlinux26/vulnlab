import { initDb, Lab } from './src/db.ts';

const labsData = [
  {
    id: "ffuf-mastery",
    title: "Ffuf Mastery",
    description: "Khảo sát Virtual Host và lọc kết quả rác qua Header Host. Học cách sử dụng ffuf để brute-force directories và virtual hosts.",
    difficulty: "Medium",
    category: "Web",
    points: 100,
    solves: 42,
    flag: "FLAG{MASTER_RECON}",
    contentUrl: "/labs/ffuftest.html",
  },
];

async function seed() {
  await initDb();
  console.log('Database synced.');

  for (const lab of labsData) {
    await Lab.upsert(lab);
  }

  console.log('Seeding completed.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
