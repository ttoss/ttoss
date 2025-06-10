import { Flex, Label, Text } from '@ttoss/ui';
import * as React from 'react';
import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';

export type TooltipProps = {
  label?: string;
  place: 'top' | 'right' | 'bottom' | 'left';
  openOnClick?: boolean;
  clickable?: boolean;
  variant?: 'success' | 'warning' | 'error' | 'info';
  hidden?: boolean;
  setIsOpen?: (value: boolean) => void;
  isOpen?: boolean;
  icon?: string;
};

export const FormFeedbackMessage = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  message,
  maxLines = 2,
  tooltip,
  variant = 'warning',
}: {
  name: TName;
  message?: string | React.ReactNode;
  maxLines?: number;
  tooltip?: TooltipProps;
  variant?: 'success' | 'warning' | 'error' | 'info';
}) => {
  const {
    formState: { errors },
  } = useFormContext();

  const hasError = !!errors[name];
  const messageRef = React.useRef<HTMLDivElement>(null);
  const [isMessageTruncated, setIsMessageTruncated] = React.useState(false);

  // Check if message text is truncated based on max lines
  React.useEffect(() => {
    if (messageRef.current && message) {
      /**
       * Calculate the line height based on the computed style of the message element.
       * and limit the height to the maximum lines specified.
       */
      const computedStyle = window.getComputedStyle(messageRef.current);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) ||
        parseFloat(computedStyle.fontSize) * 1.2;

      const MAX_HEIGHT = lineHeight * maxLines;
      setIsMessageTruncated(messageRef.current.scrollHeight > MAX_HEIGHT);
    }
  }, [message, maxLines]);

  const messageContent = React.useMemo(() => {
    const colorVariant = (() => {
      switch (variant) {
        case 'success':
          return 'feedback.text.positive.default';
        case 'warning':
          return 'feedback.text.caution.default';
        case 'error':
          return 'feedback.text.negative.default';
        case 'info':
          return '';
        default:
          return 'feedback.text.caution.default';
      }
    })();

    if (message && !hasError) {
      return (
        <Flex sx={{ flexDirection: 'column' }}>
          <Text
            sx={{
              fontSize: 'sm',
              color: colorVariant,
            }}
          >
            <div
              ref={messageRef}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                width: 'full',
                fontSize: 'sm',
              }}
            >
              {message}
            </div>
          </Text>
          {isMessageTruncated && (
            <Label
              sx={{
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 'sm',
                color: colorVariant,
              }}
              tooltip={{
                render: (
                  <Flex
                    sx={{
                      width: 'full',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: colorVariant,
                    }}
                  >
                    {message}
                  </Flex>
                ),
                place: tooltip?.place || 'bottom',
                clickable: tooltip?.clickable || true,
                openOnClick: tooltip?.openOnClick || true,
                variant: variant || 'warning',
                ...tooltip,
              }}
            >
              {tooltip?.label || 'View more'}
            </Label>
          )}
        </Flex>
      );
    }
    return null;
  }, [message, hasError, variant, maxLines, isMessageTruncated, tooltip]);

  return messageContent;
};
