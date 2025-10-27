export const filterConfig = {
    bids: {
        allowedKeys: [
            "url",
            "profile",
            "connects",
            "boosted_connects",
            "total",
            "cost",
            "bid_status",
            "id_name",
            "client_name",
            "project_type",
            "price",
            "attend_by",
            "upwork_id"
        ],
        foreignKeys: ["upwork_id"],
    },
    projects: {
        allowedKeys: [
            "status",
            "assign_to"
        ],
        foreignKeys: ["assign_id"]
    },
    milestones: {
        allowedKeys: [
            "status",
            "assign_to"
        ],
        foreignKeys: ["assign_id"]
    },
    tickets: {
        allowedKeys: [
            "status",
            "assign_to"
        ],
        foreignKeys: ["assign_id"]
    },
}