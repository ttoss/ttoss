import { useResponsiveValue, useTheme } from '@ttoss/ui';
import ReactModal from 'react-modal';

ReactModal.defaultStyles = {
  overlay: {},
  content: {},
};

export type ModalProps = ReactModal.Props;

export const Modal = (props: ModalProps) => {
  const { theme } = useTheme();

  const padding =
    useResponsiveValue([
      theme.space?.[2],
      theme.space?.[3],
      theme.space?.[4],
    ]) || 0;

  const style: ReactModal.Styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding,
      ...props.style?.overlay,
    },
    content: {
      /**
       * Theme
       */
      backgroundColor: theme.rawColors?.background?.toString() || '#fff',
      padding,
      /**
       * General
       */
      WebkitOverflowScrolling: 'touch',
      overflow: 'auto',
      position: 'relative',
      top: '0px',
      left: '0px',
      right: '0px',
      bottom: '0px',
      border: '2px solid',
      borderColor: theme.rawColors?.muted?.toString() || '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      ...props.style?.content,
    },
  };

  return <ReactModal {...props} style={style} />;
};

Modal.setAppElement = ReactModal.setAppElement;
