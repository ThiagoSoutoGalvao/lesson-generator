import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// The Laravel session expires after SESSION_LIFETIME minutes idle, and the CSRF
// token goes stale with it. The SPA shell keeps rendering either way (it was
// loaded while still authenticated), so without this every API call surfaces a
// raw "Unauthenticated." string in the feature's own error box and it reads as
// "the generator is broken" rather than "you were signed out". Send them to the
// login page instead.
axios.interceptors.response.use(
    response => response,
    error => {
        const status = error.response?.status;
        if (status === 401 || status === 419) {
            // Never settles: the page is navigating away, so callers must not
            // run their catch blocks and flash an error on the way out.
            window.location.href = '/login';
            return new Promise(() => {});
        }
        return Promise.reject(error);
    },
);
