import { Navigate } from "react-router-dom"


function PrivateRoute({ children }) {
  const  token  = localStorage.getItem('token')
    console.log("this is token",token)
  if (!token) {
    return <Navigate to="/login" />;
  } else {
    return children;
  }
}

export default PrivateRoute