import {
  Form,
  FormFieldCheckbox,
  FormFieldInput,
  FormFieldPassword,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { useI18n } from '@ttoss/react-i18n';
import { NotificationsBox } from '@ttoss/react-notifications';
import { Flex, Link, Text } from '@ttoss/ui';
import * as React from 'react';

import { AuthCard } from './AuthCard';
import type { OnSignUp, OnSignUpInput, SignUpTerms } from './types';

export type AuthSignUpProps = {
  onSignUp: OnSignUp;
  onGoToSignIn: () => void;
  signUpTerms?: SignUpTerms;
  passwordMinimumLength?: number;
};

export const AuthSignUp = (props: AuthSignUpProps) => {
  const { intl } = useI18n();
  const { passwordMinimumLength = 8 } = props;

  const schema = React.useMemo(() => {
    return yup.object().shape({
      email: yup
        .string()
        .required(
          intl.formatMessage({
            description: 'Email is a required field.',
            defaultMessage: 'Enter your email address',
          })
        )
        .email(
          intl.formatMessage({
            description: 'Invalid email.',
            defaultMessage: 'Invalid email',
          })
        ),
      password: yup
        .string()
        .required(
          intl.formatMessage({
            description: 'Password is required.',
            defaultMessage: 'Password field is required',
          })
        )
        .min(
          passwordMinimumLength,
          intl.formatMessage(
            {
              description: 'Password must be at least {value} characters long.',
              defaultMessage: 'Password requires {value} characters',
            },
            { value: passwordMinimumLength }
          )
        )
        .trim(),
      confirmPassword: yup
        .string()
        .required(
          intl.formatMessage({
            description: 'Confirm Password is required.',
            defaultMessage: 'Confirm password field is required',
          })
        )
        .oneOf(
          [yup.ref('password')],
          intl.formatMessage({
            description: 'Passwords are not the same',
            defaultMessage: 'Passwords are not the same',
          })
        ),
      signUpTerms: props.signUpTerms?.isRequired
        ? yup.boolean().required(
            intl.formatMessage({
              defaultMessage: 'You must accept the terms and conditions',
            })
          )
        : yup.boolean(),
    });
  }, [intl, props.signUpTerms?.isRequired, passwordMinimumLength]);

  const signUpTermsLabel = React.useMemo(() => {
    if (!props.signUpTerms) {
      return null;
    }

    const signUpTermsFirstMessage = intl.formatMessage({
      defaultMessage:
        'By signing up, you agree to the following Terms and Conditions.',
    });

    const termsLinks = props.signUpTerms.terms.map((term, index, terms) => {
      const finalPunctuation = index === terms.length - 1 ? '.' : ', ';

      return (
        <React.Fragment key={index}>
          <Link key={index} href={term.url} target="_blank" rel="noreferrer">
            {term.label}
          </Link>
          {finalPunctuation}
        </React.Fragment>
      );
    });

    const label = (
      <Text>
        {signUpTermsFirstMessage} {termsLinks}
      </Text>
    );

    return label;
  }, [intl, props.signUpTerms]);

  const signUpTermsNode = React.useMemo(() => {
    if (!props.signUpTerms) {
      return null;
    }

    if (props.signUpTerms.isRequired) {
      return <FormFieldCheckbox name="signUpTerms" label={signUpTermsLabel} />;
    } else {
      return <>{signUpTermsLabel}</>;
    }
  }, [props.signUpTerms, signUpTermsLabel]);

  const formMethods = useForm<OnSignUpInput>({
    mode: 'onBlur',
    resolver: yupResolver(schema),
  });

  const onSubmitForm = (data: OnSignUpInput) => {
    return props.onSignUp(data);
  };

  return (
    <Form
      sx={{ maxWidth: '390px', width: '100%' }}
      {...formMethods}
      onSubmit={onSubmitForm}
    >
      <AuthCard
        buttonLabel={intl.formatMessage({
          description: 'Create account.',
          defaultMessage: 'Sign up',
        })}
        title={intl.formatMessage({
          description: 'Title on sign up.',
          defaultMessage: 'Sign up',
        })}
        isValidForm={formMethods.formState.isValid}
        extraButton={
          <Text
            sx={{ cursor: 'pointer' }}
            onClick={props.onGoToSignIn}
            as={Link}
          >
            {intl.formatMessage({
              description: 'Link to sign in on sign up.',
              defaultMessage: "I'm already registered",
            })}
          </Text>
        }
      >
        <Flex sx={{ flexDirection: 'column', gap: 'xl' }}>
          <FormFieldInput
            name="email"
            label={intl.formatMessage({
              description: 'Email label.',
              defaultMessage: 'Email',
            })}
          />
          <FormFieldPassword
            name="password"
            label={intl.formatMessage({
              description: 'Password label.',
              defaultMessage: 'Password',
            })}
          />
          <FormFieldPassword
            name="confirmPassword"
            label={intl.formatMessage({
              description: 'Confirm Password label.',
              defaultMessage: 'Confirm password',
            })}
          />
          {signUpTermsNode}
        </Flex>

        <NotificationsBox />
      </AuthCard>
    </Form>
  );
};
