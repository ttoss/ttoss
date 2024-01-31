import { Multistep, type MultistepStep } from '../../src';
import { fireEvent, render, screen } from '@ttoss/test-utils';

const options = [
  { value: 'residence', label: 'Residence' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condominium-house', label: 'Condominium House' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'agribusiness', label: 'Agribusiness', disabled: true },
  { value: 'industry', label: 'Industry' },
  { value: 'common-area-condominium', label: 'Common Area Condominium' },
];

const step1: MultistepStep = {
  label: 'Property',
  question: 'What type of contract are you looking for?',
  flowMessage: {
    variant: 'image-text',
    src: 'https://placehold.co/400',
    description:
      'We are here to assist you with your solar project. Let us start your quote.',
  },
  fields: [
    {
      fieldName: 'contractType',
      options,
      variant: 'radio',
      defaultValue: options[3].value,
    },
  ],
};

const step2: MultistepStep = {
  label: 'Energy Bill',
  question: 'What is the monthly average of your electricity bill?',
  flowMessage: {
    variant: 'image-text',
    src: 'https://placehold.co/400',
    description: (
      <>
        Lets discover the ideal number of{' '}
        <a href="https://www.google.com/">solar panels</a> to cover your energy
        consumption.
      </>
    ),
  },
  fields: [
    {
      fieldName: 'energyValue',
      label: 'Electricity Bill',
      variant: 'currency',
    },
  ],
};

const step3: MultistepStep = {
  label: 'Address',
  question: 'What is the installation address?',
  flowMessage: {
    variant: 'image-text',
    src: 'https://placehold.co/400',
    description: (
      <>
        Lets see how much <a href="https://www.google.com/">sunlight</a> your
        roof receives.
      </>
    ),
  },
  fields: [
    {
      fieldName: 'address',
      label: 'Address',
      variant: 'input',
    },
  ],
};

const step4: MultistepStep = {
  label: 'Roof',
  question: 'What is the type of roof at the installation site?',
  flowMessage: {
    variant: 'image-text',
    src: 'https://placehold.co/400',
    description: (
      <>
        We will analyze the feasibility of{' '}
        <a href="https://www.google.com/">installation</a> of solar panels at
        your location.
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
};

const step5: MultistepStep = {
  label: 'Contact',
  question: 'Where can we send a copy of the quote?',
  flowMessage: {
    variant: 'image-text',
    src: 'https://placehold.co/400',
    description: (
      <>
        Your quote is ready on the{' '}
        <a href="https://www.google.com/">next page.</a>
      </>
    ),
  },
  fields: [
    {
      variant: 'input',
      fieldName: 'name',
      label: 'Name',
    },
    {
      variant: 'input',
      fieldName: 'email',
      label: 'Email',
    },
  ],
};

const mockSteps: MultistepStep[] = [step1, step2, step3, step4, step5];

const onClose = jest.fn();
const onSubmit = jest.fn();

describe('Multistep', () => {
  test('renders the first step correctly', () => {
    render(
      <Multistep
        header={{ variant: 'logo', src: 'logo.png', onClose }}
        steps={mockSteps}
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByText(step1.question)).toBeInTheDocument();
  });

  test('navigates to the next step correctly', () => {
    render(
      <Multistep
        header={{ variant: 'logo', src: 'logo.png', onClose }}
        steps={mockSteps}
        onSubmit={onSubmit}
      />
    );
    const nextButton = screen.getByText('Continuar');
    fireEvent.click(nextButton);

    expect(screen.getByText(step2.question)).toBeInTheDocument();
  });

  test('navigates through all steps correctly', () => {
    render(
      <Multistep
        header={{ variant: 'logo', src: 'logo.png', onClose }}
        steps={mockSteps}
        onSubmit={onSubmit}
      />
    );
    const nextButton = screen.getByText('Continuar');

    mockSteps.forEach((step, index) => {
      if (!(index < mockSteps.length - 1)) {
        return;
      }

      fireEvent.click(nextButton);
      expect(screen.getByText(step.question)).toBeInTheDocument();
    });
  });
});
