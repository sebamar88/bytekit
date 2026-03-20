import { ApiClient, ApiError } from "bytekit";

/**
 * Example: Localized error handling and custom error messages
 */
async function runDemo() {
    const api = new ApiClient({
        baseUrl: "https://api.example.com",
        locale: "es", // Set default to Spanish
        errorMessages: {
            en: {
                401: "Please login to continue",
                404: "The requested user was not found",
            },
            es: {
                401: "Por favor inicia sesión",
                404: "El usuario solicitado no fue encontrado",
            }
        }
    });

    try {
        // This request will fail with 404
        await api.get("/users/missing-id");
    } catch (error) {
        if (error instanceof ApiError) {
            // error.message is automatically localized based on status code and 'locale'
            // Output: "El usuario solicitado no fue encontrado"
            console.log(error.message); 
            
            // You can also access raw details from the server response
            console.error(`Status: ${error.status}, Body:`, error.body);
        }
    }
}
