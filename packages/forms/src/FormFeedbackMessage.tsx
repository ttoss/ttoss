import { Flex, Label, Text } from '@ttoss/ui';
import * as React from 'react';
import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';

export type FeedbackTooltipProps = {
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
  feedbackMessage,
  feedbackMaxLines = 2,
  feedbackTooltipProps,
  feedbackTooltipLabel = 'View more',
  feedbackVariant = 'warning',
}: {
  name: TName;
  feedbackMessage?: string | React.ReactNode;
  feedbackMaxLines?: number;
  feedbackTooltipProps?: FeedbackTooltipProps;
  feedbackTooltipLabel?: string;
  feedbackVariant?: 'success' | 'warning' | 'error' | 'info';
}) => {
  const {
    formState: { errors },
  } = useFormContext();

  const hasError = !!errors[name];
  const messageRef = React.useRef<HTMLDivElement>(null);
  const [isMessageTruncated, setIsMessageTruncated] = React.useState(false);

  // Check if message text is truncated based on max lines
  React.useEffect(() => {
    if (messageRef.current && feedbackMessage) {
      /**
       * Calculate the line height based on the computed style of the message element.
       * and limit the height to the maximum lines specified.
       */
      const computedStyle = window.getComputedStyle(messageRef.current);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) ||
        parseFloat(computedStyle.fontSize) * 1.2;

      const MAX_HEIGHT = lineHeight * feedbackMaxLines;
      setIsMessageTruncated(messageRef.current.scrollHeight > MAX_HEIGHT);
    }
  }, [feedbackMessage, feedbackMaxLines]);

  const messageContent = React.useMemo(() => {
    const colorVariant = (() => {
      switch (feedbackVariant) {
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

    if (feedbackMessage && !hasError) {
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
                WebkitLineClamp: feedbackMaxLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                width: 'full',
                fontSize: 'sm',
              }}
            >
              {feedbackMessage}
            </div>
          </Text>
          {isMessageTruncated && feedbackTooltipLabel && (
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
                    {feedbackMessage}
                  </Flex>
                ),
                place: feedbackTooltipProps?.place || 'bottom',
                clickable: true,
                openOnClick: true,
                variant: feedbackVariant || 'warning',
                ...feedbackTooltipProps,
              }}
            >
              {feedbackTooltipLabel}
            </Label>
          )}
        </Flex>
      );
    }
    return null;
  }, [
    feedbackMessage,
    hasError,
    feedbackVariant,
    feedbackMaxLines,
    isMessageTruncated,
    feedbackTooltipProps,
    feedbackTooltipLabel,
  ]);

  return messageContent;
};
