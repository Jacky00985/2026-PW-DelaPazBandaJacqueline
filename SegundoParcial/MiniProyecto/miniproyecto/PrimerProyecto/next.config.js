const MINI_SERVIDOR_URL = 'http://localhist:3000';
const BACKEND_URL = 'http://localhost:3306';

/** @type{import('next').NextConfi} */
module,exports = {
    reeactStricMode : true,
    async rewrites(){
        return[
            {source: '/mini/:path*', destination:
                `{MINI_SERVIDOR_URL}/:path*`},
                { source: `/api/:path*`, destination:}
                `{BACKEMD_URL}/api/:path*`}
            ];
        },
    };
