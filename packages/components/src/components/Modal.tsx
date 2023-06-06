import { css as transformStyleObject } from '@theme-ui/css';
import { useResponsiveValue, useTheme } from '@ttoss/ui';
import ReactModal from 'react-modal';

ReactModal.defaultStyles = {
  overlay: {},
  content: {},
};

export type ModalProps = ReactModal.Props;

export const Modal = (props: ModalProps) => {
  const { theme } = useTheme();

  const space = theme.space as Record<string, string>;

  const padding =
    useResponsiveValue([space?.['lg'], space?.['xl'], space?.['xl']]) || 0;

  const style: ReactModal.Styles = {
    overlay: transformStyleObject({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 'modal',
      ...props.style?.overlay,
    })(theme) as any,
    content: transformStyleObject({
      /**
       * Theme
       */
      backgroundColor: 'surface',
      padding,
      border: 'default',
      borderColor: 'surface',
      borderRadius: 'default',
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
      maxHeight: '90%',
      maxWidth: '90%',
      ...props.style?.content,
    })(theme) as any,
  };

  return <ReactModal {...props} style={style} />;
};

Modal.setAppElement = ReactModal.setAppElement;
