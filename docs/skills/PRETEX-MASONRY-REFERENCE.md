# Pretext and masonry reference

The previous build used an invalid package name, `@shipitandpray/pretext-masonry`. That package is not the repository the project was supposed to use and it causes `pnpm install` to fail with a registry 404.

The correct project is:

- https://github.com/chenglou/pretext
- npm package: `@chenglou/pretext`

Pretext is a text measurement and layout library. Its documented use cases include measuring text heights and enabling userland layouts such as masonry. The current published version is `0.0.9`.

This frontend now uses `@chenglou/pretext` directly and includes a small local `PretextMasonry` component. The component uses Pretext's `prepare()` and `layout()` APIs to estimate content height and distribute cards across the shortest column. This keeps the dependency correct and avoids depending on an unverified third-party masonry package.

The component is intentionally small and project-owned so it can later be replaced by a virtualized implementation when the gallery becomes large. For the current government/professional interface, the card set remains intentionally lightweight and the masonry section is secondary to the record-room workflows.
