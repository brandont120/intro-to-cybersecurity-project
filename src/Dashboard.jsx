import { useContext } from 'react';
import AuthContext from './AuthContext';
import AdminPanel from './AdminPanel';
import StandardUserView from './StandardUserView';

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  if (user?.role === 'admin') {
    return <AdminPanel />;
  }

  return <StandardUserView />;
}
