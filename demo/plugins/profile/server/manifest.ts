export const manifest = {
    "id": "profile-server",
    "name": "sunbird profile",
    "author": "sunil<sunils@ilimi.in>",
    "version": "1.0",
    "server": {
        "routes": {
            "prefix": "/profile"
        },
        "databases": [{
                "type": "cassandra",
                "path": "db/cassandra",
                "compatibility": "~1.0"
            },
            {
                "type": "es",
                "path": "db/es",
                "compatibility": "~1.0"
            }
        ],
        "dependencies": []
    }
}