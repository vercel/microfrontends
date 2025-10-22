import { flag } from 'flags/next';

export const isFlaggedDocsPathEnabled = flag<boolean>({
  key: 'is-flagged-docs-path-enabled',
  description: 'Enables routing to /flagged/docs in the docs microfrontend.',
  decide() {
    return true;
  },
});
