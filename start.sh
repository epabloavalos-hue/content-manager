#!/bin/sh
mkdir -p /data/avatars /data/user-bg /data/proof 2>/dev/null || true
node_modules/.bin/prisma db push --accept-data-loss 2>/dev/null || true

# Seed default event categories if table is empty
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function seed() {
  const count = await prisma.eventCategory.count();
  if (count === 0) {
    const defaults = [
      { value: 'GIRA', label: 'Giras', order: 0 },
      { value: 'EVENTO', label: 'Eventos', order: 1 },
      { value: 'CONFERENCIA_PAGADA', label: 'Conferencias Pagadas', order: 2 },
      { value: 'GRABACION', label: 'Grabaciones', order: 3 },
      { value: 'OTRO', label: 'Otros', order: 4 },
    ];
    for (const d of defaults) {
      await prisma.eventCategory.create({ data: d });
    }
    console.log('Seeded default event categories');
  }
  await prisma.\$disconnect();
}
seed().catch(e => { console.error(e); process.exit(0); });
" 2>/dev/null || true

exec node_modules/.bin/next start -p ${PORT:-3000} -H 0.0.0.0
