import { Request, Response } from 'express';
import prisma from '../utils/Prisma';
import { buildFilters } from '../utils/buildFilters';

// Create a new bid
export const create_bid = async (req: Request, res: Response) => {
    try {
        const {
            url,
            profile,
            connects,
            boosted_connects,
            total,
            cost,
            bid_status,
            upwork_id,
            description,
            client_name,
            project_type,
            price,
            attend_by,
        } = req.body;


        const upwork_profile = await prisma.upwork_ids.findUnique({
            where: { id: upwork_id }
        })

        if (!upwork_profile) {
            return res.status(400).json({ success: false, message: "Provided upwork ID does not exist." })
        }

        const existingProject = await prisma.project_types.findUnique({
            where: { id: project_type },
        });

        if (!existingProject) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid Project ID — no matching project type found." });
        }

        const newBid = await prisma.bids.create({
            data: {
                url,
                profile,
                connects: parseInt(connects),
                boosted_connects: parseInt(boosted_connects),
                total: parseInt(total),
                cost,
                bid_status,
                id_name: upwork_profile.name,
                upwork_profile: { connect: { id: upwork_id } },
                description,
                client_name,
                price,
                attend_by: {
                    connect: { id: attend_by }
                },
                project_type: { connect: { id: project_type } },
            },
        });

        res.status(201).json(newBid);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Get all bids
export const get_all_bids = async (req: Request, res: Response) => {
    try {
        const where = buildFilters("bids", req.query)
        const bids = await prisma.bids.findMany({
            where,
            include: {
                project_type: true,
                attend_by: {
                    include: {
                        user: true
                    }
                }

            },
            orderBy: {
                created_at: 'desc'
            }
        });
        res.status(200).json(bids);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Get a single bid by ID
export const get_bid_by_id = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const bid = await prisma.bids.findUnique({
            where: { id },
        });

        if (!bid) {
            return res.status(404).json({ error: 'Bid not found' });
        }

        res.status(200).json(bid);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Update a bid by ID
export const update_bid = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            created_at,
            url,
            profile,
            connects,
            boosted_connects,
            total,
            cost,
            bid_status,
            upwork_id,
            description,
            client_name,
            project_type,
            price,
            attend_by,
        } = req.body;


        const upwork_profile = await prisma.upwork_ids.findUnique({
            where: { id: upwork_id }
        })

        if (!upwork_profile) {
            return res.status(400).json({ success: false, message: "Provided upwork ID does not exist." })
        }

        const updated_bid = await prisma.bids.update({
            where: { id },
            data: {
                created_at: created_at ? new Date(created_at) : undefined,
                url,
                profile,
                connects: connects ? parseInt(connects) : undefined,
                boosted_connects: boosted_connects ? parseInt(boosted_connects) : undefined,
                total: total ? parseInt(total) : undefined,
                cost,
                bid_status,
                id_name: upwork_profile.name,
                upwork_id: upwork_profile.id,
                description,
                client_name,
                project_type,
                price,
                attend_by,
            },
        });

        res.status(200).json(updated_bid);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a bid by ID
export const delete_bid = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.bids.update({
            where: { id },
            data: {
                bid_status: "deleted"
            }
        });
        res.status(204).send(); // No content
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
