// Component test bootstrap: extends Vitest's expect with jest-dom matchers
// (toBeInTheDocument, toHaveTextContent, …) and enforces cleanup between tests
// so DOM state doesn't leak.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});
