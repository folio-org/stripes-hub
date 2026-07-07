import transformViteGlobForJest from './babel-plugin-transform-vite-glob-for-jest.js';

export default (api) => {
  const isTest = api.env('test');

  return {
    plugins: [
      'babel-plugin-transform-vite-meta-env',
      isTest && transformViteGlobForJest,
    ].filter(Boolean),
  };
};
