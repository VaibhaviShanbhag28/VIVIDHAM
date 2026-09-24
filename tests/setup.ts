// Integration tests run against TEST_DATABASE_URL only — never the development database.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
process.env.APP_URL ??= "http://localhost:3000";
process.env.UPLOAD_DIR ??= "./storage/test-uploads";
