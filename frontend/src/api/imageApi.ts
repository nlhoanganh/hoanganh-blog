import api from './axiosInstance';

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  // Do NOT set Content-Type manually — the browser must generate it with the
  // multipart boundary (e.g. "multipart/form-data; boundary=----xyz"). Overriding
  // it without a boundary causes Spring/Tomcat to reject the request body.
  const response = await api.post<{ url: string }>('/api/images/upload', formData);
  return response.data.url;
};
