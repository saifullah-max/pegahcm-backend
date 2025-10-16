import { filterConfig } from "./filterConfig";

export const buildFilters = (
    tableName: keyof typeof filterConfig,
    filters: Record<string, any>
) => {
    const config = filterConfig[tableName];
    const where: Record<string, any> = {};

    for (const key of config.allowedKeys) {
        const value = filters[key];
        if (value === undefined || value === null || value === "") continue;

        // RELATION FIELD
        if (config.foreignKeys.includes(key)) {
            // Use `is` for single relation
            where[key] = {
                is: {
                    name: { contains: value, mode: "insensitive" }
                }
            };
        }
        // SCALAR STRING FIELD
        else if (typeof value === "string") {
            where[key] = { contains: value, mode: "insensitive" };
        }
        // OTHER TYPES
        else {
            where[key] = value;
        }
    }

    return where;
};
