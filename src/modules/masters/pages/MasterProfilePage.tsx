import { Navigate, useParams } from 'react-router-dom';

export default function MasterProfilePage() {
  const { id } = useParams();
  
  if (!id) return <Navigate to="/majstori" replace />;
  
  return <Navigate to={`/profil/${id}`} replace />;
}
