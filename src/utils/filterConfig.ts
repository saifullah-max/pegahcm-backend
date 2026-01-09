interface TableFilterConfig {
    allowedKeys: string[];
    types?: Record<string, "string" | "int" | "float" | "date">; // scalar types
    relationFields?: Record<string, string[]>; // relationName -> fields allowed to filter
}

export const filterConfig: Record<string, TableFilterConfig> = {
    bids: {
        allowedKeys: [
            "url", "profile", "connects", "boosted_connects", "total", "cost",
            "bid_status", "id_name", "client_name", "project_type_id", "price",
            "attend_by", "upwork_id", "upwork_profile", "created_at"
        ],
        types: {
            url: "string",
            profile: "string", // changed to string (UUID)
            connects: "int",
            boosted_connects: "int",
            total: "int",
            cost: "float",
            bid_status: "string",
            id_name: "string",
            client_name: "string",
            project_type_id: "string",
            price: "float",
            attend_by: "int",
            upwork_id: "string", // scalar UUID
            created_at: "date"
        },
        relationFields: {
            upwork_profile: ["name"], // you can filter by name
            attend_by: ["id"],
            project: ["id"]

        },
    },
    projects: {
        allowedKeys: [
            "url", "profile", "connects", "boosted_connects", "total", "cost",
            "bid_status", "id_name", "client_name", "project_type_id", "price",
            "attend_by", "upwork_id", "upwork_profile", "created_at"
        ],
        types: {
            url: "string",
            profile: "string", // changed to string (UUID)
            connects: "int",
            boosted_connects: "int",
            total: "int",
            cost: "float",
            bid_status: "string",
            id_name: "string",
            client_name: "string",
            project_type_id: "string",
            price: "float",
            attend_by: "int",
            upwork_id: "string", // scalar UUID
            created_at: "date"
        },
        relationFields: {
            upwork_profile: ["name"], // you can filter by name
            attend_by: ["id"],
            project: ["id"]

        },
    },
    milestones: {
        allowedKeys: [
            "url", "profile", "connects", "boosted_connects", "total", "cost",
            "bid_status", "id_name", "client_name", "project_type_id", "price",
            "attend_by", "upwork_id", "upwork_profile", "created_at"
        ],
        types: {
            url: "string",
            profile: "string", // changed to string (UUID)
            connects: "int",
            boosted_connects: "int",
            total: "int",
            cost: "float",
            bid_status: "string",
            id_name: "string",
            client_name: "string",
            project_type_id: "string",
            price: "float",
            attend_by: "int",
            upwork_id: "string", // scalar UUID
            created_at: "date"
        },
        relationFields: {
            upwork_profile: ["name"], // you can filter by name
            attend_by: ["id"],
            project: ["id"]

        },
    },
    tickets: {
        allowedKeys: [
            "url", "profile", "connects", "boosted_connects", "total", "cost",
            "bid_status", "id_name", "client_name", "project_type_id", "price",
            "attend_by", "upwork_id", "upwork_profile", "created_at"
        ],
        types: {
            url: "string",
            profile: "string", // changed to string (UUID)
            connects: "int",
            boosted_connects: "int",
            total: "int",
            cost: "float",
            bid_status: "string",
            id_name: "string",
            client_name: "string",
            project_type_id: "string",
            price: "float",
            attend_by: "int",
            upwork_id: "string", // scalar UUID
            created_at: "date"
        },
        relationFields: {
            upwork_profile: ["name"], // you can filter by name
            attend_by: ["id"],
            project: ["id"]

        },
    },
};
