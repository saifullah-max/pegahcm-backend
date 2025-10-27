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

        // 1️⃣ Relation fields (filter by related table columns)
        if (config.relationFields?.[key]) {
            const relationFilter: Record<string, any> = {};
            for (const field of config.relationFields[key]) {
                // Array relation (like attend_by)
                if (key === "attend_by") {
                    relationFilter.some = { [field]: value };
                } else {
                    relationFilter[field] = { contains: value, mode: "insensitive" };
                }
            }
            where[key] = relationFilter;
            continue;
        }

        // 2️⃣ UUID / ID fields — exact match
        if (key.endsWith("_id")) {
            where[key] = value;
            continue;
        }

        // 3️⃣ Determine field type
        const type = config.types?.[key] || "string";

        // 4️⃣ String fields — partial, case-insensitive match
        if (type === "string") {
            where[key] = { contains: value };
        }

        // 5️⃣ Numeric fields — exact or min/max
        else if (type === "int" || type === "float") {
            const numericFilter: Record<string, any> = {};

            // min/max filters
            if (filters[`${key}_min`] !== undefined && filters[`${key}_min`] !== null && filters[`${key}_min`] !== "") {
                numericFilter.gte = type === "int" ? parseInt(filters[`${key}_min`], 10) : parseFloat(filters[`${key}_min`]);
            }
            if (filters[`${key}_max`] !== undefined && filters[`${key}_max`] !== null && filters[`${key}_max`] !== "") {
                numericFilter.lte = type === "int" ? parseInt(filters[`${key}_max`], 10) : parseFloat(filters[`${key}_max`]);
            }

            // exact match if no min/max
            if (value !== undefined && value !== null && value !== "" && Object.keys(numericFilter).length === 0) {
                numericFilter.equals = type === "int" ? parseInt(value, 10) : parseFloat(value);
            }

            if (Object.keys(numericFilter).length > 0) where[key] = numericFilter;
        }

        // 6️⃣ Date fields — exact or range, flexible formats
        else if (type === "date") {
            const dateValue = filters[key];

            if (dateValue) {
                const start = new Date(dateValue);
                start.setHours(0, 0, 0, 0);

                const end = new Date(dateValue);
                end.setHours(23, 59, 59, 999);

                where[key] = {
                    gte: start,
                    lte: end
                };
            }

            // ✅ If min/max provided separately
            if (filters[`${key}_min`]) {
                const dMin = new Date(filters[`${key}_min`]);
                dMin.setHours(0, 0, 0, 0);
                where[key] = { ...(where[key] || {}), gte: dMin };
            }

            if (filters[`${key}_max`]) {
                const dMax = new Date(filters[`${key}_max`]);
                dMax.setHours(23, 59, 59, 999);
                where[key] = { ...(where[key] || {}), lte: dMax };
            }
        }



        // 7️⃣ Fallback
        else {
            where[key] = value;
        }
    }

    return where;
};
