# Architecture rules
- Use the shared `useAltMode` store backed by admin settings for site-wide mode decisions; avoid per-user overrides so every visitor receives the same experience.
- Classify crypto positions through the supported crypto catalog and filter presentation only in crypto-only mode; preserve stored stock/TAMG holdings for restoration.