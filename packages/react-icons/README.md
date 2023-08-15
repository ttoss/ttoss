# @ttoss/react-icons

**@ttoss/react-icons** is a library of icons for React applications based on [Iconify](https://iconify.design/).

## Installation

```shell
pnpm add @ttoss/react-icons
```

## Quickstart

```tsx
import { Icon } from '@ttoss/ui';

export const IconExample = () => {
  return (
    <Icon icon="mdi-light:alarm-panel" style={{ color: 'red' }} width={100} />
  );
};
```

## API

### Icons

Our icon module is powered by [Iconify](https://iconify.design/), as this have an awesome open source icon collection.
To use it, just import `Icon` and start using. The styling is maded the same as Iconify and all his icons are available for using.

Please refer to our storybook to see some examples of use.

Please, refer to [Iconify docs](https://docs.iconify.design/icon-components/react/) for the parameters and more control over icons

```tsx
import { Icon } from '@ttoss/react-icons';

export const IconExample = () => {
  return (
    <Icon icon="mdi-light:alarm-panel" style={{ color: 'red' }} width={100} />
  );
};
```

### addIcon

You can add your own icons to the library using `addIcon` function. This function receives the name of the icon and the icon object.

```tsx
import { Icon, addIcon, type IconType } from '@ttoss/react-icons';

const customSearchIcon: IconType = {
  body: `<svg xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" fill="none">
  <path d="M15.8053 15.8013L21 21M10.5 7.5V13.5M7.5 10.5H13.5M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  width: 48,
  height: 48,
};

addIcon('custom-search', customSearchIcon);

export const CustomIcon = () => {
  return (
    <Flex sx={{ gap: 'lg', flexWrap: 'wrap' }}>
      <Flex
        sx={{
          flexDirection: 'column',
          alignItems: 'center',
          width: '120px',
          gap: 'md',
        }}
      >
        <Text sx={{ fontSize: '3xl', color: 'primary' }}>
          <Icon icon="custom-search" />
        </Text>

        <Text sx={{ textAlign: 'center' }}>custom-search</Text>
      </Flex>
    </Flex>
  );
};
```
