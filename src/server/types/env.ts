// `Cloudflare.Env` は `wrangler types`（worker-configuration.d.ts）が
// wrangler.jsonc の bindings から自動生成する型。ENVIRONMENT は wrangler.jsonc の
// vars 値から literal type ("development") として推論されるため、比較に使えるよう
// string へ広げる。
export type Env = Omit<Cloudflare.Env, "ENVIRONMENT"> & {
  ENVIRONMENT?: string;
  AI_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  MINIMAX_API_KEY?: string;
  MINIMAX_MODEL?: string;
};
