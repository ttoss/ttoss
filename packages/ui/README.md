# @ttoss/ui

## 📚 About

<strong> @ttoss/ui</strong> is a easiest way to use Ui components in your React application.

## 🚀 Getting Started

### Install @ttoss/ui

```shell
$ yarn add @ttoss/ui
# or
$ npm install @ttoss/ui
```

## 📄 Examples of use

```tsx
import { Flex, Text, Box, Button } from "@ttoss/ui";

const App = () => {
  return (
    <ThemeProvider>
      <Flex sx={{ flexDirection: "column" }}>
        <Text>Text Value</Text>
        <Box>
          <Text>Text Value</Text>

          <Button>Button Primary</Button>
        </Box>
      </Flex>
    </ThemeProvider>
  );
};

export default App;
```

### Loading Fonts

You can pass fonts URLs to `ThemeProvider` component thought `fonts` prop.

```tsx
<ThemeProvider
  fonts={[
    "https://fonts.googleapis.com/css?family=Roboto:400,500,700&display=swap",
    "https://fonts.googleapis.com/css?family=Roboto+Mono&display=swap",
  ]}
>
  <App />
</ThemeProvider>
```
