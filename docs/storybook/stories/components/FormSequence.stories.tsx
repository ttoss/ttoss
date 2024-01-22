/* eslint-disable @typescript-eslint/no-explicit-any */
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { FormSequence, FormSequenceProps } from '@ttoss/components';
import { Link, ThemeUIStyleObject } from '@ttoss/ui';

const sxLinks: ThemeUIStyleObject = {
  cursor: 'pointer',
  textDecoration: 'none',
  fontWeight: 'bold',
};

const meta = {
  title: 'Components/FormSequence',
  component: FormSequence,
} satisfies Meta<typeof FormSequence>;

export default meta;

type Story = StoryObj<typeof FormSequence>;

const options = [
  { value: 'Residência', label: 'Residência' },
  { value: 'Apartamento', label: 'Apartamento' },
  { value: 'Casa em Condomínio', label: 'Casa em Condomínio' },
  { value: 'Comércio', label: 'Comércio' },
  { value: 'Agronegócio', label: 'Agronegócio', disabled: true },
  { value: 'Indústria', label: 'Indústria' },
  { value: 'Condomínio Área Comum', label: 'Condomínio Área Comum' },
];

const steps: FormSequenceProps['steps'] = [
  {
    question: 'Qual tipo de contrato está buscando?',
    flowMessage: {
      variant: 'image-text',
      src: 'https://s.glbimg.com/jo/g1/f/original/2011/05/17/qrcode.jpg',
      description:
        'Estamos aqui para ajudá-lo com o seu projeto solar. Vamos iniciar a sua cotação.',
    },
    fields: [
      {
        fieldName: 'contractType',
        options,
        type: 'radio',
        defaultValue: options[3].value,
      },
    ],
  },
  {
    question: 'Qual é a média mensal de sua conta de energia elétrica?',
    flowMessage: {
      variant: 'image-text',
      src: 'https://s.glbimg.com/jo/g1/f/original/2011/05/17/qrcode.jpg',
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
        type: 'currency',
      },
    ],
  },
  {
    question: 'Para qual endereço é a instalação?',
    flowMessage: {
      variant: 'image-text',
      src: 'https://s.glbimg.com/jo/g1/f/original/2011/05/17/qrcode.jpg',
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
        type: 'input',
      },
    ],
  },
  {
    question: 'Qual o tipo de telhado do local de instalação?',
    flowMessage: {
      variant: 'image-text',
      src: 'https://s.glbimg.com/jo/g1/f/original/2011/05/17/qrcode.jpg',
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
    fields: [],
  },
  {
    question: 'Para onde podemos enviar uma cópia da cotação?',
    flowMessage: {
      variant: 'image-text',
      src: 'https://s.glbimg.com/jo/g1/f/original/2011/05/17/qrcode.jpg',
      description: (
        <>
          Sua cotação está pronta na{' '}
          <Link href="https://www.google.com.br/" sx={sxLinks}>
            próxima página.
          </Link>
        </>
      ),
    },
    fields: [],
  },
];

export const HeaderLogo: Story = {
  args: {
    header: {
      variant: 'logo',
      src: 'https://i.pinimg.com/564x/65/cd/13/65cd130e271845aa86c46af153c8a83b.jpg',
      onClose: action('onClose'),
    },
    steps,
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
  },
};
