// `Cloudflare.Env` は `wrangler types`（worker-configuration.d.ts）が
// wrangler.jsonc の bindings から自動生成する型。ENVIRONMENT は wrangler.jsonc の
// vars 値から literal type ("development") として推論されるため、比較に使えるよう
// string へ広げる。
export type Env = Omit<Cloudflare.Env, "ENVIRONMENT"> & {
  ENVIRONMENT?: string;
};
