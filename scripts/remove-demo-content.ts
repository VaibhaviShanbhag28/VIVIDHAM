/**
 * Removes all demonstration products (isDemo = true). Categories, settings and
 * pages are kept. Run once real products have been added:
 *   npm run demo:remove
 */
import "./load-env";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const { count } = await prisma.product.deleteMany({ where: { isDemo: true } });
  console.log(`✔ Removed ${count} demonstration product(s).`);
  console.log("  Category images and the home-page placeholder images in /public/demo can be replaced from Admin → Categories / Settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
