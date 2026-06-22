ExamSphere — Production Deployment Guide
This guide details the steps required to deploy ExamSphere to a production environment using Vercel (for the Next.js application) and Oracle Cloud Infrastructure (OCI) (for the database and file storage).

Architecture Overview
Frontend/API: Vercel (Serverless/Edge)
Database: Oracle Autonomous Database (Serverless or Dedicated)
Storage: Oracle Object Storage (S3-Compatible API)
AI/Email/Payments: External SaaS APIs (OpenAI, Resend, Razorpay)
Phase 1: Database Setup (Oracle Autonomous Database)
Provision Database:
Log in to your Oracle Cloud Console.
Navigate to Autonomous Transaction Processing (or Serverless).
Click Create Autonomous Database. Choose the appropriate workload type (Transaction Processing) and license model (License Included).
Download Wallet:
Once provisioned, click on the database name.
Under Connection, click Download Wallet.
Create a password for the wallet (this is different from the admin password) and download the ZIP file.
Create Application User & Schema:
Connect to the database using SQL Developer or SQL*Plus as the ADMIN user.
Run the following to create a dedicated user:
CREATE USER examsphere IDENTIFIED BY YourStrongPassword123;GRANT CONNECT, RESOURCE, DBA TO examsphere;ALTER USER examsphere QUOTA UNLIMITED ON DATA;
Execute DDL Scripts:
Connect to the database as the new examsphere user.
Execute the SQL scripts located in the prisma/oracle/ directory in numerical order:
01_schema.sql
02_indexes.sql
03_constraints.sql
04_triggers.sql
05_materialized_views.sql
(Note: In a CI/CD pipeline, this step can be automated, but for initial production setup, manual execution is recommended).
Base64 Encode the Wallet:
Vercel requires environment variables as strings. Base64 encode the downloaded ZIP file:
base64 -w 0 Wallet_YourDB.zip > wallet_base64.txt
Save the contents of wallet_base64.txt for later.
Construct DATABASE_URL:
The format is: oracle://USER:PASSWORD@TNS_NAME?schema=EXAMSPHERE
Example: oracle://examsphere:YourStrongPassword123@yourdb_high?schema=EXAMSPHERE
Phase 2: Storage Setup (Oracle Object Storage)
Create Bucket:
In OCI Console, go to Storage > Buckets.
Click Create Bucket. Name it examsphere-uploads. Set visibility to No Public Access (we will use pre-signed URLs).
Generate Auth Token (S3 Credentials):
Go to your User Settings (Profile icon > My Profile).
Click Auth Tokens > Generate Token.
Save the generated token securely. You will use this as your ORACLE_OBJECT_STORAGE_SECRET_KEY.
Gather Required Info:
ORACLE_OBJECT_STORAGE_NAMESPACE: Found on the Bucket details page.
ORACLE_OBJECT_STORAGE_REGION: e.g., us-ashburn-1.
ORACLE_OBJECT_STORAGE_ACCESS_KEY: Your OCI username (e.g., oracleidentitycloudservice/your.email@example.com or ocid1.user.oc1...). Note: For S3 compatibility, usually the tenancy namespace + username is used, but standard Auth Token + Username is the standard S3 credential pair.
Phase 3: Application Deployment (Vercel)
Import Repository:
Log in to Vercel.
Click Add New > Project.
Import your ExamSphere GitHub repository.
Configure Project:
Framework Preset: Next.js (should be auto-detected).
Root Directory: ./ (Leave as default).
Build Command: pnpm build (Leave as default if auto-detected).
Install Command: pnpm install (Leave as default).
Set Environment Variables:
Go to Settings > Environment Variables.
Add all the variables from docs/ENV_CHECKLIST.md or your .env.example file.
Crucial Variables:
DATABASE_URL: The string from Phase 1.
ORACLE_WALLET_BASE64: The string from Phase 1.
STORAGE_DRIVER: oracle
ORACLE_OBJECT_STORAGE_*: Values from Phase 2.
AUTH_SECRET: A new 32+ character random string.
AI_PREFERRED_PROVIDER & associated API keys.
RAZORPAY_* keys (if accepting payments).
RESEND_API_KEY (for emails).
Note: Ensure these are set for the Production environment.
Deploy:
Click Deploy.
Wait for the build to complete. Vercel will automatically run prisma generate during the build.
Custom Domains:
Go to Settings > Domains.
Add your root domain (e.g., examsphere.com).
Add your wildcard domain for multi-tenancy (e.g., *.examsphere.com).
Note: Vercel handles wildcard DNS automatically once you point an A record or CNAME to them. Ensure your DNS provider has a * record pointing to cname.vercel-dns.com.
Phase 4: CI/CD Pipeline (GitHub Actions)
To automate deployments on every push to main:

Get Vercel Tokens:
In Vercel, go to Settings > Tokens. Generate a new token.
Get your Vercel User ID (found in Vercel account settings) and Project ID (found in the project settings .vercel directory or project dashboard URL).
Configure GitHub Secrets:
In your GitHub repository, go to Settings > Secrets and variables > Actions.
Add the following repository secrets:
VERCEL_TOKEN: The token generated above.
VERCEL_ORG_ID: Your Vercel User ID.
VERCEL_PROJECT_ID: Your Vercel Project ID.
Triggering Deployments:
The workflow (.github/workflows/deploy.yml) is already configured.
Any push to the main branch will now trigger a production build and deployment on Vercel automatically via the CLI.
Phase 5: Post-Deployment Verification
Health Check:
Visit https://yourdomain.com/api/health.
Ensure it returns: { "status": "healthy", "database": "connected", ... }.
Seed Database (If not done in Phase 1):
If you didn't run the seeds against the production DB, run them now via a local script connecting to the cloud DB:
DATABASE_URL="oracle://..." ORACLE_WALLET_BASE64="..." pnpm prisma db seed
Configure Payment Webhooks:
Log in to your Razorpay dashboard.
Go to Settings > Webhooks.
Add a webhook for https://yourdomain.com/api/v1/payments/webhooks.
Subscribe to payment.captured events.
Test Core Flows:
Register a student.
Take a mock test.
Verify AI tutor works.
Verify analytics dashboard populates.
Rollback Strategy
Application Rollback
In Vercel Dashboard, go to Deployments.
Find the last known stable deployment.
Click the three dots (...) next to it and select Promote to Production.
Database Rollback
Oracle Autonomous Database provides automatic backups.
Use the OCI Console to restore the database to a specific point in time (PITR) if a catastrophic migration or data corruption occurs.
Always test migrations against a staging database first.
