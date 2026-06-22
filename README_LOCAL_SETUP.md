ExamSphere — Local Development Setup
This guide will help you set up the ExamSphere development environment on your local machine.

1. Prerequisites
Before you begin, ensure you have the following installed:

Node.js: v20.x LTS (Recommended via nvm)
pnpm: v9.x (npm install -g pnpm@9)
Docker & Docker Compose: Install Docker
Git: For cloning the repository
Oracle Instant Client: (Optional, only needed if running Oracle XE locally without Prisma's built-in binaries)
2. Clone the Repository
git clone https://github.com/your-org/examsphere.gitcd examsphere
3. Install Dependencies
Install all required npm packages using pnpm:

bash

pnpm install
4. Database Setup
You have two options for the database: local Oracle XE via Docker or connecting to an Oracle Autonomous Database (ATP/ADW) in the cloud.

Option A: Local Oracle XE via Docker (Recommended for Local Dev)
We use the gvenzl/oracle-xe image for local development.

Start the Oracle XE container:
bash

docker run -d --name examsphere-oracle -p 1521:1521 -e ORACLE_PASSWORD=oracle -e APP_USER=examsphere -e APP_USER_PASSWORD=examsphere_pwd gvenzl/oracle-xe:21-slim
(Wait about 30-60 seconds for the database to initialize)
Your local DATABASE_URL will be:
text

oracle://examsphere:examsphere_pwd@localhost:1521/XEPDB1
Option B: Oracle Autonomous Database (Cloud)
Download your Oracle Autonomous Database Wallet ZIP file from the OCI Console.
Base64 encode the ZIP file (required for the Prisma Oracle adapter to read it securely):
bash

base64 -w 0 Wallet_YourDatabase.zip > wallet_base64.txt
You will use the contents of wallet_base64.txt for the ORACLE_WALLET_BASE64 environment variable.
Your DATABASE_URL will look like:
text

oracle://USER:PASSWORD@tnsname_high?schema=EXAMSPHERE
5. Environment Variables
Create a .env.local file in the root directory:

bash

cp .env.example .env.local
Edit .env.local with the following minimum configuration (assuming Option A for DB):

env

# Core
NODE_ENV=development
APP_URL=http://localhost:3000
AUTH_SECRET=your_super_secret_string_at_least_32_chars_long

# Database
DATABASE_URL=oracle://examsphere:examsphere_pwd@localhost:1521/XEPDB1
# ORACLE_WALLET_BASE64= (Leave empty for local Docker setup)

# Storage
STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=./uploads

# AI Providers (Optional for local dev, but recommended)
AI_PREFERRED_PROVIDER=OPENAI
OPENAI_API_KEY=sk-your-openai-key
6. Initialize the Database Schema
Run the Oracle DDL scripts to create tables, partitions, indexes, and triggers.

Connect to your local Oracle DB using SQL*Plus, SQL Developer, or DBeaver.
Execute the SQL scripts located in prisma/oracle/ in numerical order:
01_schema.sql
02_indexes.sql
03_constraints.sql
04_triggers.sql
05_materialized_views.sql
Alternatively, if using the Docker container, you can execute them via command line:

bash

docker exec -i examsphere-oracle sqlplus examsphere/examsphere_pwd@//localhost:1521/XEPDB1 < prisma/oracle/01_schema.sql
# Repeat for 02, 03, 04, 05
7. Generate Prisma Client & Seed Data
Push any remaining schema changes (like the feature flags or batch tables added in later segments) and generate the Prisma client:

bash

pnpm prisma db push
pnpm prisma generate
Run the seed scripts to populate base exams, subjects, plans, the super admin, and feature flags:

bash

pnpm prisma db seed
8. Run the Development Server
Start the Next.js development server:

bash

pnpm dev
The application will be available at http://localhost:3000.

Default Admin Credentials (from seed):

Email: admin@examsphere.com
Password: Examsphere@123
9. Testing
Unit & Integration Tests (Jest)
bash

pnpm test
To run in watch mode:

bash

pnpm test:watch
End-to-End Tests (Playwright)
Ensure the dev server is running (pnpm dev), then run:

bash

pnpm playwright test
To view the Playwright UI:

bash

pnpm playwright test --ui
10. Troubleshooting
Database Connection Issues
Ensure the Docker container is running: docker ps
Check if port 1521 is already in use.
If using cloud ATP, ensure your IP is whitelisted in the Oracle Cloud VCN security lists.
Prisma Generation Errors
Ensure you are using Node 20 and pnpm 9.
Delete node_modules and .next folders, then run pnpm install and pnpm prisma generate again.
AI Features Not Working
Verify you have set at least one valid API key (e.g., OPENAI_API_KEY) in .env.local.
text


### `.env.example`

```env
# Core
NODE_ENV=development
APP_URL=http://localhost:3000
AUTH_SECRET=replace_with_a_secure_string_of_at_least_32_chars

# Database (Local Docker Example)
DATABASE_URL=oracle://examsphere:examsphere_pwd@localhost:1521/XEPDB1
# For Cloud Autonomous DB, use base64 encoded wallet:
# ORACLE_WALLET_BASE64=

# Storage
STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=./uploads

# AI Providers
AI_PREFERRED_PROVIDER=OPENAI
# OPENAI_API_KEY=
# GEMINI_API_KEY=
# ANTHROPIC_API_KEY=

# Email
# RESEND_API_KEY=

# Payments
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=
package.json (Snippet to ensure scripts match)
Please ensure your package.json has the following scripts to match the README instructions:

json

{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:seed": "prisma db seed",
    "playwright:test": "playwright test"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seeds/01_core.seed.ts && ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seeds/02_syllabus.seed.ts && ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seeds/03_feature_flags.seed.ts"
  }
}