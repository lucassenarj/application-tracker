import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const SMOKE_TEST_EMAIL = 'smoke-test@example.com';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const prisma = app.get(PrismaService);

    const user = await prisma.user.findUnique({
      where: { email: SMOKE_TEST_EMAIL },
    });

    if (!user) {
      console.log(
        `No user found with email ${SMOKE_TEST_EMAIL}. Nothing to clean up.`,
      );
      return;
    }

    const { count: statusChangeCount } = await prisma.statusChange.deleteMany({
      where: { application: { userId: user.id } },
    });
    const { count: applicationCount } = await prisma.application.deleteMany({
      where: { userId: user.id },
    });
    const { count: refreshTokenCount } = await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });
    await prisma.user.delete({ where: { id: user.id } });

    console.log(
      `Deleted ${statusChangeCount} status changes, ${applicationCount} applications, ${refreshTokenCount} refresh tokens, and the user ${SMOKE_TEST_EMAIL}.`,
    );
    console.log('Companies were left in place (shared/global data).');
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
