import { filterConfig } from "./filterConfig";

export const buildFilters = (tableName: keyof typeof filterConfig, filters: Record<string, any>) => {
    const config = filterConfig[tableName];
    const where: Record<string, any> = {};

    for (const key of config.allowedKeys) {
        const value = filters[key];

        if (value !== undefined && value !== null && value !== "") {

            // if this field is NOT a foreign key and is a string → do partial match

            if (typeof value === "string" && !config.foreignKeys.includes(key)) {
                where[key] = { contains: value };
            } else {
                where[key] = value;
            }
        }
    }

    return where;
};
