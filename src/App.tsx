import { AuthProvider } from './contexts/AuthContext';
import { CallProvider } from './contexts/CallContext';
import DashboardLayout from './pages/DashboardLayout';

function App() {
  return (
    <AuthProvider>
      <CallProvider>
        <DashboardLayout />
      </CallProvider>
    </AuthProvider>
  );
}

export default App;
