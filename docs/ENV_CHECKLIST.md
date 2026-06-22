ExamSphere — Production Environment Checklist
Before deploying ExamSphere to production, ensure the following environment variables are configured in your Vercel Project Settings (or your hosting provider's environment variables interface).

1. Core Application
 NODE_ENV: production
 APP_URL: https://examsphere.com (Your primary production domain)
 AUTH_SECRET: Generate a random string of at least 32 characters (e.g., openssl rand -base64 32).
 AUTH_URL: https://examsphere.com (Used by Auth.js for callbacks)
2. Database (Oracle Autonomous Database)
 DATABASE_URL: oracle://USER:PASSWORD@HOST:PORT/SERVICE_NAME (Ensure the user has appropriate permissions).
 ORACLE_WALLET_BASE64: Base64 encoded string of your Oracle Wallet ZIP file. (Command: base64 -w 0 Wallet_DatabaseName.zip).
3. Storage (Oracle Object Storage)
 STORAGE_DRIVER: oracle
 ORACLE_OBJECT_STORAGE_NAMESPACE: Your Oracle Cloud Object Storage namespace.
 ORACLE_OBJECT_STORAGE_REGION: e.g., us-ashburn-1 or ap-mumbai-1.
 ORACLE_OBJECT_STORAGE_BUCKET: e.g., examsphere-uploads.
 ORACLE_OBJECT_STORAGE_ACCESS_KEY: Generated Auth Token from Oracle Cloud.
 ORACLE_OBJECT_STORAGE_SECRET_KEY: The Secret key associated with the Auth Token.
4. AI Providers (Configure at least one)
 AI_PREFERRED_PROVIDER: e.g., OPENAI (Fallback: GEMINI)
 OPENAI_API_KEY: (Optional) Your OpenAI API key.
 GEMINI_API_KEY: (Optional) Your Google Gemini API key.
 ANTHROPIC_API_KEY: (Optional) Your Anthropic API key.
 GLM_API_KEY: (Optional) Your Zhipu GLM API key.
 DEEPSEEK_API_KEY: (Optional) Your DeepSeek API key.
5. Email (Resend)
 RESEND_API_KEY: Your Resend.com API key for transactional emails.
6. Payments (Razorpay)
 RAZORPAY_KEY_ID: Your Razorpay Key ID.
 RAZORPAY_KEY_SECRET: Your Razorpay Key Secret.
 Ensure the Razorpay Webhook URL is set to https://examsphere.com/api/v1/payments/webhooks in your Razorpay dashboard.