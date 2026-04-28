import axios from "axios";
import constants from "../constants";

export default axios.create({
    baseURL: constants.url.api.baseUrl,
    headers: {
        "Content-Type": "application/json",
        "x-Platform": "web"
    },
    timeout: 10000,
    withCredentials: true,
});

