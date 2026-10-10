# Pull Environment Variables from Vercel

This guide explains how to pull environment variables from your Vercel project into your local `.env` file.

---

## Prerequisites

- **Vercel CLI installed**

  ```bash
  npm install -g vercel
  ```

- **Logged in to Vercel**

  ```bash
  vercel login
  ```

---

## Linking Your Local Project to Vercel

Before pulling environment variables, make sure your local project is linked to the correct Vercel project. If you haven't already linked it, run:

```bash
vercel link
```

Follow the prompts to select or specify your Vercel project.

---

## Command to Pull Environment Variables

Use the following command to pull all environment variables from your Vercel project:

### Simple

```bash
vercel env pull .env
```

### Advanced (environment specific)

#### Development

```bash
vercel env pull .env.local --environment=development
```

#### Test

```bash
vercel env pull .env.test --environment=preview
```

#### Production

```bash
vercel env pull .env.production --environment=production
```

This will download your project's environment variables and store them in a local `.env` file.

---

## Notes

- The command pulls variables from the selected environment (default is development).
- To pull from another environment, use:

  ```bash
  vercel env pull .env.production --environment=production
  ```

- **Do not commit your `.env` file to version control unless it’s safe to share.**

---

## Useful Links

- [Vercel Environment Variables Docs](https://vercel.com/docs/environment-variables)
