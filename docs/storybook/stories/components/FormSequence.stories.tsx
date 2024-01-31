/* eslint-disable @typescript-eslint/no-explicit-any */
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { Link, ThemeUIStyleObject } from '@ttoss/ui';
import { Multistep, MultistepProps } from '@ttoss/components';

const sxLinks: ThemeUIStyleObject = {
  cursor: 'pointer',
  textDecoration: 'none',
  fontWeight: 'bold',
};

const meta = {
  title: 'Components/Multistep',
  component: Multistep,
} satisfies Meta<typeof Multistep>;

export default meta;

type Story = StoryObj<typeof Multistep>;

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

const steps: MultistepProps['steps'] = [
  {
    label: 'Propriedade',
    question: 'Qual tipo de contrato está buscando?',
    flowMessage: {
      variant: 'image-text',
      src: 'https://placehold.co/400',
      description:
        'Estamos aqui para ajudá-lo com o seu projeto solar. Vamos iniciar a sua cotação.',
    },
    fields: [
      {
        fieldName: 'contractType',
        options,
        variant: 'radio',
        defaultValue: options[3].value,
      },
    ],
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
    fields: [
      {
        fieldName: 'energyValue',
        label: 'Conta de Luz',
        variant: 'currency',
      },
    ],
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
    fields: [
      {
        fieldName: 'address',
        label: 'Endereço',
        variant: 'input',
      },
    ],
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
    fields: [
      {
        variant: 'radio-image',
        fieldName: 'installType',
        defaultValue: 'label-3',
        options: [
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
        ],
      },
    ],
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
    fields: [
      {
        variant: 'input',
        fieldName: 'name',
        label: 'Nome',
      },
      {
        variant: 'input',
        fieldName: 'email',
        label: 'Email',
      },
    ],
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
      leftIconClick: action('leftIconClick'),
      rightIconClick: action('rightIconClick'),
    },
    steps,
    onSubmit: action('onSubmit'),
  },
};
