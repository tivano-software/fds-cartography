import { Configuration } from "../client";

export const API_CONFIG: Configuration = new Configuration({
    middleware: [
        {
            post: async (context): Promise<void | Response> => {
                console.log(context);
                if (context.response.status === 401) {
                    console.error("Status is 401");
                    window.location.assign("/logout.html");
                }
                return context.response;
            },
        }
    ]
});