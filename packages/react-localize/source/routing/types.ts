export interface RouteLocalization {
  readonly locales: string[];
  readonly defaultLocale: string;
  redirectUrl(from: URL, options: {to: string}): URL;
  localeFromUrl(url: URL): string | undefined;
}

export interface ResolvedRouteLocalization extends RouteLocalization {
  readonly locale: string;
}

export interface DefaultLocaleDefinition {
  locale: string;
  nested?: boolean;
}
