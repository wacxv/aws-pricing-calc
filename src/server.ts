// This file is part of the Angular Universal (SSR) setup
// It's a minimal implementation since you're not using SSR
export function app() {
  console.warn('Server-side rendering is not fully configured in this application');
  return {};
}

export function renderModule() {
  return Promise.resolve('');
}
