import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Button, Flex, Text } from '@ttoss/ui';

import type { OnSocialSignIn, SocialProvider } from './types';

const messages = defineMessages({
  divider: {
    defaultMessage: 'or',
    description: 'Divider between the password form and the social buttons.',
  },
  continueWith: {
    defaultMessage: 'Continue with {provider}',
    description: 'Label of the button that signs in with a social provider.',
  },
});

const PROVIDER_ICONS: Record<SocialProvider, string> = {
  Google: 'logos:google-icon',
  Facebook: 'mdi:facebook',
};

/**
 * Literal brand colors, not theme tokens: each provider's branding guidelines
 * fix the button's look, and a themed variant would break them. Google: white
 * fill, #747775 1px stroke, #1F1F1F text, Roboto Medium
 * (https://developers.google.com/identity/branding-guidelines). Facebook:
 * #1877F2 fill with white text.
 */
const PROVIDER_BUTTON_SX: Record<SocialProvider, Record<string, unknown>> = {
  Google: {
    backgroundColor: '#FFFFFF',
    color: '#1F1F1F',
    border: '1px solid #747775',
    fontFamily: "'Roboto', arial, sans-serif",
    fontWeight: 500,
    ':hover:not(:disabled)': { backgroundColor: '#F2F2F2', color: '#1F1F1F' },
  },
  Facebook: {
    backgroundColor: '#1877F2',
    color: '#FFFFFF',
    border: '1px solid #1877F2',
    ':hover:not(:disabled)': { backgroundColor: '#166FE5', color: '#FFFFFF' },
  },
};

export type AuthSocialSignInProps = {
  /** Identity providers to offer, in the order they are rendered. */
  providers: SocialProvider[];
  /** Called with the chosen provider when the user clicks its button. */
  onSocialSignIn: OnSocialSignIn;
};

/**
 * Renders one sign-in button per federated identity provider, separated from
 * the email/password form by a divider. Renders nothing when no provider is
 * configured.
 */
export const AuthSocialSignIn = ({
  providers,
  onSocialSignIn,
}: AuthSocialSignInProps) => {
  const { intl } = useI18n();

  if (providers.length === 0) {
    return null;
  }

  return (
    <Flex sx={{ flexDirection: 'column', gap: '7', marginTop: '8' }}>
      <Flex sx={{ alignItems: 'center', gap: '4' }}>
        <Flex
          sx={{
            flex: 1,
            height: '1px',
            backgroundColor: 'display.border.muted.default',
          }}
        />
        <Text sx={{ color: 'display.text.muted.default' }}>
          {intl.formatMessage(messages.divider)}
        </Text>
        <Flex
          sx={{
            flex: 1,
            height: '1px',
            backgroundColor: 'display.border.muted.default',
          }}
        />
      </Flex>

      {providers.map((provider) => {
        return (
          <Button
            key={provider}
            type="button"
            leftIcon={PROVIDER_ICONS[provider]}
            sx={{ justifyContent: 'center', ...PROVIDER_BUTTON_SX[provider] }}
            onClick={() => {
              return onSocialSignIn({ provider });
            }}
          >
            {intl.formatMessage(messages.continueWith, { provider })}
          </Button>
        );
      })}
    </Flex>
  );
};
