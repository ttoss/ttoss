import { Meta, Story } from '@storybook/react-webpack5';
import { Flex, Label, Select, Text, TextProps, useTheme } from '@ttoss/ui';
import * as React from 'react';

type TypographyProps = {
  tag: TextProps['as'];
  content: string;
};

const Typography = ({ content, tag }: TypographyProps) => {
  const { theme } = useTheme();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const details = theme.text[tag];

  return (
    <Text as={tag} sx={{ gap: 3, alignItems: 'center' }}>
      {content}

      {details && (
        <Text sx={{ fontSize: '12px', marginTop: 2 }} as="pre">
          {`Details ${tag}: ${JSON.stringify(details)}`}
        </Text>
      )}
    </Text>
  );
};

export default {
  title: 'Design System/Typography',
  component: Typography,
} as Meta;

const Template: Story = (args) => {
  const examples = (
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as Array<TextProps['as']>
  ).map((tag) => {
    return {
      tag,
      content: `${args.text} ${tag}`,
    };
  });

  return (
    <Flex sx={{ flexDirection: 'column', gap: 2 }}>
      {examples.map((example) => {
        return (
          <Typography key={`typography-tag-${example.tag}`} {...example} />
        );
      })}
    </Flex>
  );
};

export const Example = Template.bind({});

Example.args = {
  text: 'Content built with tag',
};

const TemplateFontSizes: Story = () => {
  const { theme } = useTheme();

  const fontSizes = React.useMemo(() => {
    if (!theme.fontSizes) {
      return [];
    }

    if (Array.isArray(theme.fontSizes)) {
      return theme.fontSizes.map((font, i) => {
        return {
          key: `Index ${i}`,
          valueDisplay: `${font}px`,
          value: i,
        };
      });
    }

    const entries = Object.entries(theme.fontSizes);

    return entries.map(([key, value]) => {
      return {
        key,
        value,
        valueDisplay: value,
      };
    });
  }, [theme.fontSizes]);

  return (
    <Flex sx={{ flexDirection: 'column', gap: 2 }}>
      {fontSizes.length > 0 ? (
        fontSizes.map((item) => {
          return (
            <Text key={item.key} sx={{ fontSize: item.value }}>
              {`${item.key}: ${item.valueDisplay}`}
            </Text>
          );
        })
      ) : (
        <Text>Any fontSizes key was defined in the theme</Text>
      )}
    </Flex>
  );
};

export const FontSizes = TemplateFontSizes.bind({});

const TemplateFontWeights: Story = () => {
  const { theme } = useTheme();

  const fontWeights = React.useMemo(() => {
    if (!theme.fontWeights) {
      return [];
    }

    const entries = Object.entries(theme.fontWeights);

    return entries.map(([key, value]) => {
      return {
        key,
        value,
      };
    });
  }, [theme.fontWeights]);

  return (
    <Flex sx={{ flexDirection: 'column', gap: 2 }}>
      {fontWeights.length > 0 ? (
        fontWeights.map((item) => {
          return (
            <Text
              key={item.key}
              sx={{ fontSize: '20px', fontWeight: item.value }}
            >
              {`${item.key}: ${item.value}`}
            </Text>
          );
        })
      ) : (
        <Text>Any fontWeights key was defined in the theme</Text>
      )}
    </Flex>
  );
};

export const FontWeights = TemplateFontWeights.bind({});

const TemplateLetterSpacing: Story = () => {
  const { theme } = useTheme();

  const letterSpacings = React.useMemo(() => {
    if (!theme.letterSpacings) {
      return [];
    }

    const entries = Object.entries(theme.letterSpacings);

    return entries.map(([key, value]) => {
      return {
        key,
        value,
      };
    });
  }, [theme.letterSpacings]);

  return (
    <Flex sx={{ flexDirection: 'column', gap: 2 }}>
      {letterSpacings.length > 0 ? (
        letterSpacings.map((item) => {
          return (
            <Text
              key={item.key}
              sx={{ fontSize: '20px', letterSpacing: item.value }}
            >
              {`${item.key}: ${item.value}`}
            </Text>
          );
        })
      ) : (
        <Text>Any letterSpacings key was defined in the theme</Text>
      )}
    </Flex>
  );
};

export const LetterSpacing = TemplateLetterSpacing.bind({});

const TemplateFontFamily: Story = () => {
  const { theme } = useTheme();

  const fontFamilies = React.useMemo(() => {
    if (!theme.fonts) {
      return [];
    }

    const entries = Object.entries(theme.fonts);

    return entries.map(([key, value]) => {
      return {
        key,
        value,
      };
    });
  }, [theme.fonts]);

  return (
    <Flex sx={{ flexDirection: 'column', gap: 2 }}>
      {fontFamilies.length > 0 ? (
        fontFamilies.map((item) => {
          return (
            <Text
              key={item.key}
              sx={{ fontSize: '20px', fontFamily: item.value }}
            >
              {`${item.key}: ${item.value}`}
            </Text>
          );
        })
      ) : (
        <Text>Any fontFamilies key was defined in the theme</Text>
      )}
    </Flex>
  );
};

export const FontFamily = TemplateFontFamily.bind({});

const TemplateDynamic: Story = (args) => {
  const { theme } = useTheme();

  const fontFamilies = React.useMemo(() => {
    if (!theme.fonts) {
      return [];
    }

    const entries = Object.entries(theme.fonts);

    return entries.map(([key, value]) => {
      return {
        key,
        value,
      };
    });
  }, [theme.fonts]);

  const letterSpacings = React.useMemo(() => {
    if (!theme.letterSpacings) {
      return [];
    }

    const entries = Object.entries(theme.letterSpacings);

    return entries.map(([key, value]) => {
      return {
        key,
        value,
      };
    });
  }, [theme.letterSpacings]);

  const fontWeights = React.useMemo(() => {
    if (!theme.fontWeights) {
      return [];
    }

    const entries = Object.entries(theme.fontWeights);

    return entries.map(([key, value]) => {
      return {
        key,
        value,
      };
    });
  }, [theme.fontWeights]);

  const fontSizes = React.useMemo(() => {
    if (!theme.fontSizes) {
      return [];
    }

    if (Array.isArray(theme.fontSizes)) {
      return theme.fontSizes.map((font, i) => {
        return {
          key: `Index ${i}`,
          valueDisplay: `${font}px`,
          value: i,
        };
      });
    }

    const entries = Object.entries(theme.fontSizes);

    return entries.map(([key, value]) => {
      return {
        key,
        value,
        valueDisplay: value,
      };
    });
  }, [theme.fontSizes]);

  const [fontFamily, setFontFamily] = React.useState(
    fontFamilies[0]?.value || ''
  );

  const [letterSpacing, setLetterSpacing] = React.useState(
    letterSpacings[0]?.value || ''
  );

  const [fontWeight, setFontWeight] = React.useState(
    fontWeights[0]?.value || ''
  );

  const [fontSize, setFontSize] = React.useState(fontSizes?.[0]?.value || '');

  return (
    <Flex sx={{ flexDirection: 'column', gap: 4 }}>
      <Text sx={{ fontFamily, letterSpacing, fontWeight, fontSize }}>
        {args.content}
      </Text>

      <Flex sx={{ flexDirection: 'column', alignItems: 'start' }}>
        <Label>Font Family</Label>
        <Select
          onChange={(e) => {
            return setFontFamily(e.target.value);
          }}
        >
          {fontFamilies.map(({ key, value }) => {
            return (
              <option key={key} value={value as string}>
                {`${key}: ${value}`}
              </option>
            );
          })}
        </Select>

        <Label sx={{ marginTop: 3 }}>Letter Spacing</Label>

        <Select
          onChange={(e) => {
            return setLetterSpacing(e.target.value);
          }}
        >
          {letterSpacings.map(({ key, value }) => {
            return (
              <option key={key} value={value as string}>
                {`${key}: ${value}`}
              </option>
            );
          })}
        </Select>

        <Label sx={{ marginTop: 3 }}>Font Weight</Label>

        <Select
          onChange={(e) => {
            return setFontWeight(e.target.value);
          }}
        >
          {fontWeights.map(({ key, value }) => {
            return (
              <option key={key} value={value as string}>
                {`${key}: ${value}`}
              </option>
            );
          })}
        </Select>

        <Label sx={{ marginTop: 3 }}>Font Size</Label>

        <Select
          onChange={(e) => {
            return setFontSize(e.target.value);
          }}
        >
          {fontSizes.map(({ key, value }) => {
            return (
              <option key={key} value={value as string}>
                {`${key}: ${value}`}
              </option>
            );
          })}
        </Select>
      </Flex>
    </Flex>
  );
};

export const Dynamic = TemplateDynamic.bind({});

Dynamic.args = {
  content: 'Content to test the Typography',
};
