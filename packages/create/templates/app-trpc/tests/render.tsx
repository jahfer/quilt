import '@quilted/quilt/matchers';

import {
  createRender,
  QuiltAppTesting,
  createTestRouter,
} from '@quilted/quilt/testing';

import {
  AppContextReact,
  type AppContext as AppContextType,
} from '~/shared/context.ts';

type Router = ReturnType<typeof createTestRouter>;

export {createTestRouter};

export interface RenderOptions {
  /**
   * A custom router to use for this component test. You can use a
   * custom router to simulate a particular URL, and you can spy on
   * its navigation method to check that components navigate as
   * you expect.
   */
  router?: Router;

  /**
   * A custom locale to use for this component test.
   */
  locale?: string;
}

export interface RenderContext extends AppContextType {
  /**
   * The router used for this component test.
   */
  router: Router;
}

export interface RenderActions extends Record<string, never> {}

/**
 * Renders a component with test-friendly versions of all global
 * context available to the application.
 */
export const renderWithAppContext = createRender<
  RenderOptions,
  RenderContext,
  RenderActions,
  true
>({
  // Create context that can be used by the `render` function, and referenced by test
  // authors on the `root.context` property. Context is used to share data between your
  // React tree and your test code, and is ideal for mocking out global context providers.
  context({router = createTestRouter()}) {
    return {router};
  },
  // Render all of our app-wide context providers around each component under test.
  render(element, context, {locale}) {
    const {router} = context;

    return (
      <QuiltAppTesting routing={router} localization={locale}>
        <AppContextReact.Provider value={context}>
          {element}
        </AppContextReact.Provider>
      </QuiltAppTesting>
    );
  },
  async afterRender() {
    // If your components need to resolve data before they can render, you can
    // use this hook to wait for that data to be ready. This will cause the
    // `render` function to return a promise, so that the component is only usable
    // once the data is ready.
  },
});
