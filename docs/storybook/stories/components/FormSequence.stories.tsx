import { FormSequence, type FormSequenceProps } from '@ttoss/components';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Components/FormSequence',
} as Meta;

const Template: Story<FormSequenceProps> = (args) => {
  return (
    <>
      <FormSequence {...args} />
    </>
  );
};

export const Example = Template.bind({});

const options = [
  { value: 'Residência', label: 'Residência' },
  { value: 'Apartamento', label: 'Apartamento' },
  { value: 'Casa em Condomínio', label: 'Casa em Condomínio' },
  { value: 'Comércio', label: 'Comércio' },
  { value: 'Agronegócio', label: 'Agronegócio', disabled: true },
  { value: 'Indústria', label: 'Indústria' },
  { value: 'Condomínio Área Comum', label: 'Condomínio Área Comum' },
];

Example.args = {
  header: {
    variant: 'logo',
    src: 'https://i.pinimg.com/564x/65/cd/13/65cd130e271845aa86c46af153c8a83b.jpg',
    onClose: action('onClose'),
  },
  steps: [
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
        description:
          'Estamos aqui para ajudá-lo com o seu projeto solar. Vamos iniciar a sua cotação.',
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
        description:
          'Estamos aqui para ajudá-lo com o seu projeto solar. Vamos iniciar a sua cotação.',
      },
      fields: [
        {
          fieldName: 'address',
          label: 'Endereço',
          type: 'input',
        },
      ],
    },
  ],
};
