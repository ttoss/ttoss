# FAQ

### Why `@iconify-icon/react` is on the list of devDependencies?

If we install `@iconify-icon/react` as a dependency, it won't be included in the final bundle and it breaks Storybook build. So we install it as a devDependency to add it to the bundle to make Storybook work.
