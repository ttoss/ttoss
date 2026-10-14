/** The digits of a card number — what the summary and the store keep. */
export const cardLast4 = (cardNumber: string): string => {
  return cardNumber.replace(/\D/g, '').slice(-4);
};

export const validateCardNumber = (value: string): string | null => {
  const digits = value.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) {
    return 'Enter the 13–19 digits on the front of the card.';
  }
  return null;
};

export const formatPrice = (price: number): string => {
  return price === 0 ? 'Free' : `$${price}`;
};
