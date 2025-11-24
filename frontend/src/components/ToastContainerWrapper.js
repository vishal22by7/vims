import { ToastContainer } from 'react-toastify';
import { useTheme } from '../context/ThemeContext';

const ToastContainerWrapper = () => {
  const { theme } = useTheme();
  
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme === 'dark' ? 'dark' : 'light'}
    />
  );
};

export default ToastContainerWrapper;

