# Emily & Lawrence Wedding Design Lab

An internal creative-direction environment for shaping the visual and motion system of Emily and Lawrence's wedding website. The public homepage is intentionally restrained while the Design Lab is developed separately.

The repository uses Astro with strict TypeScript, static output, and the GitHub Pages project base path `/WedSite2027`.

## Local development

Install dependencies with `pnpm install`, then run `pnpm dev`. With the configured project base, the local homepage is available at `http://localhost:4321/WedSite2027/`.

Run `pnpm validate` before committing. It checks formatting, linting, TypeScript, tests, and the production build.

## GitHub Pages

In the repository settings, open **Pages** and select **GitHub Actions** as the source. The deployment workflow builds and deploys `main`; it can also be run manually from the Actions tab. Pull requests and branch pushes run the validation workflow.

The Design Lab will be a public static route when deployed. `noindex, nofollow` keeps it out of normal search indexing, but obscurity is not access control and the lab must not contain secrets or private guest data.
