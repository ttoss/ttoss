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
  Facebook: 'logos:facebook',
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
            variant="secondary"
            leftIcon={PROVIDER_ICONS[provider]}
            sx={{ justifyContent: 'center' }}
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
