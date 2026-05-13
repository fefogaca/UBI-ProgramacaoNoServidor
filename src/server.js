require("dotenv").config();
const app = require("./app");
const { connectToDatabase } = require("./config/db");

const port = process.env.PORT || 3000;

async function bootstrap() {
  await connectToDatabase(process.env.MONGODB_URI);

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`GREENHERB API a correr em http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Erro ao iniciar servidor:", error.message);
  process.exit(1);
});
