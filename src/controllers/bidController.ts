import { Request, Response } from 'express';
import prisma from '../utils/Prisma';

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
            id_name,
            description,
            client_name,
            project_type,
            price,
            attend_by,
        } = req.body;

        const newBid = await prisma.bids.create({
            data: {
                url,
                profile,
                connects: parseInt(connects),
                boosted_connects: parseInt(boosted_connects),
                total: parseInt(total),
                cost,
                bid_status,
                id_name,
                description,
                client_name,
                project_type,
                price,
                attend_by,
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
        const bids = await prisma.bids.findMany();
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
            id_name,
            description,
            client_name,
            project_type,
            price,
            attend_by,
        } = req.body;

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
                id_name,
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
