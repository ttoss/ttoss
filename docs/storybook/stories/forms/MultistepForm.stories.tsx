/* eslint-disable @typescript-eslint/no-explicit-any */
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import {
  FormField,
  FormFieldCurrencyInput,
  FormFieldInput,
  FormFieldRadio,
  yup,
} from '@ttoss/forms';
import { MultistepForm, MultistepFormProps } from '@ttoss/forms/multistep-form';
import {
  Flex,
  Grid,
  Image,
  Label,
  Link,
  Radio,
  Text,
  ThemeUIStyleObject,
} from '@ttoss/ui';

const sxLinks: ThemeUIStyleObject = {
  cursor: 'pointer',
  textDecoration: 'none',
  fontWeight: 'bold',
};

const meta = {
  title: 'Forms/MultistepForm',
  component: MultistepForm,
} satisfies Meta<typeof MultistepForm>;

export default meta;

type Story = StoryObj<typeof MultistepForm>;

const options = [
  { value: 'Residência', label: 'Residência' },
  { value: 'Apartamento', label: 'Apartamento' },
  { value: 'Casa em Condomínio', label: 'Casa em Condomínio' },
  { value: 'Comércio', label: 'Comércio' },
  { value: 'Agronegócio', label: 'Agronegócio', disabled: true },
  { value: 'Indústria', label: 'Indústria' },
  {
    value: 'Condomínio Área Comum',
    label: 'Condomínio Área Comum',
    disabled: true,
  },
];

type MultistepFormFieldRadioImageProps = {
  fieldName: string;
  options: {
    label: string;
    value: string;
    disabled?: boolean;
    src: string;
  }[];
};

const MultistepFormFieldRadioImage = ({
  options,
  fieldName,
}: MultistepFormFieldRadioImageProps) => {
  return (
    <FormField
      name={fieldName}
      render={({ field }) => {
        return (
          <Grid
            sx={{
              gridTemplateColumns: '1fr 1fr 1fr',
              columnGap: '1',
              rowGap: '4',
            }}
          >
            {options.map((option) => {
              const id = `${fieldName}-option-${option.value}`;
              const checked = field.value === option.value;

              return (
                <Label
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    border: checked ? 'default' : 'none',
                    borderColor: 'accent',
                    borderRadius: '9px',
                    overflow: 'hidden',
                    padding: '1',
                    gap: '2',
                    boxShadow: checked
                      ? '1px 1px 2px 0px rgba(4, 105, 227, 0.24), -1px -1px 2px 0px rgba(4, 105, 227, 0.24)'
                      : '',
                    transitionDuration: '0.3s',
                    ':hover': {
                      boxShadow:
                        '1px 1px 2px 0px rgba(4, 105, 227, 0.24), -1px -1px 2px 0px rgba(4, 105, 227, 0.24)',
                    },
                  }}
                  key={id}
                  htmlFor={id}
                >
                  <Image
                    src={option.src}
                    alt={`Option image ${option.label}`}
                    draggable={false}
                    sx={{ borderRadius: 'default' }}
                  />

                  <Flex sx={{ alignSelf: 'start' }}>
                    <Radio
                      id={id}
                      name={fieldName}
                      value={field.value}
                      onChange={() => {
                        return field.onChange(option.value);
                      }}
                      checked={checked}
                    />
                    <Text>{option.label}</Text>
                  </Flex>
                </Label>
              );
            })}
          </Grid>
        );
      }}
    />
  );
};

const steps: MultistepFormProps['steps'] = [
  {
    label: 'Propriedade',
    question: 'Qual tipo de contrato está buscando?',
    flowMessage: {
      variant: 'image-text',
      src: 'https://placehold.co/400',
      description:
        'Estamos aqui para ajudá-lo com o seu projeto solar. Vamos iniciar a sua cotação.',
    },
    schema: yup.object({
      contractType: yup.string().required('Tipo de contrato obrigatório'),
    }),
    fields: <FormFieldRadio name="contractType" options={options} />,
  },
  {
    label: 'Conta de Energia',
    question: 'Qual é a média mensal de sua conta de energia elétrica?',
    flowMessage: {
      variant: 'image-text',
      src: 'https://placehold.co/400',
      description: (
        <>
          Vamos descobrir o número ideal de{' '}
          <Link href="https://www.google.com.br/" sx={sxLinks}>
            painéis solares
          </Link>{' '}
          para cobrir seu consumo de energia.
        </>
      ),
    },
    defaultValues: {
      energyValue: 12345.67,
    },
    schema: yup.object({
      energyValue: yup
        .number()
        .min(0.01, 'Valor mínimo 0,01')
        .typeError('Campo de conta de luz obrigatório')
        .required('Campo de conta de luz obrigatório'),
    }),
    fields: (
      <FormFieldCurrencyInput
        decimalSeparator=","
        prefix="R$"
        thousandSeparator="."
        name="energyValue"
        label="Conta de Luz"
      />
    ),
  },
  {
    label: 'Endereço',
    question: 'Para qual endereço é a instalação?',
    flowMessage: {
      variant: 'image-text',
      src: 'https://placehold.co/400',
      description: (
        <>
          Vamos ver quanta{' '}
          <Link href="https://www.google.com.br/" sx={sxLinks}>
            luz solar
          </Link>{' '}
          seu telhado recebe.
        </>
      ),
    },
    schema: yup.object({
      address: yup.string().required('Endereço obrigatório'),
    }),
    fields: <FormFieldInput name="address" label="Endereço" />,
  },
  {
    label: 'Telhado',
    question: 'Qual o tipo de telhado do local de instalação?',
    flowMessage: {
      variant: 'image-text',
      src: 'https://placehold.co/400',
      description: (
        <>
          Vamos analisar a viabilidade de{' '}
          <Link href="https://www.google.com.br/" sx={sxLinks}>
            instalação
          </Link>{' '}
          dos painéis solares no seu local.
        </>
      ),
    },
    schema: yup.object({
      installType: yup.string().required('Tipo de instalação obrigatório'),
    }),
    defaultValues: {
      installType: 'label-3',
    },
    fields: (
      <MultistepFormFieldRadioImage
        fieldName="installType"
        options={[
          {
            label: 'Label 1',
            src: 'https://placehold.co/400',
            value: 'label-1',
          },
          {
            label: 'Label 2',
            src: 'https://placehold.co/400',
            value: 'label-2',
          },
          {
            label: 'Label 3',
            src: 'https://placehold.co/400',
            value: 'label-3',
          },
          {
            label: 'Label 4',
            src: 'https://placehold.co/400',
            value: 'label-4',
          },
          {
            label: 'Label 5',
            src: 'https://placehold.co/400',
            value: 'label-5',
          },
          {
            label: 'Label 6',
            src: 'https://placehold.co/400',
            value: 'label-6',
          },
        ]}
      />
    ),
  },
  {
    label: 'Contato',
    question: 'Para onde podemos enviar uma cópia da cotação?',
    flowMessage: {
      variant: 'image-text',
      src: 'https://placehold.co/400',
      description: (
        <>
          Sua cotação está pronta na{' '}
          <Link href="https://www.google.com.br/" sx={sxLinks}>
            próxima página.
          </Link>
        </>
      ),
    },
    defaultValues: {},
    schema: yup.object({
      name: yup.string().required('O Campo nome é obrigatório'),
      email: yup
        .string()
        .email('Insira um email válido')
        .required('O campo email é obrigatório'),
    }),
    fields: (
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldInput name="name" label="Nome" />
        <FormFieldInput name="email" label="Email" />
      </Flex>
    ),
  },
];

export const HeaderLogo: Story = {
  args: {
    header: {
      variant: 'logo',
      src: 'https://placehold.co/115',
      onClose: action('onClose'),
    },
    steps,
    onSubmit: action('onSubmit'),
  },
};

export const HeaderTitled: Story = {
  args: {
    header: {
      variant: 'titled',
      title: 'Teste',
      leftIcon: 'radio-not-selected',
      rightIcon: 'radio-not-selected',
      onLeftIconClick: action('leftIconClick'),
      onRightIconClick: action('rightIconClick'),
    },
    steps,
    onSubmit: action('onSubmit'),
  },
};
