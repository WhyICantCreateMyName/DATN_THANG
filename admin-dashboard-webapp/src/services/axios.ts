import axios from "axios";
import constants from "../constants";

export default axios.create({
    baseURL: process.env.NODE_ENV === 'development' ? constants.url.api.development : constants.url.api.production,
    headers: {
        "Content-Type": "application/json",
        "x-Platform": "web"
    },
    timeout: 10000,
    withCredentials: true,
});

