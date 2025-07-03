import { get, post, put, del } from 'aws-amplify/api';

// API name configured in config.json
const API_NAME = 'MTP-API';

// Helper function to handle API responses
async function handleResponse(response: Promise<any>) {
  try {
    const { body } = await response;
    return await body.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Create a wrapper that matches our existing API patterns
export const amplifyApiClient = {
  // GET request
  get: async (path: string, params?: any) => {
    console.log(`🚀 [Amplify API] GET ${path}`, params);
    
    const { response } = get({
      apiName: API_NAME,
      path: path,
      options: params ? {
        queryParams: params
      } : undefined
    });
    
    return handleResponse(response);
  },

  // POST request
  post: async (path: string, data?: any) => {
    console.log(`🚀 [Amplify API] POST ${path}`, data);
    
    const { response } = post({
      apiName: API_NAME,
      path: path,
      options: data ? {
        body: data
      } : undefined
    });
    
    return handleResponse(response);
  },

  // PUT request
  put: async (path: string, data?: any) => {
    console.log(`🚀 [Amplify API] PUT ${path}`, data);
    
    const { response } = put({
      apiName: API_NAME,
      path: path,
      options: data ? {
        body: data
      } : undefined
    });
    
    return handleResponse(response);
  },

  // DELETE request
  delete: async (path: string) => {
    console.log(`🚀 [Amplify API] DELETE ${path}`);
    
    const { response } = del({
      apiName: API_NAME,
      path: path
    });
    
    return handleResponse(response);
  }
};

// Export for backward compatibility
export default amplifyApiClient;