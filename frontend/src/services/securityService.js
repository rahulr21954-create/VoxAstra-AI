import api from "./api";

export const getSecurityDashboard = async () => {
  const response = await api.get("/dashboard/security");
  return response.data;
};